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

// Stack cho auth
const authStack = new AuthStack(app, 'AuthStack', {
  env,
  description: 'Ecommerce platform — Cognito authentication (User Pool, Client, Groups)',
});

// Stack cho database
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  description: 'Ecommerce platform — DynamoDB single table (EcommerceTable)',
});

databaseStack.addDependency(authStack);

// Stack cho event và queue
const eventStack = new EventStack(app, 'EventStack', {
  env,
  description: 'Ecommerce platform — EventBridge, SQS, OrderProcessor Lambda',
});

eventStack.addDependency(databaseStack);

// Stack cho API Gateway và Lambda
const apiStack = new ApiStack(app, 'ApiStack', {
  env,
  description: 'Ecommerce platform — API Gateway + Lambda (Products, Cart, Orders)',
});

apiStack.addDependency(databaseStack);
apiStack.addDependency(eventStack);

// Stack cho monitoring
const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
  env,
  description: 'Ecommerce platform — CloudWatch Dashboard, Alarms, SNS notifications',
});

monitoringStack.addDependency(eventStack);
monitoringStack.addDependency(apiStack);

// Stack cho WAF
const securityStack = new SecurityStack(app, 'SecurityStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Ecommerce platform — WAF v2 WebACL for CloudFront',
});

// Stack cho frontend
const frontendStack = new FrontendStack(app, 'FrontendStack', {
  env,
  description: 'Ecommerce platform — S3 + CloudFront (React 19 SPA)',
  wafWebAclArn: process.env.WAF_WEB_ACL_ARN,
});

frontendStack.addDependency(apiStack);
frontendStack.addDependency(securityStack);

// Stack tổng hợp
const infraStack = new InfrastructureStack(app, 'InfrastructureStack', {
  env,
  description: 'Ecommerce platform — Core infrastructure orchestration',
});

infraStack.addDependency(apiStack);
infraStack.addDependency(monitoringStack);
infraStack.addDependency(frontendStack);

