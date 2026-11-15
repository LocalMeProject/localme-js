/**
 * Relational Database Query Builder (PostgREST style).
 */
export declare class TableQueryBuilder<T = Record<string, unknown>> {
    private readonly baseUrl;
    private readonly projectSlug;
    private readonly table;
    private readonly headers;
    private queryParams;
    constructor(baseUrl: string, projectSlug: string, table: string, headers: Record<string, string>);
    private setOrAppendParam;
    select(columns?: string): this;
    eq(column: string, value: unknown): this;
    neq(column: string, value: unknown): this;
    gt(column: string, value: unknown): this;
    gte(column: string, value: unknown): this;
    lt(column: string, value: unknown): this;
    lte(column: string, value: unknown): this;
    like(column: string, pattern: string): this;
    ilike(column: string, pattern: string): this;
    in(column: string, values: unknown[]): this;
    is(column: string, value: 'null' | 'not_null'): this;
    not(column: string, operator: string, value: unknown): this;
    or(filters: string): this;
    contains(column: string, value: unknown): this;
    containedBy(column: string, value: unknown): this;
    textSearch(column: string, query: string): this;
    order(column: string, options?: {
        ascending?: boolean;
    }): this;
    limit(count: number): this;
    range(from: number, to: number): this;
    private buildQueryString;
    count(): Promise<number>;
    execute(): Promise<T[]>;
    single(): Promise<T>;
    maybeSingle(): Promise<T | null>;
    then<TResult1 = T[], TResult2 = never>(onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
    insert(record: Partial<T>): Promise<T>;
    insertMany(records: Partial<T>[], options?: {
        chunkSize?: number;
    }): Promise<T[]>;
    update(patch: Partial<T>): {
        match(filter: Record<string, unknown> | {
            id: string | number;
        }): Promise<T>;
    };
    upsert(record: Partial<T>, options?: {
        onConflict?: string;
    }): Promise<T>;
    delete(rowId?: string | number): Promise<{
        success: boolean;
        rowId: string;
    }> | {
        match(filter: Record<string, unknown> | {
            id: string | number;
        }): Promise<{
            success: boolean;
            rowId: string;
        }>;
    };
}
