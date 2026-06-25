import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * InfrastructureStack
 *
 * Root orchestration stack. Cognito resources are fully owned by AuthStack.
 * Future stacks (DatabaseStack, ApiStack, FrontendStack, EventStack,
 * MonitoringStack) will be instantiated here and wired together via
 * cross-stack references.
 */
export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito resources have been removed from this stack.
    // They are owned exclusively by AuthStack.
    //
    // Next phases will add:
    //   - DatabaseStack  (DynamoDB tables)
    //   - ApiStack       (API Gateway + Lambda)
    //   - FrontendStack  (S3 + CloudFront)
    //   - EventStack     (EventBridge + SQS)
    //   - MonitoringStack (CloudWatch dashboards + alarms)
  }
}
