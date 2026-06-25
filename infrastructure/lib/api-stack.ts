import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';
import 'dotenv/config';
/**
 * ApiStack  v2  —  production-ready
 *
 * Architecture:
 *   API Gateway (EcommerceApi)  ← throttled 100 rps / 200 burst
 *     ├── Cognito Authorizer    ← existing UserPool, no new resource
 *     ├── ProductServiceFunction  (ARM64, Node 22, read-only DynamoDB)
 *     ├── CartServiceFunction     (ARM64, Node 22, CRUD DynamoDB)
 *     └── OrderServiceFunction    (ARM64, Node 22, read/write DynamoDB)
 *
 * Authorization:
 *   PUBLIC    → GET /products, GET /products/{id}
 *   PROTECTED → /cart/* and /orders/* (Cognito JWT)
 *
 * DynamoDB access patterns:
 *   GSI1  → product catalog by category   (ProductService)
 *   GSI2  → user order history by date    (OrderService)
 *   GSI3  → product list by status        (Admin Phase 6 — seeded at write time)
 *
 * Cross-stack imports  (Fn.importValue — no CDK graph dependency):
 *   UserPoolId          ← AuthStack
 *   EcommerceTableName  ← DatabaseStack
 *   EcommerceTableArn   ← DatabaseStack
 *
 * Phase 6 integration:
 *   OrderServiceFunction publishes OrderCreated events to EcommerceEventBus.
 *   EVENT_BUS_NAME env var is injected; IAM grants events:PutEvents on the bus ARN.
 *   EventBusArn is imported via Fn.importValue('EcommerceEventBusArn').
 */
export class ApiStack extends cdk.Stack {
    /** Base URL of the deployed API — forwarded to FrontendStack. */
    public readonly apiUrl: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // ─────────────────────────────────────────────────────────────────
        // Cross-stack imports
        // ─────────────────────────────────────────────────────────────────
        const userPoolId = cdk.Fn.importValue('UserPoolId');
        const tableName = cdk.Fn.importValue('EcommerceTableName');
        const tableArn = cdk.Fn.importValue('EcommerceTableArn');
        // Phase 6 — imported from EventStack for OrderService EventBridge access
        const eventBusArn = cdk.Fn.importValue('EcommerceEventBusArn');

        // Reconstruct IUserPool from the imported physical ID.
        // fromUserPoolId() creates no new Cognito resource.
        const userPool = cognito.UserPool.fromUserPoolId(
            this,
            'ImportedUserPool',
            userPoolId,
        );

        // ─────────────────────────────────────────────────────────────────
        // Allowed CORS origin
        //
        // In development: localhost:5173 (Vite default).
        // In production:  set ALLOWED_ORIGIN to the CloudFront distribution
        //                 URL before deploying.
        // ─────────────────────────────────────────────────────────────────
        const allowedOrigin =
            process.env['ALLOWED_ORIGIN'] ?? 'http://localhost:5173';

        // ─────────────────────────────────────────────────────────────────
        // Shared NodejsFunction defaults
        //
        // • AWS SDK v3 is BUNDLED — self-contained, runtime-independent.
        // • Log groups created explicitly (logRetention is deprecated in CDK 2.x).
        // ─────────────────────────────────────────────────────────────────

