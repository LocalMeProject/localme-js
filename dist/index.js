/**
 * LocalMe Sovereign Client SDK for Web and Mobile
 * Pure .NET 10 + PostgreSQL 18.1 Wire Contract
 * Exposes core namespaces: localme.auth, localme.from(), localme.functions, localme.database
 */
export * from './types.js';
export * from './query-builder.js';
import { TableQueryBuilder } from './query-builder.js';
export class LocalMeClient {
    projectSlug;
    baseUrl;
    apiKey;
    constructor(config) {
        this.projectSlug = config.projectSlug;
        this.baseUrl = config.baseUrl || `https://${config.projectSlug}.localme.ir`;
        this.apiKey = config.apiKey;
    }
    /**
     * Helper headers factory
     */
    getHeaders(extra) {
        const headers = {
            'Content-Type': 'application/json',
            ...(extra || {}),
        };
        if (this.apiKey) {
            headers.Authorization = `Bearer ${this.apiKey}`;
        }
        return headers;
    }
    /**
     * PostgREST AST Dynamic SQL Query Builder.
     * Enables fluent chained queries: client.from('users').select('*').eq('status', 'active').execute()
     */
    from(table) {
        return new TableQueryBuilder(this.baseUrl, this.projectSlug, table, this.getHeaders());
    }
    /**
     * Edge Functions Invoker & Manager (Jint Sandboxed Execution).
     */
    get functions() {
        const baseUrl = this.baseUrl;
        const projectSlug = this.projectSlug;
        const headers = this.getHeaders();
        return {
            async list() {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/functions`, { headers });
                if (!res.ok)
                    throw new Error(`List functions failed: ${res.status}`);
                return (await res.json());
            },
            async get(slug) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/functions/${slug}`, { headers });
                if (!res.ok)
                    throw new Error(`Get function failed: ${res.status}`);
                return (await res.json());
            },
            async deploy(name, script, slug) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/functions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ name, script, slug }),
                });
                if (!res.ok)
                    throw new Error(`Deploy function failed: ${res.status}`);
                return (await res.json());
            },
            async update(slug, name, script) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/functions/${slug}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ name, script }),
                });
                if (!res.ok)
                    throw new Error(`Update function failed: ${res.status}`);
                return (await res.json());
            },
            async delete(slug) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/functions/${slug}`, {
                    method: 'DELETE',
                    headers,
                });
                if (!res.ok)
                    throw new Error(`Delete function failed: ${res.status}`);
                return (await res.json());
            },
            async invoke(slug, payload) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/functions/${slug}/invoke`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload ?? {}),
                });
                if (!res.ok)
                    throw new Error(`Function invocation failed: ${res.status}`);
                return (await res.json());
            },
        };
    }
    /**
     * Project End-User Auth Service (Argon2id Email/Password, Ed25519 JWT, User CRUD).
     */
    get auth() {
        const baseUrl = this.baseUrl;
        const projectSlug = this.projectSlug;
        const headers = this.getHeaders();
        return {
            async signUp(options) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: options.username,
                        email: options.email,
                        phone: options.phone,
                        password: options.password,
                        full_name: options.fullName,
                    }),
                });
                if (!res.ok)
                    throw new Error(`Sign up failed: ${res.status}`);
                return (await res.json());
            },
            async signInWithPassword(options) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        login: options.login,
                        password: options.password,
                    }),
                });
                if (!res.ok)
                    throw new Error(`Password login failed: ${res.status}`);
                return (await res.json());
            },
            async refreshToken(refreshToken) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
                if (!res.ok)
                    throw new Error(`Refresh token failed: ${res.status}`);
                return (await res.json());
            },
            async signOut(refreshToken) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/logout`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
                if (!res.ok)
                    return { success: false };
                return (await res.json());
            },
            async getJwks() {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/jwks`);
                if (!res.ok)
                    throw new Error(`Fetch JWKS failed: ${res.status}`);
                return (await res.json());
            },
            async getUsers() {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/users`, { headers });
                if (!res.ok)
                    throw new Error(`List users failed: ${res.status}`);
                return (await res.json());
            },
            async deleteUser(userId) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/users/${userId}`, {
                    method: 'DELETE',
                    headers,
                });
                if (!res.ok)
                    throw new Error(`Delete user failed: ${res.status}`);
                return (await res.json());
            },
            async updateUserStatus(userId, isConfirmed) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/users/${userId}/status`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ is_confirmed: isConfirmed }),
                });
                if (!res.ok)
                    throw new Error(`Update user status failed: ${res.status}`);
                return (await res.json());
            },
            async resetUserPassword(userId, newPassword) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/users/${userId}/reset-password`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ password: newPassword }),
                });
                if (!res.ok)
                    throw new Error(`Reset password failed: ${res.status}`);
                return (await res.json());
            },
            async getPolicies() {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/policies`, { headers });
                if (!res.ok)
                    throw new Error(`Get policies failed: ${res.status}`);
                return (await res.json());
            },
            async updatePolicies(policies) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/policies`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(policies),
                });
                if (!res.ok)
                    throw new Error(`Update policies failed: ${res.status}`);
                return (await res.json());
            },
            async requestPasswordReset(identifier) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/password-reset/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier }),
                });
                if (!res.ok)
                    throw new Error(`Password reset request failed: ${res.status}`);
                return (await res.json());
            },
            async confirmPasswordReset(identifier, resetToken, newPassword) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/auth/password-reset/confirm`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, resetToken, newPassword }),
                });
                if (!res.ok)
                    throw new Error(`Password reset confirm failed: ${res.status}`);
                return (await res.json());
            },
        };
    }
    /**
     * Telemetry & Project Logs Service (PostgreSQL Partitioned Logs & Slow Queries).
     */
    get telemetry() {
        const baseUrl = this.baseUrl;
        const projectSlug = this.projectSlug;
        const headers = this.getHeaders();
        return {
            async getLogs(options) {
                const params = new URLSearchParams();
                if (options?.service)
                    params.set('service', options.service);
                if (options?.level)
                    params.set('level', options.level);
                if (options?.limit)
                    params.set('limit', String(options.limit));
                const q = params.toString() ? `?${params.toString()}` : '';
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/logs${q}`, { headers });
                if (!res.ok)
                    throw new Error(`Fetch logs failed: ${res.status}`);
                return (await res.json());
            },
            async log(service, level, message, traceId) {
                const res = await fetch(`${baseUrl}/_baas/v1/${projectSlug}/logs`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ service, level, message, trace_id: traceId }),
                });
                if (!res.ok)
                    throw new Error(`Emit log failed: ${res.status}`);
                return (await res.json());
            },
        };
    }
}
/**
 * Convenience factory to create a LocalMeClient instance.
 */
export function createClient(config) {
    return new LocalMeClient(config);
}
