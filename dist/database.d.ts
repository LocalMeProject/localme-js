import type { SqlExecutionResult, TableIndexDefinition, TableRelationshipDefinition, TablePolicyDefinition, DatabaseSnapshotMeta, TableOverviewItem, TableColumnMeta } from './types';
/**
 * Sovereign DBaaS Administrative & DDL Client.
 */
export declare class DatabaseClient {
    private readonly baseUrl;
    private readonly projectSlug;
    private readonly headers;
    constructor(baseUrl: string, projectSlug: string, headers: Record<string, string>);
    getTablesOverview(): Promise<TableOverviewItem[]>;
    listTables(): Promise<string[]>;
    addColumn(table: string, column: Partial<TableColumnMeta> & {
        name: string;
        dataType: string;
    }): Promise<{
        success: boolean;
        column: string;
    }>;
    dropColumn(table: string, columnName: string): Promise<{
        success: boolean;
        column: string;
    }>;
    alterColumn(table: string, columnName: string, newColumn: Partial<TableColumnMeta> & {
        newName?: string;
    }): Promise<{
        success: boolean;
        column: string;
    }>;
    createTable(name: string): Promise<{
        success: boolean;
        table: string;
    }>;
    deleteTable(table: string): Promise<{
        success: boolean;
        table: string;
    }>;
    getSchema(table?: string): Promise<Record<string, unknown>>;
    executeSql<T = unknown>(sql: string): Promise<SqlExecutionResult<T>>;
    truncateTable(table: string): Promise<{
        success: boolean;
        table: string;
    }>;
    getIndexes(table: string): Promise<TableIndexDefinition[]>;
    createIndex(table: string, options: {
        name?: string;
        columns: string[];
        isUnique?: boolean;
    }): Promise<{
        success: boolean;
        index: string;
    }>;
    deleteIndex(table: string, indexName: string): Promise<{
        success: boolean;
    }>;
    rebuildIndex(table: string, indexName: string): Promise<{
        success: boolean;
    }>;
    getRelationships(table: string): Promise<TableRelationshipDefinition[]>;
    createRelationship(table: string, options: {
        sourceColumn: string;
        targetTable: string;
        targetColumn?: string;
        onDelete?: string;
        onUpdate?: string;
        constraintName?: string;
    }): Promise<{
        success: boolean;
        relationship: TableRelationshipDefinition;
    }>;
    deleteRelationship(table: string, constraintName: string): Promise<{
        success: boolean;
    }>;
    getPolicies(table: string): Promise<TablePolicyDefinition[]>;
    createPolicy(table: string, options: {
        name: string;
        command?: string;
        roles?: string;
        usingExpression?: string;
        checkExpression?: string;
    }): Promise<{
        success: boolean;
        policy: string;
    }>;
    deletePolicy(table: string, policyName: string): Promise<{
        success: boolean;
    }>;
    listSnapshots(): Promise<DatabaseSnapshotMeta[]>;
    createSnapshot(type?: string): Promise<{
        success: boolean;
        snapshot: DatabaseSnapshotMeta;
    }>;
    restoreSnapshot(snapshotId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteSnapshot(snapshotId: string): Promise<{
        success: boolean;
        snapshotId: string;
    }>;
}