        // Per-function log groups — 30 days (production compliance requirement)
        const productLogGroup = new logs.LogGroup(this, 'ProductServiceLogs', {
            logGroupName: '/aws/lambda/ProductServiceFunction',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const cartLogGroup = new logs.LogGroup(this, 'CartServiceLogs', {
            logGroupName: '/aws/lambda/CartServiceFunction',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const orderLogGroup = new logs.LogGroup(this, 'OrderServiceLogs', {
            logGroupName: '/aws/lambda/OrderServiceFunction',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const LAMBDA_DEFAULTS: Omit<lambdaNodejs.NodejsFunctionProps, 'entry' | 'logGroup'> = {
            runtime: lambda.Runtime.NODEJS_22_X,
            architecture: lambda.Architecture.ARM_64,
            memorySize: 512,
            timeout: cdk.Duration.seconds(10),
            environment: {
                TABLE_NAME: tableName,
                ALLOWED_ORIGIN: allowedOrigin,
                NODE_OPTIONS: '--enable-source-maps',
                EVENT_BUS_NAME: 'EcommerceEventBus',
            },
            bundling: {
                // Bundle everything including @aws-sdk/* to avoid runtime
                // version mismatches when AWS updates the managed layer.
                minify: true,
                sourceMap: true,   // required for readable stack traces
                target: 'node22',
                forceDockerBundling: false,  // use local esbuild — no Docker required
            },
            // X-Ray active tracing — Phase 6 hardening (OrderService traces all downstream calls)
            tracing: lambda.Tracing.ACTIVE,
        };

        // ─────────────────────────────────────────────────────────────────
        // ProductServiceFunction
        // IAM: GetItem + Query only — no Scan, no BatchGetItem.
        // GSI access via `tableArn/index/*` is needed for GSI1 category
        // queries.  GetItem only needs the table itself, but scoping to
        // index/* allows the same statement to cover future GSI reads.
        // ─────────────────────────────────────────────────────────────────
        const productFn = new lambdaNodejs.NodejsFunction(
            this,
            'ProductServiceFunction',
            {
                ...LAMBDA_DEFAULTS,
                functionName: 'ProductServiceFunction',
                description: 'GET /products — public product catalog',
                entry: path.join(__dirname, '../src/lambda/products/index.ts'),
                handler: 'handler',
                logGroup: productLogGroup,
            },
        );

        productFn.addToRolePolicy(
            new iam.PolicyStatement({
                sid: 'ProductDynamoReadOnly',
                effect: iam.Effect.ALLOW,
                actions: [
                    'dynamodb:GetItem',
                    'dynamodb:Query',
                ],
                resources: [tableArn, `${tableArn}/index/*`],
            }),
        );

        // ─────────────────────────────────────────────────────────────────
        // CartServiceFunction
        // IAM split: point reads/writes use the base table only; the Query
        // for getCart uses the main table (PK+SK prefix) — no index needed.
        // ─────────────────────────────────────────────────────────────────
        const cartFn = new lambdaNodejs.NodejsFunction(
            this,
            'CartServiceFunction',
            {
                ...LAMBDA_DEFAULTS,
                functionName: 'CartServiceFunction',
                description: 'GET/POST/PUT/DELETE /cart — user cart management',
                entry: path.join(__dirname, '../src/lambda/cart/index.ts'),
                handler: 'handler',
                logGroup: cartLogGroup,
            },
        );

        cartFn.addToRolePolicy(
            new iam.PolicyStatement({
                sid: 'CartDynamoPointAccess',
                effect: iam.Effect.ALLOW,
                actions: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                ],
                // Point reads/writes only need the base table
                resources: [tableArn],
            }),
        );

        cartFn.addToRolePolicy(
            new iam.PolicyStatement({
                sid: 'CartDynamoQuery',
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:Query'],
                // getCart queries main table by PK prefix (no GSI needed)
                resources: [tableArn],
            }),
        );

        // ─────────────────────────────────────────────────────────────────
        // OrderServiceFunction
        // IAM: GetItem + PutItem + Query.
        // Orders are immutable once placed — UpdateItem/DeleteItem excluded.
        // GSI2 (user order history) requires `tableArn/index/*`.
        // ─────────────────────────────────────────────────────────────────
        const orderFn = new lambdaNodejs.NodejsFunction(
            this,
            'OrderServiceFunction',
            {
                ...LAMBDA_DEFAULTS,
                functionName: 'OrderServiceFunction',
                description: 'POST/GET /orders — order placement and history',
                entry: path.join(__dirname, '../src/lambda/orders/index.ts'),
                handler: 'handler',
                logGroup: orderLogGroup,
            },
        );

        orderFn.addToRolePolicy(
            new iam.PolicyStatement({
                sid: 'OrderDynamoReadWrite',
                effect: iam.Effect.ALLOW,
                actions: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:Query',
                ],
                // Query on GSI2 requires the index resource
                resources: [tableArn, `${tableArn}/index/*`],
            }),
        );

        // Phase 6 — OrderService publishes OrderCreated events to EventBridge
        orderFn.addToRolePolicy(
            new iam.PolicyStatement({
                sid: 'OrderEventBridgePutEvents',
                effect: iam.Effect.ALLOW,
                actions: ['events:PutEvents'],
                resources: [eventBusArn],
            }),
        );

        // ─────────────────────────────────────────────────────────────────
        // CloudWatch access log group — 30-day retention
        // ─────────────────────────────────────────────────────────────────
        const accessLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
            logGroupName: '/aws/apigateway/EcommerceApi',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // ─────────────────────────────────────────────────────────────────
        // REST API Gateway
        //
        // Throttling:   100 rps steady-state / 200 burst
        // CORS:         explicit origin (not "*") + credentials
        // Access logs:  JSON structured, 30-day retention
        // ─────────────────────────────────────────────────────────────────
        const api = new apigateway.RestApi(this, 'EcommerceApi', {
            restApiName: 'EcommerceApi',
            description: 'Ecommerce platform — REST API v2',

            deployOptions: {
                stageName: 'prod',

                // Throttling
                throttlingRateLimit: 100,
                throttlingBurstLimit: 200,

                // Access logging
                accessLogDestination: new apigateway.LogGroupLogDestination(
                    accessLogGroup,
                ),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
                    caller: true,
                    httpMethod: true,
                    ip: true,
                    protocol: true,
                    requestTime: true,
                    resourcePath: true,
                    responseLength: true,
                    status: true,
                    user: true,
                }),
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: false,   // never log request/response bodies
                metricsEnabled: true,
            },

            // CORS preflight — explicit origin required for credentialed requests
            defaultCorsPreflightOptions: {
                allowOrigins: [allowedOrigin],
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Amz-Date',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                ],
                allowCredentials: true,
            },
        });

        // ─────────────────────────────────────────────────────────────────
        // Cognito Authorizer — EXISTING UserPool, no new resource created
        // ─────────────────────────────────────────────────────────────────
        const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
            this,
            'CognitoAuthorizer',
            {
                authorizerName: 'EcommerceCognitoAuthorizer',
                cognitoUserPools: [userPool],
                identitySource: 'method.request.header.Authorization',
                resultsCacheTtl: cdk.Duration.minutes(5),
            },
        );

        const COGNITO_AUTH: apigateway.MethodOptions = {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        };

        // ─────────────────────────────────────────────────────────────────
        // Lambda proxy integrations
        // ─────────────────────────────────────────────────────────────────
        const productIntegration = new apigateway.LambdaIntegration(productFn);
        const cartIntegration = new apigateway.LambdaIntegration(cartFn);
        const orderIntegration = new apigateway.LambdaIntegration(orderFn);

        // ─────────────────────────────────────────────────────────────────
        // Routes — /products  (PUBLIC — no Cognito required)
        // ─────────────────────────────────────────────────────────────────
        const productsResource = api.root.addResource('products');

        productsResource.addMethod('GET', productIntegration, {
            authorizationType: apigateway.AuthorizationType.NONE,
        });

        productsResource
            .addResource('{id}')
            .addMethod('GET', productIntegration, {
                authorizationType: apigateway.AuthorizationType.NONE,
            });

        // ─────────────────────────────────────────────────────────────────
        // Routes — /cart  (PROTECTED — Cognito JWT required)
        // ─────────────────────────────────────────────────────────────────
        const cartResource = api.root.addResource('cart');

        cartResource.addMethod('GET', cartIntegration, COGNITO_AUTH);
        cartResource.addMethod('POST', cartIntegration, COGNITO_AUTH);
        cartResource.addMethod('PUT', cartIntegration, COGNITO_AUTH);

        cartResource
            .addResource('{productId}')
            .addMethod('DELETE', cartIntegration, COGNITO_AUTH);

        // ─────────────────────────────────────────────────────────────────
        // Routes — /orders  (PROTECTED — Cognito JWT required)
        // ─────────────────────────────────────────────────────────────────
        const ordersResource = api.root.addResource('orders');

        ordersResource.addMethod('POST', orderIntegration, COGNITO_AUTH);
        ordersResource.addMethod('GET', orderIntegration, COGNITO_AUTH);

        ordersResource
            .addResource('{id}')
            .addMethod('GET', orderIntegration, COGNITO_AUTH);

        // ─────────────────────────────────────────────────────────────────
        // Stack output
        // ─────────────────────────────────────────────────────────────────
        this.apiUrl = api.url;

        new cdk.CfnOutput(this, 'ApiUrl', {
            value: api.url,
            description: 'EcommerceApi base URL (prod stage)',
            exportName: 'EcommerceApiUrl',
        });

        cdk.Tags.of(this).add('Project', 'Ecommerce');
        cdk.Tags.of(this).add('Environment', 'Development');
    }
}
