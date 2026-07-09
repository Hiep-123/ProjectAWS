import { createHmac } from 'crypto';

/**
 * Format a Date object into YYYYMMDDHHmmss format for VNPay
 */
export function formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * Sort parameters alphabetically and encode key-value pairs.
 * Values are URL-encoded once — callers must NOT re-encode.
 */
export function sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = encodeURIComponent(obj[key]!).replace(/%20/g, '+');
    }
    return sorted;
}

/**
 * Build a query string from already-encoded sorted params.
 * Does NOT re-encode — values from sortObject are used as-is.
 */
export function buildQueryString(sortedParams: Record<string, string>): string {
    return Object.keys(sortedParams)
        .map((key) => `${key}=${sortedParams[key]}`)
        .join('&');
}

/**
 * Generate secure HMAC-SHA512 hash for VNPay.
 * Uses manual query string construction to avoid double-encoding.
 */
export function generateSecureHash(params: Record<string, string>, secretKey: string): string {
    const sortedParams = sortObject(params);
    const signData = buildQueryString(sortedParams);
    const hmac = createHmac('sha512', secretKey);
    return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

