async function handleFetchError(res, defaultMsg) {
    let errBody = null;
    try {
        errBody = (await res.json());
    }
    catch {
        // ignore
    }
    const msg = errBody?.error || errBody?.detail || `${defaultMsg}: ${res.status}`;
    const error = new Error(msg);
    error.status = res.status;
    error.code = errBody?.code;
    error.detail = errBody?.detail;
    throw error;
}
/**
 * Sovereign DBaaS Administrative & DDL Client.
 */
export class DatabaseClient {
    baseUrl;
    projectSlug;
    headers;
    constructor(baseUrl, projectSlug, headers) {
        this.baseUrl = baseUrl;
        this.projectSlug = projectSlug;
        this.headers = headers;
    }
    async getTablesOverview() {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/overview`, { headers: this.headers });
        if (!res.ok)
            await handleFetchError(res, 'Get tables overview failed');
        return (await res.json());
    }
    async listTables() {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables`, { headers: this.headers });
        if (!res.ok)
            await handleFetchError(res, 'List tables failed');
        return (await res.json());
    }
    async addColumn(table, column) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/columns`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(column),
        });
        if (!res.ok)
            await handleFetchError(res, 'Add column failed');
        return (await res.json());
    }
    async dropColumn(table, columnName) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/columns/${encodeURIComponent(columnName)}`, {
            method: 'DELETE',
            headers: this.headers,
        });
        if (!res.ok)
            await handleFetchError(res, 'Drop column failed');
        return (await res.json());
    }
    async alterColumn(table, columnName, newColumn) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/columns/${encodeURIComponent(columnName)}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(newColumn),
        });
        if (!res.ok)
            await handleFetchError(res, 'Alter column failed');
        return (await res.json());
    }
    async createTable(name) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ name }),
        });
        if (!res.ok)
            throw new Error(`Create table failed: ${res.status}`);
        return (await res.json());
    }
    async deleteTable(table) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}`, {
            method: 'DELETE',
            headers: this.headers,
        });
        if (!res.ok)
            throw new Error(`Delete table failed: ${res.status}`);
        return (await res.json());
    }
    async getSchema(table = 'products') {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/schema?table=${encodeURIComponent(table)}`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`Get schema failed: ${res.status}`);
        return (await res.json());
    }
    async executeSql(sql) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/sql/execute`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ sql }),
        });
        if (!res.ok)
            throw new Error(`Execute SQL failed: ${res.status}`);
        return (await res.json());
    }
    async truncateTable(table) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/truncate`, {
            method: 'POST',
            headers: this.headers,
        });
        if (!res.ok)
            throw new Error(`Truncate table failed: ${res.status}`);
        return (await res.json());
    }
    async getIndexes(table) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/indexes`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`Get indexes failed: ${res.status}`);
        return (await res.json());
    }
    async createIndex(table, options) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/indexes`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(options),
        });
        if (!res.ok)
            throw new Error(`Create index failed: ${res.status}`);
        return (await res.json());
    }
    async deleteIndex(table, indexName) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/indexes/${encodeURIComponent(indexName)}`, {
            method: 'DELETE',
            headers: this.headers,
        });
        if (!res.ok)
            throw new Error(`Delete index failed: ${res.status}`);
        return (await res.json());
    }
    async rebuildIndex(table, indexName) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/indexes/${encodeURIComponent(indexName)}/rebuild`, {
            method: 'POST',
            headers: this.headers,
        });
        if (!res.ok)
            throw new Error(`Rebuild index failed: ${res.status}`);
        return (await res.json());
    }
    async getRelationships(table) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/relationships`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`Get relationships failed: ${res.status}`);
        return (await res.json());
    }
    async createRelationship(table, options) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/relationships`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(options),
        });
        if (!res.ok)
            throw new Error(`Create relationship failed: ${res.status}`);
        return (await res.json());
    }
    async deleteRelationship(table, constraintName) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/relationships/${encodeURIComponent(constraintName)}`, {
            method: 'DELETE',
            headers: this.headers,
        });
        if (!res.ok)
            throw new Error(`Delete relationship failed: ${res.status}`);
        return (await res.json());
    }
    async getPolicies(table) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/policies`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`Get policies failed: ${res.status}`);
        return (await res.json());
    }
    async createPolicy(table, options) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/policies`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(options),
        });
        if (!res.ok)
            throw new Error(`Create policy failed: ${res.status}`);
        return (await res.json());
    }
    async deletePolicy(table, policyName) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/tables/${encodeURIComponent(table)}/policies/${encodeURIComponent(policyName)}`, {
            method: 'DELETE',
            headers: this.headers,
        });
        if (!res.ok)
            throw new Error(`Delete policy failed: ${res.status}`);
        return (await res.json());
    }
    async listSnapshots() {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/snapshots`, { headers: this.headers });
        if (!res.ok)
            throw new Error(`List snapshots failed: ${res.status}`);
        return (await res.json());
    }
    async createSnapshot(type = 'دستی فوری') {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/snapshots`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ type }),
        });
        if (!res.ok)
            throw new Error(`Create snapshot failed: ${res.status}`);
        return (await res.json());
    }
    async restoreSnapshot(snapshotId) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/snapshots/${encodeURIComponent(snapshotId)}/restore`, {
            method: 'POST',
            headers: this.headers,
        });
        if (!res.ok)
            throw new Error(`Restore snapshot failed: ${res.status}`);
        return (await res.json());
    }
    async deleteSnapshot(snapshotId) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/db/snapshots/${encodeURIComponent(snapshotId)}`, {
            method: 'DELETE',
            headers: this.headers,
        });
        if (!res.ok)
            throw new Error(`Delete snapshot failed: ${res.status}`);
        return (await res.json());
    }
}
