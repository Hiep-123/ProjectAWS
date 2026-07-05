const ALLOWED_ORIGIN =
    process.env['ALLOWED_ORIGIN'] ?? 'http://localhost:5173';

const corsHeaders = () => ({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers':
        'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
});

export interface ApiResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

export const ok = (data: unknown): ApiResponse => ({
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(data),
});

export const created = (data: unknown): ApiResponse => ({
    statusCode: 201,
    headers: corsHeaders(),
    body: JSON.stringify(data),
});

export const badRequest = (message: string): ApiResponse => ({
    statusCode: 400,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message }),
});

export const unauthorized = (message = 'Unauthorized'): ApiResponse => ({
    statusCode: 401,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message }),
});

export const notFound = (resource: string): ApiResponse => ({
    statusCode: 404,
    headers: corsHeaders(),
    body: JSON.stringify({ error: `${resource} not found` }),
});

export const internalError = (err: unknown): ApiResponse => {
    console.error('[InternalError]', err);
    return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Internal server error' }),
    };
};
