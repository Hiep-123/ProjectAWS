/**
 * create-demo-users.ts — Phase 10A Demo User Creation Script
 *
 * Creates demo Cognito users (customer + admin) if they do not already exist.
 * Idempotent: checks for existing users before creating.
 * Does NOT hardcode passwords — reads from environment variables.
 *
 * Required env vars (set in infrastructure/.env):
 *   COGNITO_USER_POOL_ID  — Cognito User Pool ID (from AuthStack output)
 *   DEMO_CUSTOMER_EMAIL   — e.g. customer@demo.com
 *   DEMO_CUSTOMER_PASSWORD — e.g. Demo@Customer1
 *   DEMO_ADMIN_EMAIL      — e.g. admin@demo.com
 *   DEMO_ADMIN_PASSWORD   — e.g. Demo@Admin1
 *
 * If password vars are missing, the script prints manual AWS CLI commands
 * and exits cleanly (non-fatal).
 *
 * Usage:
 *   COGNITO_USER_POOL_ID=ap-southeast-1_XXXXX \
 *   DEMO_CUSTOMER_EMAIL=customer@demo.com \
 *   DEMO_CUSTOMER_PASSWORD=Demo@Pass123 \
 *   DEMO_ADMIN_EMAIL=admin@demo.com \
 *   DEMO_ADMIN_PASSWORD=Admin@Pass123 \
 *   npm run seed:users
 */

import 'dotenv/config';
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    AdminAddUserToGroupCommand,
    AdminGetUserCommand,
    MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import {
    CloudFormationClient,
    DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

// ─── Region and pool resolution ───────────────────────────────────────────────

const REGION =
    process.env['CDK_DEFAULT_REGION'] ??
    process.env['AWS_REGION'] ??
    'ap-southeast-1';

async function resolveUserPoolId(): Promise<string> {
    if (process.env['COGNITO_USER_POOL_ID']) {
        return process.env['COGNITO_USER_POOL_ID'];
    }

    console.log('COGNITO_USER_POOL_ID not set — reading from CloudFormation export UserPoolId...');
    const cfn = new CloudFormationClient({ region: REGION });
    const res = await cfn.send(
        new DescribeStacksCommand({ StackName: 'AuthStack' }),
    );
    const outputs = res.Stacks?.[0]?.Outputs ?? [];
    const poolOutput = outputs.find((o) => o.ExportName === 'UserPoolId');
    if (!poolOutput?.OutputValue) {
        throw new Error(
            'Could not resolve User Pool ID. Set COGNITO_USER_POOL_ID or deploy AuthStack first.',
        );
    }
    return poolOutput.OutputValue;
}

// ─── Cognito client ───────────────────────────────────────────────────────────

const cognito = new CognitoIdentityProviderClient({ region: REGION });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function userExists(userPoolId: string, email: string): Promise<boolean> {
    try {
        await cognito.send(
            new AdminGetUserCommand({
                UserPoolId: userPoolId,
                Username: email,
            }),
        );
        return true;
    } catch (err: unknown) {
        if ((err as { name?: string }).name === 'UserNotFoundException') {
            return false;
        }
        throw err;
    }
}

async function createUser(
    userPoolId: string,
    email: string,
    password: string,
    group: 'CUSTOMER' | 'ADMIN',
): Promise<void> {
    const exists = await userExists(userPoolId, email);
    if (exists) {
        console.log(`  ⏭️  User already exists: ${email} — skipping creation`);
        // Still ensure group membership
        try {
            await cognito.send(
                new AdminAddUserToGroupCommand({
                    UserPoolId: userPoolId,
                    Username: email,
                    GroupName: group,
                }),
            );
            console.log(`     ✅ Confirmed group membership: ${group}`);
        } catch {
            // Group already assigned — not an error
        }
        return;
    }

    // Create user with SUPPRESS so no welcome email is sent during demo setup
    await cognito.send(
        new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'true' },
            ],
            MessageAction: MessageActionType.SUPPRESS,
            // TemporaryPassword set here; we immediately make it permanent below
            TemporaryPassword: password,
        }),
    );

    // Set permanent password — avoids FORCE_CHANGE_PASSWORD status
    await cognito.send(
        new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: email,
            Password: password,
            Permanent: true,
        }),
    );

    // Add to group
    await cognito.send(
        new AdminAddUserToGroupCommand({
            UserPoolId: userPoolId,
            Username: email,
            GroupName: group,
        }),
    );

    console.log(`  ✅ Created ${group.padEnd(9)} | ${email}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
    const customerEmail = process.env['DEMO_CUSTOMER_EMAIL'];
    const customerPassword = process.env['DEMO_CUSTOMER_PASSWORD'];
    const adminEmail = process.env['DEMO_ADMIN_EMAIL'];
    const adminPassword = process.env['DEMO_ADMIN_PASSWORD'];

    const missingEnvVars =
        !customerEmail || !customerPassword || !adminEmail || !adminPassword;

    if (missingEnvVars) {
        console.warn('\n⚠️  Demo user env vars not set. Skipping user creation.\n');
        console.log('Set these variables in infrastructure/.env and re-run npm run seed:users:\n');
        console.log('  DEMO_CUSTOMER_EMAIL=customer@demo.com');
        console.log('  DEMO_CUSTOMER_PASSWORD=<strong-password>');
        console.log('  DEMO_ADMIN_EMAIL=admin@demo.com');
        console.log('  DEMO_ADMIN_PASSWORD=<strong-password>\n');
        console.log('Or create users manually:\n');
        console.log('  # After AuthStack deploy, get the pool ID:');
        console.log('  POOL_ID=$(aws cloudformation describe-stacks \\');
        console.log('    --stack-name AuthStack --region ap-southeast-1 \\');
        console.log('    --query "Stacks[0].Outputs[?ExportName==\'UserPoolId\'].OutputValue" \\');
        console.log('    --output text)\n');
        console.log('  # Create customer:');
        console.log('  aws cognito-idp admin-create-user --user-pool-id $POOL_ID \\');
        console.log('    --region ap-southeast-1 --username customer@demo.com \\');
        console.log('    --user-attributes Name=email,Value=customer@demo.com Name=email_verified,Value=true \\');
        console.log('    --message-action SUPPRESS\n');
        console.log('  aws cognito-idp admin-set-user-password --user-pool-id $POOL_ID \\');
        console.log('    --region ap-southeast-1 --username customer@demo.com \\');
        console.log('    --password "Demo@Pass123" --permanent\n');
        console.log('  aws cognito-idp admin-add-user-to-group --user-pool-id $POOL_ID \\');
        console.log('    --region ap-southeast-1 --username customer@demo.com --group-name CUSTOMER\n');
        return;
    }

    const userPoolId = await resolveUserPoolId();
    console.log(`\n👤 Creating demo users in pool: ${userPoolId} (region: ${REGION})\n`);

    await createUser(userPoolId, customerEmail, customerPassword, 'CUSTOMER');
    await createUser(userPoolId, adminEmail, adminPassword, 'ADMIN');

    console.log('\n✅ Demo users ready.\n');
    console.log(`  Customer: ${customerEmail}`);
    console.log(`  Admin:    ${adminEmail}`);
    console.log('\nLogin at the CloudFront URL to test authentication.\n');
}

run().catch((err) => {
    console.error('\n❌ create-demo-users failed:', err);
    process.exit(1);
});
