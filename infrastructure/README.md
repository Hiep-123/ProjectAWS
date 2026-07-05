# Ecommerce Platform — AWS CDK Infrastructure

Mô tả ngắn cho backend này: CDK deploy các stack auth, API, event và frontend lên AWS.

## Stacks

| Stack | Description |
|-------|-------------|
| AuthStack | Cognito User Pool, Client, CUSTOMER/ADMIN groups |
| DatabaseStack | DynamoDB single-table design (EcommerceTable) |
| EventStack | EventBridge custom bus, SQS OrderQueue + DLQ, OrderProcessorFunction |
| ApiStack | REST API Gateway + Lambda (Products, Cart, Orders) |
| MonitoringStack | CloudWatch Dashboard, 6 alarms, SNS topic |
| SecurityStack | WAF v2 WebACL for CloudFront (deployed to us-east-1) |
| FrontendStack | S3 + CloudFront SPA deployment (React 19 + Vite) |
| InfrastructureStack | Orchestration placeholder |

## Deployment (manual CDK — verified path)

```bash
cd infrastructure
npm install

# Deploy all stacks in dependency order
npx cdk deploy AuthStack
npx cdk deploy DatabaseStack
npx cdk deploy EventStack
npx cdk deploy ApiStack
npx cdk deploy MonitoringStack
npx cdk deploy SecurityStack   # us-east-1 — WAF for CloudFront
npx cdk deploy FrontendStack
npx cdk deploy InfrastructureStack

# Or deploy everything at once
npx cdk deploy --all --require-approval never
```

## Useful commands

* `npm run build`           compile TypeScript to JS
* `npm run watch`           watch for changes and compile
* `npm run test`            run jest unit tests
* `npx cdk synth`           emit synthesized CloudFormation templates
* `npx cdk diff`            compare deployed stack with current state
* `npm run seed:demo`       seed DynamoDB with demo products
* `npm run seed:users`      create demo Cognito users

## Ghi chú ngắn

Deployment hiện đang dùng CDK thủ công. Nếu cần thêm CI/CD thì nên làm sau khi demo ổn định.
