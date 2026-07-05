import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

/**
 * FrontendStack — S3 + CloudFront SPA deployment
 *
 * Deploys the React 19 + Vite SPA to a private S3 bucket served via CloudFront (OAC).
 * WAF WebACL ARN passed as a prop because Fn.importValue doesn't work cross-region.
 * Cognito config and API URL injected into /config.json at deploy time (no bundle rebuild needed).
 */
export interface FrontendStackProps extends cdk.StackProps {
    /** WAF WebACL ARN from SecurityStack (us-east-1). Passed as prop because
     *  Fn.importValue does NOT work cross-region. */
    wafWebAclArn?: string;
}

export class FrontendStack extends cdk.Stack {
    public readonly distributionDomainName: string;

    constructor(scope: Construct, id: string, props?: FrontendStackProps) {
        super(scope, id, props);

        // ─────────────────────────────────────────────────────────────────
        // Cross-stack imports
        // ─────────────────────────────────────────────────────────────────
        const apiUrl = cdk.Fn.importValue('EcommerceApiUrl');
        // WAF WebACL ARN from SecurityStack (us-east-1).
        // Fn.importValue does NOT work cross-region — passed as stack prop from WAF_WEB_ACL_ARN env var.
        const wafWebAclArn = props?.wafWebAclArn ?? '';
        // Cognito config injected into runtime config.json at deploy time
        const userPoolId = cdk.Fn.importValue('UserPoolId');
        const userPoolClientId = cdk.Fn.importValue('UserPoolClientId');
        const cognitoRegion = cdk.Fn.importValue('CognitoRegion');

        // S3 — FrontendBucket
        //
        // Security requirements:
        //   • blockPublicAccess: BLOCK_ALL — no direct S3 access
        //   • encryption: S3_MANAGED (SSE-S3)
        //   • versioned: true — enables rollback of deployments
        //   • CloudFront OAC is granted read via bucket policy (below)

        const bucket = new s3.Bucket(this, 'FrontendBucket', {
            bucketName: `ecommerce-frontend-${this.account}-${this.region}`,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            versioned: true,
            // Development settings — change to RETAIN + versioned cleanup for production
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            // Enforce HTTPS-only access at the bucket level
            enforceSSL: true,
        });

        // CloudFront Origin Access Control (OAC)
        //
        // OAC supersedes legacy OAI — uses SigV4 signing for all S3 requests.
        // The distribution's service principal is granted s3:GetObject below.
        const oac = new cloudfront.S3OriginAccessControl(this, 'FrontendOAC', {
            originAccessControlName: 'EcommerceFrontendOAC',
            description: 'OAC for EcommerceFrontend S3 bucket — read-only',
            signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
        });

        // CloudFront Response Headers Policy
        //
        // AWS managed policy (ID: 67f7725c-6f97-4210-82d7-5512b31e9d03)
        // includes the full OWASP-recommended set:
        //   Strict-Transport-Security  (max-age=31536000; includeSubdomains)
        //   X-Content-Type-Options     (nosniff)
        //   X-Frame-Options            (SAMEORIGIN)
        //   X-XSS-Protection           (1; mode=block)
        //   Referrer-Policy            (strict-origin-when-cross-origin)
        const securityHeadersPolicy = cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS;

        // ─────────────────────────────────────────────────────────────────
        // S3 Origin with OAC
        // ─────────────────────────────────────────────────────────────────
        const s3Origin = cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(
            bucket,
            { originAccessControl: oac },
        );

        // CloudFront Distribution
        //
        // SPA routing: 403 + 404 → /index.html with HTTP 200
        //   403 occurs when S3 returns AccessDenied on a key that doesn't
        //   exist (S3 returns 403 not 404 for private buckets).
        //   Both must be mapped to /index.html so React Router handles routing.
        //
        // Cache strategy (two behaviors):
        //   /assets/*  — CachingOptimized (long TTL, Vite content-hashed files)
        //   default    — CACHING_DISABLED for index.html + config.json so users
        //                always get the latest SPA shell after a deployment
        const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
            comment: 'Ecommerce platform — React SPA',

            defaultRootObject: 'index.html',

            // WAF WebACL (managed rules + rate limiting)
            webAclId: cdk.Token.asString(wafWebAclArn),

            // HTTP → HTTPS redirect
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,

            // HTTP/2 + HTTP/3
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,

            // PRICE_CLASS_200 — US, EU, Israel edge locations
            priceClass: cloudfront.PriceClass.PRICE_CLASS_200,

            enableIpv6: true,

            // ── Default behavior — index.html + config.json (NO caching) ──
            // index.html and config.json must always be fresh.
            // Vite-hashed assets (/assets/*) get long-TTL via additionalBehaviors.
            defaultBehavior: {
                origin: s3Origin,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                compress: true,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                // CACHING_DISABLED — index.html must never be served stale
                cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                responseHeadersPolicy: securityHeadersPolicy,
                originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
            },

            // ── /assets/* behavior — long TTL for content-hashed Vite bundles ──
            additionalBehaviors: {
                '/assets/*': {
                    origin: s3Origin,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    compress: true,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                    // CachingOptimized — safe because Vite content-hashes all filenames
                    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                    responseHeadersPolicy: securityHeadersPolicy,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                },
            },

            // ── SPA Routing — React Router custom error responses ──────────
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(0),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(0),
                },
            ],
        });

        // ─────────────────────────────────────────────────────────────────
        // Bucket policy — grant CloudFront OAC s3:GetObject
        //
        // CDK's S3BucketOrigin.withOriginAccessControl() does NOT
        // automatically add the bucket policy when the OAC is created
        // in the same stack as the bucket; we add it explicitly to be
        // safe and self-documenting.
        // ─────────────────────────────────────────────────────────────────
        bucket.addToResourcePolicy(
            new iam.PolicyStatement({
                sid: 'AllowCloudFrontServicePrincipal',
                effect: iam.Effect.ALLOW,
                principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
                actions: ['s3:GetObject'],
                resources: [bucket.arnForObjects('*')],
                conditions: {
                    StringEquals: {
                        'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
                    },
                },
            }),
        );

        // ─────────────────────────────────────────────────────────────────
        // S3 Deployment
        //
        // Uploads frontend/dist to S3 and invalidates the CloudFront cache
        // after every deploy so users always get the latest build.
        //
        // The VITE_API_URL is injected as a runtime config file
        // (config.js) that the SPA loads at startup — avoids hardcoding
        // the API URL into the bundle.
        // ─────────────────────────────────────────────────────────────────
        new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
            sources: [
                // 1. Built SPA assets from frontend/dist
                s3deploy.Source.asset(
                    path.join(__dirname, '../../frontend/dist'),
                ),
                // 2. Runtime config — injects API URL and Cognito config without rebuilding
                s3deploy.Source.jsonData('config.json', {
                    apiUrl: apiUrl,
                    cognito: {
                        userPoolId: userPoolId,
                        clientId: userPoolClientId,
                        region: cognitoRegion,
                    },
                }),
            ],
            destinationBucket: bucket,
            distribution,
            // Targeted invalidation — /assets/* are content-hashed and never
            // need invalidation. Only the SPA shell and runtime config change.
            distributionPaths: ['/index.html', '/config.json'],
            retainOnDelete: false,
        });

        // ─────────────────────────────────────────────────────────────────
        // Expose domain name for other stacks / outputs
        // ─────────────────────────────────────────────────────────────────
        this.distributionDomainName = distribution.distributionDomainName;

        // ─────────────────────────────────────────────────────────────────
        // Stack outputs
        // ─────────────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'FrontendBucketName', {
            value: bucket.bucketName,
            description: 'S3 bucket hosting the React SPA assets',
            exportName: 'FrontendBucketName',
        });

        new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
            value: distribution.distributionId,
            description: 'CloudFront distribution ID (use for manual cache invalidations)',
            exportName: 'CloudFrontDistributionId',
        });

        new cdk.CfnOutput(this, 'CloudFrontDomainName', {
            value: distribution.distributionDomainName,
            description: 'CloudFront domain — set this as ALLOWED_ORIGIN in ApiStack for prod',
            exportName: 'CloudFrontDomainName',
        });

        new cdk.CfnOutput(this, 'FrontendUrl', {
            value: `https://${distribution.distributionDomainName}`,
            description: 'Public HTTPS URL of the deployed frontend',
            exportName: 'FrontendUrl',
        });

        cdk.Tags.of(this).add('Project', 'Ecommerce');
        cdk.Tags.of(this).add('Environment', 'Development');
    }
}
