/**
 * Seeds the demo product catalog into DynamoDB.
 * Re-running the script safely overwrites the same items.
 *
 * Single-table schema:
 *   PK  = PRODUCT#{productId}
 *   SK  = METADATA
 *   GSI1PK = CATEGORY#{category}   (product search by category)
 *   GSI1SK = PRODUCT#{productId}
 *   GSI3PK = PRODUCT               (all products scan-equivalent via GSI)
 *   GSI3SK = NAME#{normalizedName}
 *
 * Usage:
 *   TABLE_NAME=EcommerceTable CDK_DEFAULT_REGION=ap-southeast-1 npm run seed:demo
 *   or simply: npm run seed:demo   (reads from .env via dotenv/config)
 */

import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
    CloudFormationClient,
    DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

// ─── Region and table resolution ─────────────────────────────────────────────

const REGION =
    process.env['CDK_DEFAULT_REGION'] ??
    process.env['AWS_REGION'] ??
    'ap-southeast-1';

async function resolveTableName(): Promise<string> {
    // Priority 1: explicit env var
    if (process.env['TABLE_NAME']) {
        return process.env['TABLE_NAME'];
    }

    // Priority 2: read from CloudFormation export
    console.log('TABLE_NAME not set — reading from CloudFormation export EcommerceTableName...');
    const cfn = new CloudFormationClient({ region: REGION });
    const res = await cfn.send(
        new DescribeStacksCommand({ StackName: 'DatabaseStack' }),
    );
    const outputs = res.Stacks?.[0]?.Outputs ?? [];
    const tableNameOutput = outputs.find((o) => o.ExportName === 'EcommerceTableName');
    if (!tableNameOutput?.OutputValue) {
        throw new Error(
            'Could not resolve table name. Set TABLE_NAME env var or deploy DatabaseStack first.',
        );
    }
    return tableNameOutput.OutputValue;
}

// ─── DynamoDB client ──────────────────────────────────────────────────────────

const dynamo = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: REGION }),
    { marshallOptions: { removeUndefinedValues: true } },
);

// ─── Product definitions ──────────────────────────────────────────────────────

const now = new Date().toISOString();

