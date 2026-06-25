/**
 * Re-exports the CognitoUserPool singleton from config/cognito.
 * All services import from here so there is exactly one pool instance.
 */
export { userPool } from '@config/cognito';
