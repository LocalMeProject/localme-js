async function handleFetchError(res, defaultMsg) {
    let errBody = null;
    try {
        errBody = (await res.json());
    }
    catch {
        // ignore
    }
    const msg = errBody?.error || errBody?.detail || errBody?.message || `${defaultMsg}: ${res.status}`;
    const error = new Error(msg);
    error.status = res.status;
    error.code = errBody?.code;
    error.detail = errBody?.detail;
    error.error = errBody?.error ?? errBody;
    error.responseBody = errBody;
    throw error;
}
/**
 * Relational Database Query Builder (PostgREST style).
 */
export class TableQueryBuilder {
    baseUrl;
    projectSlug;
    table;
    headers;
    queryParams = [];
    constructor(baseUrl, projectSlug, table, headers) {
        this.baseUrl = baseUrl;
        this.projectSlug = projectSlug;
        this.table = table;
        this.headers = headers;
    }
    setOrAppendParam(key, value, replace = false) {
        if (replace) {
            this.queryParams = this.queryParams.filter(([k]) => k !== key);
        }
        this.queryParams.push([key, value]);
    }
    select(columns = '*') {
        this.setOrAppendParam('select', columns, true);
        return this;
    }
    eq(column, value) {
        this.queryParams.push([column, `eq.${value}`]);
        return this;
    }
    neq(column, value) {
        this.queryParams.push([column, `neq.${value}`]);
        return this;
    }
    gt(column, value) {
        this.queryParams.push([column, `gt.${value}`]);
        return this;
    }
    gte(column, value) {
        this.queryParams.push([column, `gte.${value}`]);
        return this;
    }
    lt(column, value) {
        this.queryParams.push([column, `lt.${value}`]);
        return this;
    }
    lte(column, value) {
        this.queryParams.push([column, `lte.${value}`]);
        return this;
    }
    like(column, pattern) {
        this.queryParams.push([column, `like.${pattern}`]);
        return this;
    }
    ilike(column, pattern) {
        this.queryParams.push([column, `ilike.${pattern}`]);
        return this;
    }
    in(column, values) {
        this.queryParams.push([column, `in.(${values.join(',')})`]);
        return this;
    }
    is(column, value) {
        this.queryParams.push([column, `is.${value}`]);
        return this;
    }
    not(column, operator, value) {
        this.queryParams.push([column, `not.${operator}.${value}`]);
        return this;
    }
    or(filters) {
        this.queryParams.push(['or', filters.startsWith('(') ? filters : `(${filters})`]);
        return this;
    }
    contains(column, value) {
        this.queryParams.push([column, `cs.${typeof value === 'object' ? JSON.stringify(value) : value}`]);
        return this;
    }
    containedBy(column, value) {
        this.queryParams.push([column, `cd.${typeof value === 'object' ? JSON.stringify(value) : value}`]);
        return this;
    }
    textSearch(column, query) {
        this.queryParams.push([column, `fts.${query}`]);
        return this;
    }
    order(column, options) {
        const dir = options?.ascending === false ? 'desc' : 'asc';
        this.setOrAppendParam('order', `${column}.${dir}`, true);
        return this;
    }
    limit(count) {
        this.setOrAppendParam('limit', String(count), true);
        return this;
    }
    range(from, to) {
        this.setOrAppendParam('offset', String(from), true);
        this.setOrAppendParam('limit', String(to - from + 1), true);
        return this;
    }
    buildQueryString(extra) {
        const params = new URLSearchParams();
        for (const [k, v] of this.queryParams) {
            params.append(k, v);
        }
        if (extra) {
            for (const [k, v] of extra) {
                params.append(k, v);
            }
        }
        const q = params.toString();
        return q ? `?${q}` : '';
    }
    async count() {
        const search = this.buildQueryString([['limit', '1']]);
        const url = `${this.baseUrl}/_baas/v1/${this.projectSlug}/rest/${this.table}${search}`;
        const res = await fetch(url, { headers: this.headers });
        if (!res.ok)
            await handleFetchError(res, 'Count failed');
        const countHeader = res.headers.get('X-Total-Count');
        if (countHeader)
            return Number(countHeader);
        const rows = (await res.json());
        return rows.length;
    }
    async execute() {
        const search = this.buildQueryString();
        const url = `${this.baseUrl}/_baas/v1/${this.projectSlug}/rest/${this.table}${search}`;
        const res = await fetch(url, { headers: this.headers });
        if (!res.ok)
            await handleFetchError(res, 'Query failed');
        return (await res.json());
    }
    async single() {
        const search = this.buildQueryString([['limit', '2']]);
        const url = `${this.baseUrl}/_baas/v1/${this.projectSlug}/rest/${this.table}${search}`;
        const res = await fetch(url, { headers: this.headers });
        if (!res.ok)
            await handleFetchError(res, 'Query failed');
        const rows = (await res.json());
        if (rows.length === 0) {
            throw new Error('JSON object requested, multiple (or no) rows returned');
        }
        if (rows.length > 1) {
            throw new Error('JSON object requested, multiple rows returned');
        }
        return rows[0];
    }
    async maybeSingle() {
        const search = this.buildQueryString([['limit', '2']]);
        const url = `${this.baseUrl}/_baas/v1/${this.projectSlug}/rest/${this.table}${search}`;
        const res = await fetch(url, { headers: this.headers });
        if (!res.ok)
            await handleFetchError(res, 'Query failed');
        const rows = (await res.json());
        if (rows.length === 0) {
            return null;
        }
        if (rows.length > 1) {
            throw new Error('JSON object requested, multiple rows returned');
        }
        return rows[0];
    }
    then(onfulfilled, onrejected) {
        return this.execute().then(onfulfilled, onrejected);
    }
    async insert(record) {
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/rest/${this.table}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(record),
        });
        if (!res.ok)
            await handleFetchError(res, 'Insert failed');
        return (await res.json());
    }
    async insertMany(records, options) {
        if (records.length === 0)
            return [];
        const chunkSize = options?.chunkSize ?? 50;
        const results = [];
        for (let i = 0; i < records.length; i += chunkSize) {
            const chunk = records.slice(i, i + chunkSize);
            const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/rest/${this.table}/batch`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(chunk),
            });
            if (!res.ok)
                await handleFetchError(res, 'Batch insert failed');
            const inserted = (await res.json());
            results.push(...inserted);
        }
        return results;
    }
    update(patch) {
        const { baseUrl, projectSlug, table, headers } = this;
        return {
            async match(filter) {
                const rowId = 'id' in filter ? filter.id : Object.values(filter)[0];
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/rest/${table}/${encodeURIComponent(String(rowId))}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(patch),
                });
                if (!res.ok)
                    await handleFetchError(res, 'Update failed');
                return (await res.json());
            },
        };
    }
    async upsert(record, options) {
        const conflict = options?.onConflict ?? 'id';
        const res = await fetch(`${this.baseUrl}/_baas/v1/${this.projectSlug}/rest/${this.table}?on_conflict=${conflict}`, {
            method: 'PUT',
            headers: this.headers,
            body: JSON.stringify(record),
        });
        if (!res.ok)
            await handleFetchError(res, 'Upsert failed');
        return (await res.json());
    }
    delete(rowId) {
        const { baseUrl, projectSlug, table, headers } = this;
        if (rowId !== undefined) {
            return (async () => {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/rest/${table}/${encodeURIComponent(String(rowId))}`, {
                    method: 'DELETE',
                    headers,
                });
                if (!res.ok)
                    await handleFetchError(res, 'Delete failed');
                return (await res.json());
            })();
        }
        return {
            async match(filter) {
                const targetId = 'id' in filter ? filter.id : Object.values(filter)[0];
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/rest/${table}/${encodeURIComponent(String(targetId))}`, {
                    method: 'DELETE',
                    headers,
                });
                if (!res.ok)
                    await handleFetchError(res, 'Delete failed');
                return (await res.json());
            },
        };
    }
}
