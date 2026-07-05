// Lấy userId từ Cognito JWT (claim "sub")

import type { APIGatewayProxyEvent } from 'aws-lambda';

export class UnauthorizedError extends Error {
    readonly statusCode = 401;
    constructor() {
        super('Unauthorized');
        this.name = 'UnauthorizedError';
    }
}

export function extractUserId(event: APIGatewayProxyEvent): string {
    const claims = event.requestContext.authorizer?.claims as
        | Record<string, string | undefined>
        | undefined;

    const userId = claims?.['sub'] ?? claims?.['cognito:username'];

    if (!userId) {
        throw new UnauthorizedError();
    }

    return userId;
}
