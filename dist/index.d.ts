/**
 * LocalMe Sovereign Client SDK for Web and Mobile
 * Pure .NET 10 + PostgreSQL 18.1 Wire Contract
 * Exposes core namespaces: localme.auth, localme.from(), localme.functions, localme.database
 */
export * from './types.js';
import type { LocalMeConfig, FunctionInvokeResult, FunctionMeta, AuthSignUpOptions, AuthSignInOptions, AuthResult } from './types.js';
export * from './query-builder.js';
import { TableQueryBuilder } from './query-builder.js';
export declare class LocalMeClient {
    readonly projectSlug: string;
    readonly baseUrl: string;
    private readonly apiKey?;
    constructor(config: LocalMeConfig);
    /**
     * Helper headers factory
     */
    private getHeaders;
    /**
     * PostgREST AST Dynamic SQL Query Builder.
     * Enables fluent chained queries: client.from('users').select('*').eq('status', 'active').execute()
     */
    from<T = Record<string, unknown>>(table: string): TableQueryBuilder<T>;
    /**
     * Edge Functions Invoker & Manager (Jint Sandboxed Execution).
     */
    get functions(): {
        list(): Promise<FunctionMeta[]>;
        get(slug: string): Promise<FunctionMeta>;
        deploy(name: string, script: string, slug?: string): Promise<FunctionMeta>;
        update(slug: string, name?: string, script?: string): Promise<FunctionMeta>;
        delete(slug: string): Promise<{
            success: boolean;
        }>;
        invoke<T = unknown>(slug: string, payload?: unknown): Promise<FunctionInvokeResult<T>>;
    };
    /**
     * Project End-User Auth Service (Argon2id Email/Password, Ed25519 JWT, User CRUD).
     */
    get auth(): {
        signUp(options: AuthSignUpOptions): Promise<AuthResult>;
        signInWithPassword(options: AuthSignInOptions): Promise<AuthResult>;
        refreshToken(refreshToken: string): Promise<AuthResult>;
        signOut(refreshToken?: string): Promise<{
            success: boolean;
        }>;
        getJwks(): Promise<Record<string, unknown>>;
        getUsers(): Promise<Record<string, unknown>[]>;
        deleteUser(userId: string): Promise<{
            success: boolean;
        }>;
        updateUserStatus(userId: string, isConfirmed: boolean): Promise<{
            success: boolean;
            user: Record<string, unknown>;
        }>;
        resetUserPassword(userId: string, newPassword: string): Promise<{
            success: boolean;
            user: Record<string, unknown>;
        }>;
        getPolicies(): Promise<Record<string, unknown>>;
        updatePolicies(policies: Record<string, string>): Promise<{
            success: boolean;
            config: unknown;
        }>;
        requestPasswordReset(identifier: string): Promise<{
            success: boolean;
            message?: string;
            resetToken?: string;
        }>;
        confirmPasswordReset(identifier: string, resetToken: string, newPassword: string): Promise<{
            success: boolean;
            message?: string;
        }>;
    };
    /**
     * Telemetry & Project Logs Service (PostgreSQL Partitioned Logs & Slow Queries).
     */
    get telemetry(): {
        getLogs(options?: {
            service?: string;
            level?: string;
            limit?: number;
        }): Promise<Record<string, unknown>[]>;
        log(service: string, level: "INFO" | "WARN" | "ERROR", message: string, traceId?: string): Promise<Record<string, unknown>>;
    };
}
/**
 * Convenience factory to create a LocalMeClient instance.
 */
export declare function createClient(config: LocalMeConfig): LocalMeClient;
