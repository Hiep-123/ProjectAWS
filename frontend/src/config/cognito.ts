import { CognitoUserPool } from 'amazon-cognito-identity-js'
import { ENV } from './env'

export const userPool = new CognitoUserPool({
    UserPoolId: ENV.COGNITO_USER_POOL_ID,
    ClientId: ENV.COGNITO_CLIENT_ID,
})