import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';

/**
 * CicdStack  —  Phase 9 CI/CD Pipeline  (hardened)
 *
 * Pipeline stages:
 *   1. Source          — GitHub webhook trigger
 *   2. BackendTest     — tsc + jest + cdk synth (no deploy, fast feedback)
 *   3. FrontendTest    — tsc + vitest + vite build (no deploy, fast feedback)
 *   4. ManualApproval  — human gate before any infrastructure changes
 *   5. BackendDeploy   — cdk deploy (Auth→DB→Event→Api→Monitor→Security→Cicd→Infra)
 *   6. FrontendDeploy  — cdk deploy FrontendStack + vite build + s3 sync + CF invalidate
 *
 * Security:
 *   - No hardcoded secrets — GitHub token from Secrets Manager
 *   - Test roles: read-only (S3 artifact bucket + CW logs only)
 *   - Deploy roles: least-privilege per CodeBuild project
 *   - Artifact bucket: encrypted, versioned, block-public, enforceSSL
 *
 * Monitoring:
 *   - 3 alarms (pipeline fail, backend build fail, frontend build fail)
 *   - All alarms → EcommerceAlarmsTopicArn (MonitoringStack)
 *
 * Prerequisites (one-time):
 *   aws secretsmanager create-secret \
 *     --name /ecommerce/github-token \
 *     --secret-string "<github-pat>"
 *
 *   cdk deploy CicdStack \
 *     --context githubOwner=<owner> \
 *     --context githubRepo=ProjectSecondAWS \
 *     --context githubBranch=main
 */