function normalize(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Generate a URL-friendly slug from the product name. */
function toSlug(name: string): string {
    return normalize(name);
}

interface ProductSeed {
    productId: string;
    name: string;
    description: string;
    category: string;
    price: number;
    stock: number;
    imageUrl: string;
    status: 'active' | 'inactive';
}

const PRODUCTS: ProductSeed[] = [
    // ── Laptops ──────────────────────────────────────────────────────────────
    {
        productId: 'prod-laptop-001',
        name: 'ProBook X15 Laptop',
        description: '15.6" FHD display, Intel Core i7-13th Gen, 16GB RAM, 512GB NVMe SSD. Ideal for developers and students.',
        category: 'laptops',
        price: 1299.99,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        status: 'active',
    },
    {
        productId: 'prod-laptop-002',
        name: 'UltraSlim Air 13',
        description: '13.3" 2K display, AMD Ryzen 7, 8GB RAM, 256GB SSD. Ultra-portable at just 1.1kg.',
        category: 'laptops',
        price: 899.99,
        stock: 18,
        imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
        status: 'active',
    },
    {
        productId: 'prod-laptop-003',
        name: 'GameForce RTX Laptop',
        description: '17.3" 144Hz display, Intel Core i9, 32GB RAM, NVIDIA RTX 4070, 1TB SSD.',
        category: 'laptops',
        price: 2199.99,
        stock: 10,
        imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
        status: 'active',
    },

    // ── Phones ───────────────────────────────────────────────────────────────
    {
        productId: 'prod-phone-001',
        name: 'Nova Pro 12 Smartphone',
        description: '6.7" AMOLED 120Hz, Snapdragon 8 Gen 2, 256GB, 5000mAh battery. Triple camera 200MP.',
        category: 'phones',
        price: 799.99,
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        status: 'active',
    },
    {
        productId: 'prod-phone-002',
        name: 'Budget Buddy 5G',
        description: '6.5" LCD, MediaTek Dimensity 700, 128GB, 5000mAh. Best value 5G phone.',
        category: 'phones',
        price: 249.99,
        stock: 80,
        imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400',
        status: 'active',
    },
    {
        productId: 'prod-phone-003',
        name: 'FoldPro Z Flip',
        description: 'Foldable 6.9" OLED display, 12GB RAM, 512GB, IPX8 water resistance.',
        category: 'phones',
        price: 1499.99,
        stock: 12,
        imageUrl: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400',
        status: 'active',
    },

    // ── Audio ─────────────────────────────────────────────────────────────────
    {
        productId: 'prod-audio-001',
        name: 'SoundMax ANC Headphones',
        description: 'Active Noise Cancellation, 40-hour battery, Hi-Res Audio, foldable design.',
        category: 'audio',
        price: 299.99,
        stock: 35,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        status: 'active',
    },
    {
        productId: 'prod-audio-002',
        name: 'BassBoost TWS Earbuds',
        description: 'True Wireless Stereo, 6+24h battery with case, IPX5, aptX codec.',
        category: 'audio',
        price: 79.99,
        stock: 100,
        imageUrl: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400',
        status: 'active',
    },

    // ── Accessories ───────────────────────────────────────────────────────────
    {
        productId: 'prod-acc-001',
        name: 'ProCharge 65W GaN Charger',
        description: 'GaN technology, 65W total output, 2×USB-C + 1×USB-A, foldable plug.',
        category: 'accessories',
        price: 49.99,
        stock: 150,
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        status: 'active',
    },
    {
        productId: 'prod-acc-002',
        name: 'MechaStrike RGB Keyboard',
        description: 'Mechanical TKL, Cherry MX Red switches, full RGB, USB-C detachable cable.',
        category: 'accessories',
        price: 129.99,
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400',
        status: 'active',
    },

    // ── Gaming ────────────────────────────────────────────────────────────────
    {
        productId: 'prod-game-001',
        name: 'StreamBox 4K Console',
        description: '4K gaming at 120fps, 1TB SSD, backward compatible, includes 2 controllers.',
        category: 'gaming',
        price: 499.99,
        stock: 20,
        imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
        status: 'active',
    },
    {
        productId: 'prod-game-002',
        name: 'ProAim Gaming Mouse',
        description: '25600 DPI optical sensor, 7 programmable buttons, RGB, 90-hour battery.',
        category: 'gaming',
        price: 89.99,
        stock: 60,
        imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
        status: 'active',
    },
];

// ─── Seed function ────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
    const tableName = await resolveTableName();
    console.log(`\n🌱 Seeding table: ${tableName} (region: ${REGION})\n`);

    let success = 0;
    let failed = 0;

    for (const product of PRODUCTS) {
        const item = {
            // Primary key
            PK: `PRODUCT#${product.productId}`,
            SK: 'METADATA',

            // GSI1 — product search by category
            GSI1PK: `CATEGORY#${product.category}`,
            GSI1SK: `PRODUCT#${product.productId}`,

            // GSI3 — all products listing
            GSI3PK: 'PRODUCT',
            GSI3SK: `NAME#${normalize(product.name)}`,

            // Application attributes
            productId: product.productId,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl,
            // Slug for user-friendly URLs — derived from the product name.
            // e.g. "ProBook X15 Laptop" → "probook-x15-laptop"
            // GET /products/{slug} in the Lambda resolves this to the full item.
            slug: toSlug(product.name),
            status: product.status,
            createdAt: now,
            updatedAt: now,
        };

        try {
            await dynamo.send(
                new PutCommand({
                    TableName: tableName,
                    Item: item,
                    // No condition — idempotent upsert overwrites if same PK/SK exists
                }),
            );
            console.log(`  ✅ ${product.productId.padEnd(22)} | ${product.name}`);
            success++;
        } catch (err) {
            console.error(`  ❌ ${product.productId} — ${(err as Error).message}`);
            failed++;
        }
    }

    console.log(`\n📊 Seed complete: ${success} succeeded, ${failed} failed out of ${PRODUCTS.length} products.\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

seed().catch((err) => {
    console.error('\n❌ Seed script failed:', err);
    process.exit(1);
});
