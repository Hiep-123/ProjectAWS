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
import { CicdStack } from '../lib/cicd-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// ─────────────────────────────────────────────────────────────────────────────
// AuthStack — Cognito User Pool, Client, Groups
// Deployed: ✅ ap-southeast-2_Y6SkvrFid
// Deploy:   cdk deploy AuthStack
// ─────────────────────────────────────────────────────────────────────────────
const authStack = new AuthStack(app, 'AuthStack', {
  env,
  description: 'Ecommerce platform — Cognito authentication (User Pool, Client, Groups)',
});

// ─────────────────────────────────────────────────────────────────────────────
// DatabaseStack — DynamoDB single-table design (EcommerceTable)
// Deployed: ✅
// Deploy:   cdk deploy DatabaseStack
// ─────────────────────────────────────────────────────────────────────────────
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  description: 'Ecommerce platform — DynamoDB single table (EcommerceTable)',
});

databaseStack.addDependency(authStack);

// ─────────────────────────────────────────────────────────────────────────────
// EventStack — EventBridge bus, SQS OrderQueue + DLQ, OrderProcessorFunction
// Phase 6 — event-driven order processing
// Deploy:   cdk deploy EventStack
// ─────────────────────────────────────────────────────────────────────────────
const eventStack = new EventStack(app, 'EventStack', {
  env,
  description: 'Ecommerce platform — EventBridge, SQS, OrderProcessor Lambda (Phase 6)',
});

eventStack.addDependency(databaseStack);

// ─────────────────────────────────────────────────────────────────────────────
// ApiStack — REST API Gateway + Lambda services
// Depends on EventStack for EcommerceEventBusArn (OrderService PutEvents)
// Deploy:   cdk deploy ApiStack
// ─────────────────────────────────────────────────────────────────────────────
const apiStack = new ApiStack(app, 'ApiStack', {
  env,
  description: 'Ecommerce platform — API Gateway + Lambda (Products, Cart, Orders)',
});

apiStack.addDependency(databaseStack);
apiStack.addDependency(eventStack);

// ─────────────────────────────────────────────────────────────────────────────
// MonitoringStack — CloudWatch Dashboard + Alarms + SNS
// Phase 6 — observability
// Deploy:   cdk deploy MonitoringStack
// ─────────────────────────────────────────────────────────────────────────────
const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
  env,
  description: 'Ecommerce platform — CloudWatch Dashboard, Alarms, SNS notifications (Phase 6)',
});

monitoringStack.addDependency(eventStack);
monitoringStack.addDependency(apiStack);

// ─────────────────────────────────────────────────────────────────────────────
// SecurityStack — WAF v2 WebACL (CloudFront-scoped, must be us-east-1)
// Phase 8 — security hardening
// Deploy:   cdk deploy SecurityStack
// NOTE:     Deploy SecurityStack BEFORE FrontendStack — FrontendStack imports
//           EcommerceWafWebAclArn from this stack.
// ─────────────────────────────────────────────────────────────────────────────
const securityStack = new SecurityStack(app, 'SecurityStack', {
  // account passed explicitly; region is HARDCODED to us-east-1 inside the stack
  // (WAF for CloudFront is a global service, always in us-east-1)
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Ecommerce platform — WAF v2 WebACL for CloudFront (Phase 8)',
});

// ─────────────────────────────────────────────────────────────────────────────
// FrontendStack — S3 + CloudFront SPA deployment
// Phase 7 — React 19 + Vite frontend
// Deploy:   cdk deploy FrontendStack
// ─────────────────────────────────────────────────────────────────────────────
const frontendStack = new FrontendStack(app, 'FrontendStack', {
  env,
  description: 'Ecommerce platform — S3 + CloudFront (React 19 SPA, Phase 7)',
  wafWebAclArn: process.env.WAF_WEB_ACL_ARN,
});

// FrontendStack imports EcommerceApiUrl (ApiStack) + EcommerceWafWebAclArn (SecurityStack)
frontendStack.addDependency(apiStack);
frontendStack.addDependency(securityStack);

// ─────────────────────────────────────────────────────────────────────────────
// InfrastructureStack — Orchestration placeholder
// Deploy:   cdk deploy InfrastructureStack
// ─────────────────────────────────────────────────────────────────────────────
const infraStack = new InfrastructureStack(app, 'InfrastructureStack', {
  env,
  description: 'Ecommerce platform — Core infrastructure orchestration',
});

infraStack.addDependency(apiStack);
infraStack.addDependency(monitoringStack);
infraStack.addDependency(frontendStack);

// ─────────────────────────────────────────────────────────────────────────────
// CicdStack — CodePipeline + CodeBuild CI/CD
// Phase 9 — automated build and deploy pipeline
// Deploy:   cdk deploy CicdStack
//           --context githubOwner=<your-github-username>
//           --context githubRepo=ProjectSecondAWS
//           --context githubBranch=main
//
// Pre-requisite (one-time):
//   aws secretsmanager create-secret \
//     --name /ecommerce/github-token \
//     --secret-string "<github-personal-access-token>"
// ─────────────────────────────────────────────────────────────────────────────
const cicdStack = new CicdStack(app, 'CicdStack', {
  env,
  description: 'Ecommerce platform — CodePipeline CI/CD (Phase 9)',
});

// CicdStack imports exports from MonitoringStack and FrontendStack
cicdStack.addDependency(monitoringStack);
cicdStack.addDependency(frontendStack);
