import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import {
    db,
    TABLE_NAME,
    GetItemCommand,
    UpdateItemCommand,
    marshall,
    unmarshall,
} from '../shared/dynamo';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { buildOrderCreatedEvent } from '../../events/order-created';
import { EVENT_BUS_NAME } from '../../events/types';
import { extractUserId, UnauthorizedError } from '../shared/auth';
import { ok, badRequest, unauthorized, internalError, notFound } from '../shared/response';
import { formatDate, generateSecureHash, sortObject, buildQueryString } from '../shared/vnpay';

const smClient = new SecretsManagerClient({});
const eb = new EventBridgeClient({});
const eventBusName = process.env['EVENT_BUS_NAME'] ?? EVENT_BUS_NAME;

interface VNPayConfig {
    VNP_TMN_CODE: string;
    VNP_HASH_SECRET: string;
    VNP_URL: string;
    VNP_RETURN_URL: string;
}

let cachedConfig: VNPayConfig | null = null;

async function getVNPayConfig(): Promise<VNPayConfig> {
    if (cachedConfig) {
        return cachedConfig;
    }

    const secretArn = process.env['VNP_SECRET_ARN'];
    if (!secretArn) {
        throw new Error('VNP_SECRET_ARN environment variable is required');
    }

    console.log('[PaymentService] Fetching VNPay config from Secrets Manager:', secretArn);
    const response = await smClient.send(new GetSecretValueCommand({ SecretId: secretArn }));
    if (!response.SecretString) {
        throw new Error('SecretString from Secrets Manager is empty');
    }

    const config = JSON.parse(response.SecretString) as Record<string, string>;
    cachedConfig = {
        VNP_TMN_CODE: config['VNP_TMN_CODE'] ?? '',
        VNP_HASH_SECRET: config['VNP_HASH_SECRET'] ?? '',
        VNP_URL: config['VNP_URL'] ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        VNP_RETURN_URL: config['VNP_RETURN_URL'] ?? 'http://localhost:5173/payment/vnpay-return',
    };

    return cachedConfig;
}

export const handler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    console.log('[PaymentService]', event.httpMethod, event.path);

    try {
        const method = event.httpMethod;
        const path = event.path;

        if (method === 'POST' && path.includes('/payments/vnpay-url')) {
            let userId: string;
            try {
                userId = extractUserId(event);
            } catch (err) {
                if (err instanceof UnauthorizedError) return unauthorized();
                throw err;
            }
            return await generatePaymentUrl(userId, event);
        }

        if (method === 'POST' && path.includes('/payments/vnpay-verify')) {
            let userId: string;
            try {
                userId = extractUserId(event);
            } catch (err) {
                if (err instanceof UnauthorizedError) return unauthorized();
                throw err;
            }
            return await verifyPayment(userId, event.body);
        }

        if (method === 'GET' && path.includes('/payments/vnpay-ipn')) {
            return await handleVnpayIpn(event);
        }

        return badRequest('Method or path not supported');
    } catch (err) {
        console.error('[PaymentService] Handler Error:', err);
        return internalError(err);
    }
};

async function generatePaymentUrl(
    userId: string,
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
    const rawBody = event.body;
    if (!rawBody) return badRequest('Request body is required');

    let body: { orderId?: string };
    try {
        body = JSON.parse(rawBody);
    } catch {
        return badRequest('Invalid JSON body');
    }

    const { orderId } = body;
    if (!orderId) return badRequest('orderId is required');

    // Retrieve order details
    const { Item } = await db.send(
        new GetItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
        }),
    );

    if (!Item) {
        return notFound('Order');
    }

    const order = unmarshall(Item);

    // Verify ownership
    if (order['userId'] !== userId) {
        return unauthorized('Access denied: You do not own this order');
    }

    // Verify state
    if (order['status'] !== 'PENDING') {
        return badRequest('Order is not in PENDING state');
    }

    // Fetch credentials
    const config = await getVNPayConfig();

    const ipAddr = eventSourceIp(event) || '127.0.0.1';
    const date = new Date();
    const createDate = formatDate(date);

    const usdAmount = order['totalAmount'];
    const exchangeRate = 25000; // Exchange rate USD -> VND
    const amountInVnd = usdAmount * exchangeRate;

    const vnpParams: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: config.VNP_TMN_CODE,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: 'other',
        vnp_Amount: Math.round(amountInVnd * 100).toString(), // VNPay requires VND * 100 (xu)
        vnp_ReturnUrl: config.VNP_RETURN_URL,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
    };

    const secureHash = generateSecureHash(vnpParams, config.VNP_HASH_SECRET);
    const sorted = sortObject(vnpParams);
    const queryString = buildQueryString(sorted);
    const paymentUrl = `${config.VNP_URL}?${queryString}&vnp_SecureHash=${secureHash}`;

    return ok({ paymentUrl });
}

