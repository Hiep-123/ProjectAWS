#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { EventStack } from '../lib/event-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { SecurityStack } from '../lib/security-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// AuthStack — Cognito User Pool, Client, Groups
// Deployed: ap-southeast-1_dOmrwNnTw
// Deploy:   cdk deploy AuthStack
const authStack = new AuthStack(app, 'AuthStack', {
  env,
  description: 'Ecommerce platform — Cognito authentication (User Pool, Client, Groups)',
});

// DatabaseStack — DynamoDB single-table design (EcommerceTable)
// Deploy: cdk deploy DatabaseStack
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  description: 'Ecommerce platform — DynamoDB single table (EcommerceTable)',
});

databaseStack.addDependency(authStack);

// EventStack — EventBridge bus, SQS OrderQueue + DLQ, OrderProcessorFunction
// Deploy: cdk deploy EventStack
const eventStack = new EventStack(app, 'EventStack', {
  env,
  description: 'Ecommerce platform — EventBridge, SQS, OrderProcessor Lambda',
});

eventStack.addDependency(databaseStack);

// ApiStack — REST API Gateway + Lambda services
// Depends on EventStack for EcommerceEventBusArn (OrderService PutEvents)
// Deploy: cdk deploy ApiStack
const apiStack = new ApiStack(app, 'ApiStack', {
  env,
  description: 'Ecommerce platform — API Gateway + Lambda (Products, Cart, Orders)',
});

apiStack.addDependency(databaseStack);
apiStack.addDependency(eventStack);

// MonitoringStack — CloudWatch Dashboard + Alarms + SNS
// Deploy: cdk deploy MonitoringStack
const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
  env,
  description: 'Ecommerce platform — CloudWatch Dashboard, Alarms, SNS notifications',
});

monitoringStack.addDependency(eventStack);
monitoringStack.addDependency(apiStack);

// SecurityStack — WAF v2 WebACL (CloudFront-scoped, must be us-east-1)
// NOTE: Deploy SecurityStack BEFORE FrontendStack — FrontendStack imports
//       EcommerceWafWebAclArn from this stack. WAF for CloudFront requires us-east-1.
// Deploy: cdk deploy SecurityStack
const securityStack = new SecurityStack(app, 'SecurityStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Ecommerce platform — WAF v2 WebACL for CloudFront',
});

// FrontendStack — S3 + CloudFront SPA deployment
// Deploy: cdk deploy FrontendStack
const frontendStack = new FrontendStack(app, 'FrontendStack', {
  env,
  description: 'Ecommerce platform — S3 + CloudFront (React 19 SPA)',
  wafWebAclArn: process.env.WAF_WEB_ACL_ARN,
});

// FrontendStack imports EcommerceApiUrl (ApiStack) + WAF ARN (SecurityStack)
frontendStack.addDependency(apiStack);
frontendStack.addDependency(securityStack);

// InfrastructureStack — Orchestration placeholder (no resources)
// Deploy: cdk deploy InfrastructureStack
const infraStack = new InfrastructureStack(app, 'InfrastructureStack', {
  env,
  description: 'Ecommerce platform — Core infrastructure orchestration',
});

infraStack.addDependency(apiStack);
infraStack.addDependency(monitoringStack);
infraStack.addDependency(frontendStack);

