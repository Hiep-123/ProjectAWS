import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * InfrastructureStack
 *
 * Orchestration placeholder. All application stacks (AuthStack, DatabaseStack,
 * ApiStack, EventStack, MonitoringStack, SecurityStack, FrontendStack) are
 * instantiated and wired in bin/infrastructure.ts.
 */
export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // No resources — this stack exists as a dependency sink in the CDK app graph.
  }
}
