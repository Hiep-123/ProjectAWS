/**
 * shared/auth.ts
 *
 * Cognito JWT claim extraction utilities.
 *
 * API Gateway Cognito authorizers attach the decoded JWT claims to
 * event.requestContext.authorizer.claims.  This module provides a
 * single helper that extracts the canonical userId (sub) and throws
 * a typed error if the request is unauthenticated, so every handler
 * can do:
 *
 *   const userId = extractUserId(event);   // throws if missing
 *
 * instead of repeating the null-check pattern inline.
 */

import type { APIGatewayProxyEvent } from 'aws-lambda';

export class UnauthorizedError extends Error {
    readonly statusCode = 401;
    constructor() {
        super('Unauthorized');
        this.name = 'UnauthorizedError';
    }
}

/**
 * Extracts the Cognito `sub` claim (canonical user identifier) from
 * the API Gateway request context set by the Cognito authorizer.
 *
 * @throws {UnauthorizedError} when no valid claim is present.
 */
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