async function handleVnpayIpn(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const queryParams = event.queryStringParameters || {};
    const receivedHash = queryParams['vnp_SecureHash'];

    if (!receivedHash) {
        return ipnResponse('97', 'Invalid signature (missing hash)');
    }

    // Retrieve credentials
    const config = await getVNPayConfig();

    // Prepare params for verification
    const paramsToCheck = { ...queryParams };
    delete paramsToCheck['vnp_SecureHash'];
    delete paramsToCheck['vnp_SecureHashType'];

    // Verify signature
    const calculatedHash = generateSecureHash(paramsToCheck as Record<string, string>, config.VNP_HASH_SECRET);
    if (calculatedHash !== receivedHash) {
        console.warn('[PaymentService IPN] Signature validation failed', {
            received: receivedHash,
            calculated: calculatedHash,
        });
        return ipnResponse('97', 'Invalid signature');
    }

    const orderId = queryParams['vnp_TxnRef'];
    const vnpResponseCode = queryParams['vnp_ResponseCode'];
    const vnpAmountRaw = queryParams['vnp_Amount'];

    if (!orderId || !vnpResponseCode || !vnpAmountRaw) {
        return ipnResponse('01', 'Missing required VNPay parameters');
    }

    // Retrieve order
    const { Item } = await db.send(
        new GetItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
        }),
    );

    if (!Item) {
        console.warn('[PaymentService IPN] Order not found in DynamoDB:', orderId);
        return ipnResponse('01', 'Order not found');
    }

    const order = unmarshall(Item);

    // Validate amount
    const amountInVnd = Number(vnpAmountRaw) / 100;
    const exchangeRate = 25000;
    const expectedVnd = order['totalAmount'] * exchangeRate;
    if (Math.round(expectedVnd) !== Math.round(amountInVnd)) {
        console.warn('[PaymentService IPN] Amount mismatch:', {
            expectedVnd: expectedVnd,
            vnpAmount: amountInVnd,
        });
        return ipnResponse('04', 'Amount mismatch');
    }

    // Validate status
    if (order['status'] !== 'PENDING') {
        console.warn('[PaymentService IPN] Order already processed:', {
            orderId,
            status: order['status'],
        });
        return ipnResponse('02', 'Order already processed');
    }

    const now = new Date().toISOString();

    if (vnpResponseCode === '00') {
        console.log('[PaymentService IPN] Payment success. Updating order:', orderId);

        // Update database: paymentStatus = PAID, keep status as PENDING (or update updated timestamp)
        await db.send(
            new UpdateItemCommand({
                TableName: TABLE_NAME,
                Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
                UpdateExpression: 'SET paymentStatus = :payStatus, updatedAt = :updatedAt',
                ExpressionAttributeValues: marshall({
                    ':payStatus': 'PAID',
                    ':updatedAt': now,
                }),
            }),
        );

        // Dispatch EventBridge Event to kick off SQS processing
        const domainEvent = buildOrderCreatedEvent({
            orderId,
            userId: order['userId'],
            items: order['items'],
            shippingAddress: order['shippingAddress'],
            totalAmount: order['totalAmount'],
            createdAt: order['createdAt'],
        });

        await eb.send(
            new PutEventsCommand({
                Entries: [
                    {
                        EventBusName: eventBusName,
                        Source: 'ecommerce.orders',
                        DetailType: 'OrderCreated',
                        Detail: JSON.stringify(domainEvent),
                    },
                ],
            }),
        );

        console.log('[PaymentService IPN] EventBridge OrderCreated event published successfully');
    } else {
        console.log('[PaymentService IPN] Payment failed with code:', vnpResponseCode);

        // Update database: status = FAILED, paymentStatus = FAILED
        await db.send(
            new UpdateItemCommand({
                TableName: TABLE_NAME,
                Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
                UpdateExpression: 'SET #status = :status, paymentStatus = :payStatus, updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: marshall({
                    ':status': 'FAILED',
                    ':payStatus': 'FAILED',
                    ':updatedAt': now,
                }),
            }),
        );
    }

    return ipnResponse('00', 'Confirm success');
}