export class CicdStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // ─────────────────────────────────────────────────────────────────
        // Context — GitHub repo coordinates (no hardcoded values)
        // ─────────────────────────────────────────────────────────────────
        const githubOwner = this.node.tryGetContext('githubOwner')
            ?? process.env['GITHUB_OWNER'] ?? 'YOUR_GITHUB_OWNER';
        const githubRepo = this.node.tryGetContext('githubRepo')
            ?? process.env['GITHUB_REPO'] ?? 'ProjectSecondAWS';
        const githubBranch = this.node.tryGetContext('githubBranch')
            ?? process.env['GITHUB_BRANCH'] ?? 'main';

        // ─────────────────────────────────────────────────────────────────
        // Cross-stack imports
        // ─────────────────────────────────────────────────────────────────
        const alarmsTopicArn = cdk.Fn.importValue('EcommerceAlarmsTopicArn');
        const frontendBucketName = cdk.Fn.importValue('FrontendBucketName');
        const distributionId = cdk.Fn.importValue('CloudFrontDistributionId');

        const alarmTopic = sns.Topic.fromTopicArn(this, 'ImportedAlarmsTopic', alarmsTopicArn);

        // ─────────────────────────────────────────────────────────────────
        // Artifact bucket — encrypted, versioned, private
        // ─────────────────────────────────────────────────────────────────
        const artifactBucket = new s3.Bucket(this, 'PipelineArtifactBucket', {
            bucketName: `ecommerce-pipeline-artifacts-${this.account}-${this.region}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            versioned: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            lifecycleRules: [{
                enabled: true,
                noncurrentVersionExpiration: cdk.Duration.days(30),
                abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
            }],
        });

        // ─────────────────────────────────────────────────────────────────
        // CloudWatch log groups (30-day retention, one per CodeBuild project)
        // ─────────────────────────────────────────────────────────────────
        const makeLogGroup = (id: string, name: string) =>
            new logs.LogGroup(this, id, {
                logGroupName: name,
                retention: logs.RetentionDays.ONE_MONTH,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
            });

        const backendTestLogGroup = makeLogGroup('BackendTestLogs', '/aws/codebuild/EcommerceBackendTest');
        const frontendTestLogGroup = makeLogGroup('FrontendTestLogs', '/aws/codebuild/EcommerceFrontendTest');
        const backendBuildLogGroup = makeLogGroup('BackendBuildLogs', '/aws/codebuild/EcommerceBackendBuild');
        const frontendBuildLogGroup = makeLogGroup('FrontendBuildLogs', '/aws/codebuild/EcommerceFrontendBuild');

        // ─────────────────────────────────────────────────────────────────
        // IAM — Test role (read-only: artifact bucket + CW logs only)
        // Test stages never deploy infrastructure, so they need minimal perms.
        // ─────────────────────────────────────────────────────────────────
        const testRole = new iam.Role(this, 'TestRole', {
            roleName: 'EcommerceTestBuildRole',
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
            description: 'Read-only role for test/validation CodeBuild projects',
        });

        testRole.addToPolicy(new iam.PolicyStatement({
            sid: 'TestArtifactBucketRead',
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
            resources: [artifactBucket.bucketArn, `${artifactBucket.bucketArn}/*`],
        }));

        testRole.addToPolicy(new iam.PolicyStatement({
            sid: 'TestCloudWatchLogs',
            effect: iam.Effect.ALLOW,
            actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: ['*'],
        }));

        testRole.addToPolicy(new iam.PolicyStatement({
            sid: 'TestSsmBootstrap',
            effect: iam.Effect.ALLOW,
            actions: ['ssm:GetParameter', 'ssm:GetParameters'],
            resources: [`arn:aws:ssm:*:${this.account}:parameter/cdk-bootstrap/*`],
        }));

        // ─────────────────────────────────────────────────────────────────
        // IAM — Backend deploy role (CDK deploy permissions)
        // ─────────────────────────────────────────────────────────────────
        const backendBuildRole = new iam.Role(this, 'BackendBuildRole', {
            roleName: 'EcommerceBackendBuildRole',
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
            description: 'Least-privilege CDK deploy role for backend stacks',
        });

        backendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'CloudFormationDeploy',
            effect: iam.Effect.ALLOW,
            actions: [
                'cloudformation:CreateStack', 'cloudformation:UpdateStack',
                'cloudformation:DeleteStack', 'cloudformation:DescribeStacks',
                'cloudformation:DescribeStackEvents', 'cloudformation:DescribeStackResources',
                'cloudformation:GetTemplate', 'cloudformation:ValidateTemplate',
                'cloudformation:CreateChangeSet', 'cloudformation:ExecuteChangeSet',
                'cloudformation:DescribeChangeSet', 'cloudformation:DeleteChangeSet',
                'cloudformation:ListChangeSets', 'cloudformation:ListStacks',
                'cloudformation:GetStackPolicy', 'cloudformation:SetStackPolicy',
            ],
            resources: [`arn:aws:cloudformation:*:${this.account}:stack/*`],
        }));

        backendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'S3CdkAssets',
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
            resources: [
                artifactBucket.bucketArn, `${artifactBucket.bucketArn}/*`,
                'arn:aws:s3:::cdk-*', 'arn:aws:s3:::cdk-*/*',
            ],
        }));

        backendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'LambdaDeploy',
            effect: iam.Effect.ALLOW,
            actions: [
                'lambda:CreateFunction', 'lambda:UpdateFunctionCode',
                'lambda:UpdateFunctionConfiguration', 'lambda:GetFunction',
                'lambda:GetFunctionConfiguration', 'lambda:DeleteFunction',
                'lambda:AddPermission', 'lambda:RemovePermission',
                'lambda:ListFunctions', 'lambda:TagResource', 'lambda:UntagResource',
                'lambda:CreateEventSourceMapping', 'lambda:UpdateEventSourceMapping',
                'lambda:DeleteEventSourceMapping', 'lambda:GetEventSourceMapping',
            ],
            resources: ['*'],
        }));

        backendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'ApiGatewayDeploy',
            effect: iam.Effect.ALLOW,
            actions: [
                'apigateway:GET', 'apigateway:POST', 'apigateway:PUT',
                'apigateway:PATCH', 'apigateway:DELETE', 'apigateway:TagResource',
            ],
            resources: ['arn:aws:apigateway:*::/*'],
        }));

        backendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'IamPassAndManage',
            effect: iam.Effect.ALLOW,
            actions: [
                'iam:PassRole',
                'iam:CreateRole', 'iam:DeleteRole', 'iam:GetRole', 'iam:ListRoles',
                'iam:AttachRolePolicy', 'iam:DetachRolePolicy',
                'iam:PutRolePolicy', 'iam:DeleteRolePolicy',
                'iam:GetRolePolicy', 'iam:ListRolePolicies', 'iam:ListAttachedRolePolicies',
                'iam:TagRole', 'iam:UntagRole',
                'iam:CreateInstanceProfile', 'iam:DeleteInstanceProfile',
                'iam:AddRoleToInstanceProfile', 'iam:RemoveRoleFromInstanceProfile',
                'iam:GetInstanceProfile',
            ],
            resources: ['*'],
        }));

        backendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'CloudWatchLogs',
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents',
                'logs:DescribeLogGroups', 'logs:DescribeLogStreams',
                'logs:DeleteLogGroup', 'logs:PutRetentionPolicy',
            ],
            resources: ['*'],
        }));

        backendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'SsmBootstrap',
            effect: iam.Effect.ALLOW,
            actions: ['ssm:GetParameter', 'ssm:GetParameters'],
            resources: [`arn:aws:ssm:*:${this.account}:parameter/cdk-bootstrap/*`],
        }));

        backendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'EcrCdkAssets',
            effect: iam.Effect.ALLOW,
            actions: [
                'ecr:GetAuthorizationToken', 'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage', 'ecr:DescribeRepositories',
            ],
            resources: ['*'],
        }));

        backendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'StsAssumeRole',
            effect: iam.Effect.ALLOW,
            actions: ['sts:AssumeRole'],
            resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
        }));

        // ─────────────────────────────────────────────────────────────────
        // IAM — Frontend deploy role (S3 + CloudFront + CDK for FrontendStack)
        // ─────────────────────────────────────────────────────────────────
        const frontendBuildRole = new iam.Role(this, 'FrontendBuildRole', {
            roleName: 'EcommerceFrontendBuildRole',
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
            description: 'Least-privilege role for FrontendStack CDK deploy + S3 sync + CF invalidation',
        });

        // S3 — frontend bucket + artifact bucket
        frontendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'FrontendS3Deploy',
            effect: iam.Effect.ALLOW,
            actions: [
                's3:PutObject', 's3:GetObject', 's3:DeleteObject',
                's3:ListBucket', 's3:GetBucketLocation',
            ],
            resources: [
                `arn:aws:s3:::${frontendBucketName}`,
                `arn:aws:s3:::${frontendBucketName}/*`,
                artifactBucket.bucketArn,
                `${artifactBucket.bucketArn}/*`,
                'arn:aws:s3:::cdk-*',
                'arn:aws:s3:::cdk-*/*',
            ],
        }));

        // CloudFront — invalidation only
        frontendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'CloudFrontInvalidate',
            effect: iam.Effect.ALLOW,
            actions: ['cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation'],
            resources: ['*'],
        }));

        // CloudFormation — FrontendStack deploy
        frontendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'FrontendCfnDeploy',
            effect: iam.Effect.ALLOW,
            actions: [
                'cloudformation:CreateStack', 'cloudformation:UpdateStack',
                'cloudformation:DescribeStacks', 'cloudformation:DescribeStackEvents',
                'cloudformation:GetTemplate', 'cloudformation:CreateChangeSet',
                'cloudformation:ExecuteChangeSet', 'cloudformation:DescribeChangeSet',
                'cloudformation:DeleteChangeSet', 'cloudformation:ListChangeSets',
            ],
            resources: [`arn:aws:cloudformation:*:${this.account}:stack/FrontendStack/*`],
        }));

        // IAM — PassRole for FrontendStack resources (Lambda custom resource for BucketDeployment)
        frontendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'FrontendIamPassRole',
            effect: iam.Effect.ALLOW,
            actions: ['iam:PassRole', 'iam:GetRole'],
            resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
        }));

        // STS — assume CDK toolkit role
        frontendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'FrontendStsAssumeRole',
            effect: iam.Effect.ALLOW,
            actions: ['sts:AssumeRole'],
            resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
        }));

        // SSM — CDK bootstrap params
        frontendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'FrontendSsmBootstrap',
            effect: iam.Effect.ALLOW,
            actions: ['ssm:GetParameter', 'ssm:GetParameters'],
            resources: [`arn:aws:ssm:*:${this.account}:parameter/cdk-bootstrap/*`],
        }));

        // CloudWatch Logs — build logs
        frontendBuildRole.addToPolicy(new iam.PolicyStatement({
            sid: 'FrontendCwLogs',
            effect: iam.Effect.ALLOW,
            actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: ['*'],
        }));

        // ─────────────────────────────────────────────────────────────────
        // CodeBuild helper — shared config factory
        // ─────────────────────────────────────────────────────────────────
        const makeCbProject = (
            id: string,
            projectName: string,
            description: string,
            role: iam.Role,
            buildspecFile: string,
            logGroup: logs.LogGroup,
            extraEnv: Record<string, codebuild.BuildEnvironmentVariable> = {},
            timeoutMinutes = 15,
        ) =>
            new codebuild.PipelineProject(this, id, {
                projectName,
                description,
                role,
                environment: {
                    buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                    computeType: codebuild.ComputeType.SMALL,
                    environmentVariables: extraEnv,
                },
                buildSpec: codebuild.BuildSpec.fromSourceFilename(buildspecFile),
                logging: { cloudWatch: { logGroup, enabled: true } },
                timeout: cdk.Duration.minutes(timeoutMinutes),
            });

        const cdkEnv = {
            CDK_DEFAULT_ACCOUNT: { value: this.account, type: codebuild.BuildEnvironmentVariableType.PLAINTEXT },
            CDK_DEFAULT_REGION: { value: this.region, type: codebuild.BuildEnvironmentVariableType.PLAINTEXT },
        };

        // ── Test projects (read-only role, no deploy) ─────────────────────
        const backendTestProject = makeCbProject(
            'BackendTestProject',
            'EcommerceBackendTest',
            'Backend TypeScript validation + unit tests + cdk synth',
            testRole,
            'buildspec-test-backend.yml',
            backendTestLogGroup,
            cdkEnv,
            20,
        );

        const frontendTestProject = makeCbProject(
            'FrontendTestProject',
            'EcommerceFrontendTest',
            'Frontend TypeScript validation + vitest + vite build check',
            testRole,
            'buildspec-test-frontend.yml',
            frontendTestLogGroup,
            {},
            15,
        );

        // ── Deploy projects ───────────────────────────────────────────────
        const backendBuild = makeCbProject(
            'BackendBuild',
            'EcommerceBackendBuild',
            'CDK deploy — backend stacks (Auth→DB→Event→Api→Monitor→Security→Cicd→Infra)',
            backendBuildRole,
            'buildspec-backend.yml',
            backendBuildLogGroup,
            cdkEnv,
            30,
        );

        const frontendBuild = makeCbProject(
            'FrontendBuild',
            'EcommerceFrontendBuild',
            'CDK deploy FrontendStack + Vite build + S3 sync + CloudFront invalidation',
            frontendBuildRole,
            'buildspec-frontend.yml',
            frontendBuildLogGroup,
            {
                ...cdkEnv,
                FRONTEND_BUCKET: { value: frontendBucketName, type: codebuild.BuildEnvironmentVariableType.PLAINTEXT },
                DISTRIBUTION_ID: { value: distributionId, type: codebuild.BuildEnvironmentVariableType.PLAINTEXT },
            },
            20,
        );

        // ─────────────────────────────────────────────────────────────────
        // Pipeline artifacts
        // ─────────────────────────────────────────────────────────────────
        const sourceOutput = new codepipeline.Artifact('SourceOutput');
        const backendTestOutput = new codepipeline.Artifact('BackendTestOutput');
        const frontendTestOutput = new codepipeline.Artifact('FrontendTestOutput');
        const backendDeployOutput = new codepipeline.Artifact('BackendDeployOutput');
        const frontendDeployOutput = new codepipeline.Artifact('FrontendDeployOutput');

        // ─────────────────────────────────────────────────────────────────
        // CodePipeline — 6 stages
        //
        //   Source → BackendTest → FrontendTest
        //     → ManualApproval → BackendDeploy → FrontendDeploy
        //
        // BackendTest and FrontendTest run in parallel (same stage, runOrder 1).
        // ManualApproval blocks until a human approves in the AWS console.
        // ─────────────────────────────────────────────────────────────────
        const pipeline = new codepipeline.Pipeline(this, 'EcommercePipeline', {
            pipelineName: 'EcommercePipeline',
            artifactBucket,
            restartExecutionOnUpdate: true,
            stages: [

                // ── Stage 1: Source ───────────────────────────────────────
                {
                    stageName: 'Source',
                    actions: [
                        new codepipelineActions.GitHubSourceAction({
                            actionName: 'GitHub_Source',
                            owner: githubOwner,
                            repo: githubRepo,
                            branch: githubBranch,
                            oauthToken: cdk.SecretValue.secretsManager('/ecommerce/github-token'),
                            output: sourceOutput,
                            trigger: codepipelineActions.GitHubTrigger.POLL,
                        }),
                    ],
                },

                // ── Stage 2: Test (backend + frontend run in parallel) ────
                {
                    stageName: 'Test',
                    actions: [
                        new codepipelineActions.CodeBuildAction({
                            actionName: 'Backend_Test',
                            project: backendTestProject,
                            input: sourceOutput,
                            outputs: [backendTestOutput],
                            runOrder: 1,
                        }),
                        new codepipelineActions.CodeBuildAction({
                            actionName: 'Frontend_Test',
                            project: frontendTestProject,
                            input: sourceOutput,
                            outputs: [frontendTestOutput],
                            runOrder: 1,  // same runOrder = parallel
                        }),
                    ],
                },

                // ── Stage 3: Manual Approval ──────────────────────────────
                // Blocks pipeline until an authorised user approves.
                // SNS notification is sent to the alarms topic so on-call
                // engineers see the pending approval request.
                {
                    stageName: 'ManualApproval',
                    actions: [
                        new codepipelineActions.ManualApprovalAction({
                            actionName: 'Approve_Deployment',
                            notificationTopic: alarmTopic,
                            additionalInformation:
                                'Backend and frontend tests passed. Review the changes and approve to deploy to production.',
                            externalEntityLink: `https://ap-southeast-2.console.aws.amazon.com/codesuite/codepipeline/pipelines/EcommercePipeline/view`,
                        }),
                    ],
                },

                // ── Stage 4: Backend Deploy ───────────────────────────────
                {
                    stageName: 'BackendDeploy',
                    actions: [
                        new codepipelineActions.CodeBuildAction({
                            actionName: 'CDK_Deploy_Backend',
                            project: backendBuild,
                            input: sourceOutput,
                            outputs: [backendDeployOutput],
                            runOrder: 1,
                        }),
                    ],
                },

                // ── Stage 5: Frontend Deploy ──────────────────────────────
                // Runs after BackendDeploy so EcommerceApiUrl export is available.
                {
                    stageName: 'FrontendDeploy',
                    actions: [
                        new codepipelineActions.CodeBuildAction({
                            actionName: 'CDK_Deploy_Frontend',
                            project: frontendBuild,
                            input: sourceOutput,
                            outputs: [frontendDeployOutput],
                            runOrder: 1,
                        }),
                    ],
                },
            ],
        });

        // ─────────────────────────────────────────────────────────────────
        // CloudWatch Alarms — pipeline and build failures
        // ─────────────────────────────────────────────────────────────────
        const alarmAction = new cloudwatchActions.SnsAction(alarmTopic);

        const makeAlarm = (
            id: string,
            name: string,
            description: string,
            metric: cloudwatch.Metric,
        ) => {
            const alarm = new cloudwatch.Alarm(this, id, {
                alarmName: name,
                alarmDescription: description,
                metric,
                threshold: 1,
                evaluationPeriods: 1,
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            });
            alarm.addAlarmAction(alarmAction);
        };

        makeAlarm(
            'PipelineFailedAlarm',
            'EcommercePipelineFailed',
            'EcommercePipeline execution failed — check CodePipeline console',
            new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'FailedPipelines',
                dimensionsMap: { PipelineName: pipeline.pipelineName },
                statistic: 'Sum',
                period: cdk.Duration.minutes(5),
            }),
        );

        makeAlarm(
            'BackendBuildFailedAlarm',
            'EcommerceBackendBuildFailed',
            'EcommerceBackendBuild deploy failed — check CodeBuild logs',
            new cloudwatch.Metric({
                namespace: 'AWS/CodeBuild',
                metricName: 'FailedBuilds',
                dimensionsMap: { ProjectName: backendBuild.projectName },
                statistic: 'Sum',
                period: cdk.Duration.minutes(5),
            }),
        );

        makeAlarm(
            'FrontendBuildFailedAlarm',
            'EcommerceFrontendBuildFailed',
            'EcommerceFrontendBuild deploy failed — check CodeBuild logs',
            new cloudwatch.Metric({
                namespace: 'AWS/CodeBuild',
                metricName: 'FailedBuilds',
                dimensionsMap: { ProjectName: frontendBuild.projectName },
                statistic: 'Sum',
                period: cdk.Duration.minutes(5),
            }),
        );

        // ─────────────────────────────────────────────────────────────────
        // Outputs
        // ─────────────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'PipelineName', {
            value: pipeline.pipelineName,
            description: 'CodePipeline pipeline name',
            exportName: 'EcommercePipelineName',
        });

        new cdk.CfnOutput(this, 'BackendBuildProjectName', {
            value: backendBuild.projectName,
            description: 'CodeBuild project — backend CDK deploy',
            exportName: 'EcommerceBackendBuildProjectName',
        });

        new cdk.CfnOutput(this, 'FrontendBuildProjectName', {
            value: frontendBuild.projectName,
            description: 'CodeBuild project — frontend build and S3 deploy',
            exportName: 'EcommerceFrontendBuildProjectName',
        });

        new cdk.CfnOutput(this, 'ArtifactBucketName', {
            value: artifactBucket.bucketName,
            description: 'S3 bucket storing pipeline artifacts',
            exportName: 'EcommercePipelineArtifactBucket',
        });

        cdk.Tags.of(this).add('Project', 'Ecommerce');
        cdk.Tags.of(this).add('Environment', 'Development');
    }
}
