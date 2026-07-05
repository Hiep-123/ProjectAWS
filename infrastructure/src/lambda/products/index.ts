import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    db,
    TABLE_NAME,
    GetItemCommand,
    QueryCommand,
    marshall,
    unmarshall,
} from '../shared/dynamo';
import { ok, notFound, internalError } from '../shared/response';

type SortOption = 'price_asc' | 'price_desc' | 'name_asc';

interface ProductItem {
    productId?: string;
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    slug?: string;
    [key: string]: unknown;
}

export const handler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    console.log('[ProductService]', event.httpMethod, event.path);

    try {
        const slugOrId = event.pathParameters?.['id'];

        if (slugOrId) {
            return await getProduct(slugOrId);
        }

        const qs = event.queryStringParameters ?? {};
        const category = qs['category'];
        const search = qs['search'];
        const sort = qs['sort'] as SortOption | undefined;
        const maxPrice = qs['maxPrice'] ? Number(qs['maxPrice']) : undefined;

        return await listProducts({ category, search, sort, maxPrice });
    } catch (err) {
        return internalError(err);
    }
};

async function getProduct(slugOrId: string): Promise<APIGatewayProxyResult> {
    // Thử tìm theo productId trước nếu path bắt đầu bằng "prod-"
    if (slugOrId.startsWith('prod-')) {
        const { Item } = await db.send(
            new GetItemCommand({
                TableName: TABLE_NAME,
                Key: marshall({ PK: `PRODUCT#${slugOrId}`, SK: 'METADATA' }),
            }),
        );
        if (Item) {
            return ok(unmarshall(Item));
        }
    }

    // Tìm theo slug bằng cách quét GSI3
    console.log(`[ProductService] Slug lookup for: ${slugOrId}`);
    const { Items = [] } = await db.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'GSI3',
            KeyConditionExpression: 'GSI3PK = :pk',
            ExpressionAttributeValues: marshall({ ':pk': 'PRODUCT' }),
        }),
    );

    const found = Items.map(i => unmarshall(i) as ProductItem)
        .find(p => p.slug === slugOrId);

    if (found) {
        return ok(found);
    }

    // Thử lại với GetItem cho các id không có tiền tố "prod-"
    const { Item } = await db.send(
        new GetItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `PRODUCT#${slugOrId}`, SK: 'METADATA' }),
        }),
    );
    if (Item) {
        return ok(unmarshall(Item));
    }

    return notFound('Product');
}

async function listProducts(options: {
    category?: string;
    search?: string;
    sort?: SortOption;
    maxPrice?: number;
}): Promise<APIGatewayProxyResult> {
    const { category, search, sort, maxPrice } = options;

    let rawItems: ProductItem[];

    if (category) {
        // Lọc theo danh mục qua GSI1
        const { Items = [] } = await db.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'GSI1',
                KeyConditionExpression:
                    'GSI1PK = :pk AND begins_with(GSI1SK, :prefix)',
                ExpressionAttributeValues: marshall({
                    ':pk': `CATEGORY#${category}`,
                    ':prefix': 'PRODUCT#',
                }),
            }),
        );
        rawItems = Items.map(i => unmarshall(i) as ProductItem);
    } else {
        // Lấy toàn bộ sản phẩm qua GSI3
        const { Items = [] } = await db.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'GSI3',
                KeyConditionExpression: 'GSI3PK = :pk',
                ExpressionAttributeValues: marshall({ ':pk': 'PRODUCT' }),
            }),
        );
        rawItems = Items.map(i => unmarshall(i) as ProductItem);
    }

    if (search) {
        const term = search.toLowerCase();
        rawItems = rawItems.filter(p =>
            (p.name ?? '').toLowerCase().includes(term) ||
            (p.description ?? '').toLowerCase().includes(term) ||
            (p.category ?? '').toLowerCase().includes(term),
        );
    }

    if (maxPrice !== undefined && !isNaN(maxPrice)) {
        rawItems = rawItems.filter(p => (p.price ?? 0) <= maxPrice);
    }

    if (sort === 'price_asc') {
        rawItems.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sort === 'price_desc') {
        rawItems.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sort === 'name_asc') {
        rawItems.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }

    return ok({ items: rawItems, count: rawItems.length });
}
