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

export class ApiStack extends cdk.Stack {
    public readonly apiUrl: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const userPoolId = cdk.Fn.importValue('UserPoolId');
        const tableName = cdk.Fn.importValue('EcommerceTableName');
        const tableArn = cdk.Fn.importValue('EcommerceTableArn');
        const eventBusArn = cdk.Fn.importValue('EcommerceEventBusArn');

        const userPool = cognito.UserPool.fromUserPoolId(this, 'ImportedUserPool', userPoolId);

        // ALLOWED_ORIGIN phải là URL CloudFront sau khi deploy FrontendStack
        const allowedOrigin = process.env['ALLOWED_ORIGIN'] ?? 'http://localhost:5173';

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

        const lambdaDefaults: Omit<lambdaNodejs.NodejsFunctionProps, 'entry' | 'logGroup'> = {
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
                minify: true,
                sourceMap: true,
                target: 'node22',
                forceDockerBundling: false,
            },
            tracing: lambda.Tracing.ACTIVE,
        };

        const productFn = new lambdaNodejs.NodejsFunction(this, 'ProductServiceFunction', {
            ...lambdaDefaults,
            functionName: 'ProductServiceFunction',
            description: 'GET /products — public product catalog',
            entry: path.join(__dirname, '../src/lambda/products/index.ts'),
            handler: 'handler',
            logGroup: productLogGroup,
        });

        // Chỉ cấp GetItem + Query, không Scan
        productFn.addToRolePolicy(new iam.PolicyStatement({
            sid: 'ProductDynamoReadOnly',
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:GetItem', 'dynamodb:Query'],
            resources: [tableArn, `${tableArn}/index/*`],
        }));

        const cartFn = new lambdaNodejs.NodejsFunction(this, 'CartServiceFunction', {
            ...lambdaDefaults,
            functionName: 'CartServiceFunction',
            description: 'GET/POST/PUT/DELETE /cart — user cart management',
            entry: path.join(__dirname, '../src/lambda/cart/index.ts'),
            handler: 'handler',
            logGroup: cartLogGroup,
        });

        cartFn.addToRolePolicy(new iam.PolicyStatement({
            sid: 'CartDynamoPointAccess',
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem'],
            resources: [tableArn],
        }));

        cartFn.addToRolePolicy(new iam.PolicyStatement({
            sid: 'CartDynamoQuery',
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:Query'],
            resources: [tableArn],
        }));

        const orderFn = new lambdaNodejs.NodejsFunction(this, 'OrderServiceFunction', {
            ...lambdaDefaults,
            functionName: 'OrderServiceFunction',
            description: 'POST/GET /orders — order placement and history',
            entry: path.join(__dirname, '../src/lambda/orders/index.ts'),
            handler: 'handler',
            logGroup: orderLogGroup,
        });

        // Đơn hàng không cần UpdateItem/DeleteItem — chỉ đọc và tạo mới
        // GSI2 cần index/* để query lịch sử đơn hàng theo user
        orderFn.addToRolePolicy(new iam.PolicyStatement({
            sid: 'OrderDynamoReadWrite',
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query'],
            resources: [tableArn, `${tableArn}/index/*`],
        }));

        orderFn.addToRolePolicy(new iam.PolicyStatement({
            sid: 'OrderEventBridgePutEvents',
            effect: iam.Effect.ALLOW,
            actions: ['events:PutEvents'],
            resources: [eventBusArn],
        }));

        const accessLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
            logGroupName: '/aws/apigateway/EcommerceApi',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const api = new apigateway.RestApi(this, 'EcommerceApi', {
            restApiName: 'EcommerceApi',
            description: 'Ecommerce platform — REST API v2',
            deployOptions: {
                stageName: 'prod',
                throttlingRateLimit: 100,
                throttlingBurstLimit: 200,
                accessLogDestination: new apigateway.LogGroupLogDestination(accessLogGroup),
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
                dataTraceEnabled: false,
                metricsEnabled: true,
            },
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

        const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
            authorizerName: 'EcommerceCognitoAuthorizer',
            cognitoUserPools: [userPool],
            identitySource: 'method.request.header.Authorization',
            resultsCacheTtl: cdk.Duration.minutes(5),
        });

        const COGNITO_AUTH: apigateway.MethodOptions = {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        };

        const productIntegration = new apigateway.LambdaIntegration(productFn);
        const cartIntegration = new apigateway.LambdaIntegration(cartFn);
        const orderIntegration = new apigateway.LambdaIntegration(orderFn);

        // /products — không cần xác thực
        const productsResource = api.root.addResource('products');
        productsResource.addMethod('GET', productIntegration, {
            authorizationType: apigateway.AuthorizationType.NONE,
        });
        productsResource
            .addResource('{id}')
            .addMethod('GET', productIntegration, {
                authorizationType: apigateway.AuthorizationType.NONE,
            });

        // /cart — yêu cầu JWT
        const cartResource = api.root.addResource('cart');
        cartResource.addMethod('GET', cartIntegration, COGNITO_AUTH);
        cartResource.addMethod('POST', cartIntegration, COGNITO_AUTH);
        cartResource.addMethod('PUT', cartIntegration, COGNITO_AUTH);
        cartResource.addResource('{productId}').addMethod('DELETE', cartIntegration, COGNITO_AUTH);

        // /orders — yêu cầu JWT
        const ordersResource = api.root.addResource('orders');
        ordersResource.addMethod('POST', orderIntegration, COGNITO_AUTH);
        ordersResource.addMethod('GET', orderIntegration, COGNITO_AUTH);
        ordersResource.addResource('{id}').addMethod('GET', orderIntegration, COGNITO_AUTH);

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