async function verifyPayment(
    userId: string,
    rawBody: string | null,
): Promise<APIGatewayProxyResult> {
    if (!rawBody) return badRequest('Request body is required');

    let body: Record<string, string>;
    try {
        body = JSON.parse(rawBody);
    } catch {
        return badRequest('Invalid JSON body');
    }

    const receivedHash = body['vnp_SecureHash'];
    if (!receivedHash) {
        return badRequest('Missing signature');
    }

    const config = await getVNPayConfig();

    const paramsToCheck = { ...body };
    delete paramsToCheck['vnp_SecureHash'];
    delete paramsToCheck['vnp_SecureHashType'];

    const calculatedHash = generateSecureHash(paramsToCheck, config.VNP_HASH_SECRET);
    if (calculatedHash !== receivedHash) {
        return badRequest('Invalid signature');
    }

    const orderId = body['vnp_TxnRef'];
    const vnpResponseCode = body['vnp_ResponseCode'];
    const vnpAmountRaw = body['vnp_Amount'];

    if (!orderId || !vnpResponseCode || !vnpAmountRaw) {
        return badRequest('Missing required VNPay parameters');
    }

    const { Item } = await db.send(
        new GetItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
        }),
    );

    if (!Item) {
        return notFound('Order');
    }

    const order = unmarshall(Item);

    if (order['userId'] !== userId) {
        return unauthorized('Access denied');
    }

    if (order['status'] !== 'PENDING') {
        return ok({ message: 'Order already processed', status: order['status'] });
    }

    const amountInVnd = Number(vnpAmountRaw) / 100;
    const exchangeRate = 25000;
    const expectedVnd = order['totalAmount'] * exchangeRate;
    if (Math.round(expectedVnd) !== Math.round(amountInVnd)) {
        return badRequest('Amount mismatch');
    }

    const now = new Date().toISOString();

    if (vnpResponseCode === '00') {
        await db.send(
            new UpdateItemCommand({
                TableName: TABLE_NAME,
                Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
                UpdateExpression: 'SET paymentStatus = :payStatus, updatedAt = :updatedAt',
                ExpressionAttributeValues: marshall({
                    ':payStatus': 'PAID',
                    ':updatedAt': now,
                }),
            }),
        );

        const domainEvent = buildOrderCreatedEvent({
            orderId,
            userId: order['userId'],
            items: order['items'],
            shippingAddress: order['shippingAddress'],
            totalAmount: order['totalAmount'],
            createdAt: order['createdAt'],
        });

        await eb.send(
            new PutEventsCommand({
                Entries: [
                    {
                        EventBusName: eventBusName,
                        Source: 'ecommerce.orders',
                        DetailType: 'OrderCreated',
                        Detail: JSON.stringify(domainEvent),
                    },
                ],
            }),
        );
        return ok({ message: 'Payment verified and order activated', status: 'PENDING' });
    } else {
        await db.send(
            new UpdateItemCommand({
                TableName: TABLE_NAME,
                Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
                UpdateExpression: 'SET #status = :status, paymentStatus = :payStatus, updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: marshall({
                    ':status': 'FAILED',
                    ':payStatus': 'FAILED',
                    ':updatedAt': now,
                }),
            }),
        );
        return ok({ message: 'Payment failed', status: 'FAILED' });
    }
}

function ipnResponse(code: string, message: string): APIGatewayProxyResult {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            RspCode: code,
            Message: message,
        }),
    };
}

function eventSourceIp(event: APIGatewayProxyEvent): string | undefined {
    return (
        event.headers?.['X-Forwarded-For'] ||
        event.headers?.['x-forwarded-for'] ||
        event.requestContext.identity.sourceIp
    );
}
