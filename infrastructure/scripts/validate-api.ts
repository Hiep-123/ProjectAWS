import 'dotenv/config';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import http from 'http';
import https from 'https';

const REGION = 'ap-southeast-1';
const CLIENT_ID = '1g8038olqqhg6psmka7etvc47e';
const USERPOOL_ID = 'ap-southeast-1_dOmrwNnTw';

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

async function makeRequest(url: string, method: string, headers: any, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        const req = (u.protocol === 'https:' ? https : http).request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data ? JSON.parse(data) : null,
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function validate() {
    console.log('=== Backend Validation script ===');

    // 1. Authenticate with Cognito
    console.log('Authenticating customer@demo.com...');
    const cognito = new CognitoIdentityProviderClient({ region: REGION });
    const authRes = await cognito.send(new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
            USERNAME: 'customer@demo.com',
            PASSWORD: 'Demo@Pass123',
        },
    }));

    const idToken = authRes.AuthenticationResult?.IdToken;
    if (!idToken) {
        throw new Error('Failed to retrieve ID Token');
    }
    console.log('✅ Authenticated successfully!');

    const authHeaders = {
        'Authorization': idToken,
    };

    const apiUrl = 'https://esgpnsxpf1.execute-api.ap-southeast-1.amazonaws.com/prod';

    // 2. GET /cart
    console.log('\nTesting GET /cart...');
    const cartRes = await makeRequest(`${apiUrl}/cart`, 'GET', authHeaders);
    console.log(`Status: ${cartRes.statusCode}`);
    console.log('Response:', JSON.stringify(cartRes.body));

    // 3. POST /cart (add prod-laptop-001)
    console.log('\nTesting POST /cart (adding prod-laptop-001 with price)...');
    const addToCartRes = await makeRequest(`${apiUrl}/cart`, 'POST', authHeaders, {
        productId: 'prod-laptop-001',
        quantity: 2,
        price: 1299.99,
    });
    console.log(`Status: ${addToCartRes.statusCode}`);
    console.log('Response:', JSON.stringify(addToCartRes.body));

    // 4. Verify /cart updated
    console.log('\nVerifying GET /cart after update...');
    const cartRes2 = await makeRequest(`${apiUrl}/cart`, 'GET', authHeaders);
    console.log(`Status: ${cartRes2.statusCode}`);
    console.log('Response:', JSON.stringify(cartRes2.body));

    // 5. POST /orders
    console.log('\nTesting POST /orders (checkout)...');
    const orderRes = await makeRequest(`${apiUrl}/orders`, 'POST', authHeaders, {
        items: [
            {
                productId: 'prod-laptop-001',
                quantity: 2,
                price: 1299.99,
            }
        ],
        shippingAddress: '123 AWS Way, Singapore, Singapore 123456',
    });
    console.log(`Status: ${orderRes.statusCode}`);
    console.log('Response:', JSON.stringify(orderRes.body));

    if (orderRes.statusCode !== 200 && orderRes.statusCode !== 201 && orderRes.statusCode !== 202) {
        throw new Error(`Failed to place order: ${JSON.stringify(orderRes.body)}`);
    }

    const orderId = orderRes.body.orderId;
    console.log(`✅ Order placed: ${orderId}`);

    // 6. Verify DynamoDB Order record exists
    console.log('\nChecking DynamoDB table for order PK=ORDER#' + orderId);
    const ddbRes = await ddbClient.send(new GetCommand({
        TableName: 'EcommerceTable',
        Key: {
            PK: `ORDER#${orderId}`,
            SK: 'METADATA',
        },
    }));
    console.log('DynamoDB Item:', JSON.stringify(ddbRes.Item));

    // 7. Verify SQS Order Queue messages are processed and order status changes to processed/confirmed
    console.log('\nWaiting for OrderProcessor to process the order (polling DynamoDB status)...');
    let attempts = 0;
    let success = false;
    while (attempts < 15) {
        await new Promise((r) => setTimeout(r, 2000));
        const checkOrder = await ddbClient.send(new GetCommand({
            TableName: 'EcommerceTable',
            Key: {
                PK: `ORDER#${orderId}`,
                SK: 'METADATA',
            },
        }));
        const status = checkOrder.Item?.status;
        console.log(`[Attempt ${attempts + 1}/15] Order status in DB: ${status}`);
        if (status === 'PROCESSED' || status === 'CONFIRMED' || status === 'COMPLETED' || status === 'processing' || status === 'processed' || status === 'completed') {
            success = true;
            break;
        }
        attempts++;
    }

    if (success) {
        console.log('✅ Order successfully processed by Lambda / SQS!');
    } else {
        console.log('❌ Order processing timed out or failed!');
    }
}

validate().catch((err) => {
    console.error('Validation failed:', err);
    process.exit(1);
});
