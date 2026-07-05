import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface FrontendStackProps extends cdk.StackProps {
    wafWebAclArn?: string;
}

export class FrontendStack extends cdk.Stack {
    public readonly distributionDomainName: string;

    constructor(scope: Construct, id: string, props?: FrontendStackProps) {
        super(scope, id, props);

        const apiUrl = cdk.Fn.importValue('EcommerceApiUrl');
        const wafWebAclArn = props?.wafWebAclArn ?? '';
        const userPoolId = cdk.Fn.importValue('UserPoolId');
        const userPoolClientId = cdk.Fn.importValue('UserPoolClientId');
        const cognitoRegion = cdk.Fn.importValue('CognitoRegion');

        const bucket = new s3.Bucket(this, 'FrontendBucket', {
            bucketName: `ecommerce-frontend-${this.account}-${this.region}`,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            enforceSSL: true,
        });

        const oac = new cloudfront.S3OriginAccessControl(this, 'FrontendOAC', {
            originAccessControlName: 'EcommerceFrontendOAC',
            description: 'OAC for EcommerceFrontend S3 bucket — read-only',
            signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
        });

        const securityHeadersPolicy = cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS;
        const s3Origin = cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(
            bucket,
            { originAccessControl: oac },
        );

        const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
            comment: 'Ecommerce platform — React SPA',

            defaultRootObject: 'index.html',

            webAclId: cdk.Token.asString(wafWebAclArn),
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
            priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
            enableIpv6: true,
            defaultBehavior: {
                origin: s3Origin,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                compress: true,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                responseHeadersPolicy: securityHeadersPolicy,
                originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
            },

            additionalBehaviors: {
                '/assets/*': {
                    origin: s3Origin,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    compress: true,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                    responseHeadersPolicy: securityHeadersPolicy,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                },
            },

            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(0),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(0),
                },
            ],
        });

        // Cho phép CloudFront đọc nội dung từ bucket.
        bucket.addToResourcePolicy(
            new iam.PolicyStatement({
                sid: 'AllowCloudFrontServicePrincipal',
                effect: iam.Effect.ALLOW,
                principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
                actions: ['s3:GetObject'],
                resources: [bucket.arnForObjects('*')],
                conditions: {
                    StringEquals: {
                        'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
                    },
                },
            }),
        );

        // Upload build frontend và config runtime.
        new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
            sources: [
                s3deploy.Source.asset(
                    path.join(__dirname, '../../frontend/dist'),
                ),
                s3deploy.Source.jsonData('config.json', {
                    apiUrl: apiUrl,
                    cognito: {
                        userPoolId: userPoolId,
                        clientId: userPoolClientId,
                        region: cognitoRegion,
                    },
                }),
            ],
            destinationBucket: bucket,
            distribution,
            distributionPaths: ['/index.html', '/config.json'],
            retainOnDelete: false,
        });

        this.distributionDomainName = distribution.distributionDomainName;
        new cdk.CfnOutput(this, 'FrontendBucketName', {
            value: bucket.bucketName,
            description: 'S3 bucket hosting the React SPA assets',
            exportName: 'FrontendBucketName',
        });

        new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
            value: distribution.distributionId,
            description: 'CloudFront distribution ID (use for manual cache invalidations)',
            exportName: 'CloudFrontDistributionId',
        });

        new cdk.CfnOutput(this, 'CloudFrontDomainName', {
            value: distribution.distributionDomainName,
            description: 'CloudFront domain — set this as ALLOWED_ORIGIN in ApiStack for prod',
            exportName: 'CloudFrontDomainName',
        });

        new cdk.CfnOutput(this, 'FrontendUrl', {
            value: `https://${distribution.distributionDomainName}`,
            description: 'Public HTTPS URL of the deployed frontend',
            exportName: 'FrontendUrl',
        });

        cdk.Tags.of(this).add('Project', 'Ecommerce');
        cdk.Tags.of(this).add('Environment', 'Development');
    }
}
