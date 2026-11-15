import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalMeClient } from '../dist/index.js';

test('LocalMeClient Mock Fetch: Query execution with filters, headers and range', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedOptions: RequestInit | undefined;

  try {
    globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
      interceptedUrl = String(url);
      interceptedOptions = options;
      return new Response(JSON.stringify([{ id: 'prod_1', title: 'Laptop', price: 50000 }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const client = new LocalMeClient({
      projectSlug: 'test-project',
      baseUrl: 'https://test-project.localme.ir',
      apiKey: 'lm_database_secret_key',
    });

    const data = await client
      .from('products')
      .select('id,title,price')
      .eq('status', 'active')
      .range(0, 9)
      .execute();

    assert.ok(Array.isArray(data));
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].id, 'prod_1');

    assert.ok(interceptedUrl.includes('/_baas/v1/test-project/rest/products'));
    assert.ok(interceptedUrl.includes('status=eq.active'));
    assert.ok(interceptedUrl.includes('offset=0'));
    assert.ok(interceptedUrl.includes('limit=10'));

    const headers = interceptedOptions?.headers as Record<string, string>;
    assert.strictEqual(headers['Authorization'], 'Bearer lm_database_secret_key');
    assert.strictEqual(headers['Content-Type'], 'application/json');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('LocalMeClient Mock Fetch: Insert record verifies method, payload, and auth', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedOptions: RequestInit | undefined;

  try {
    globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
      interceptedUrl = String(url);
      interceptedOptions = options;
      return new Response(JSON.stringify({ id: 'row_new_1', name: 'New Item', price: 1200 }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const client = new LocalMeClient({
      projectSlug: 'shop-project',
      baseUrl: 'https://shop-project.localme.ir',
      apiKey: 'lm_db_key_999',
    });

    const result = await client.from('items').insert({ name: 'New Item', price: 1200 });

    assert.strictEqual(result.id, 'row_new_1');
    assert.strictEqual(result.name, 'New Item');
    assert.strictEqual(interceptedOptions?.method, 'POST');
    assert.ok(interceptedUrl.endsWith('/_baas/v1/shop-project/rest/items'));

    const parsedBody = JSON.parse(interceptedOptions?.body as string);
    assert.strictEqual(parsedBody.name, 'New Item');
    assert.strictEqual(parsedBody.price, 1200);

    const headers = interceptedOptions?.headers as Record<string, string>;
    assert.strictEqual(headers['Authorization'], 'Bearer lm_db_key_999');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('LocalMeClient Mock Fetch: Update record by match filter verifies PATCH request', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedOptions: RequestInit | undefined;

  try {
    globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
      interceptedUrl = String(url);
      interceptedOptions = options;
      return new Response(JSON.stringify({ id: 'item_42', price: 8500 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const client = new LocalMeClient({
      projectSlug: 'shop-project',
      baseUrl: 'https://shop-project.localme.ir',
      apiKey: 'lm_db_key_999',
    });

    const updated = await client.from('items').update({ price: 8500 }).match({ id: 'item_42' });

    assert.strictEqual(updated.id, 'item_42');
    assert.strictEqual(updated.price, 8500);
    assert.strictEqual(interceptedOptions?.method, 'PATCH');
    assert.ok(interceptedUrl.endsWith('/_baas/v1/shop-project/rest/items/item_42'));

    const parsedBody = JSON.parse(interceptedOptions?.body as string);
    assert.strictEqual(parsedBody.price, 8500);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('LocalMeClient Mock Fetch: Delete record by rowId and match filter verifies DELETE request', async () => {
  const originalFetch = globalThis.fetch;
  const deletedUrls: string[] = [];

  try {
    globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
      deletedUrls.push(String(url));
      assert.strictEqual(options?.method, 'DELETE');
      return new Response(JSON.stringify({ success: true, rowId: 'item_99' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const client = new LocalMeClient({
      projectSlug: 'shop-project',
      baseUrl: 'https://shop-project.localme.ir',
      apiKey: 'lm_db_key_999',
    });

    // 1. Direct delete(rowId)
    const res1 = await client.from('items').delete('item_99');
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.rowId, 'item_99');
    assert.ok(deletedUrls[0].endsWith('/_baas/v1/shop-project/rest/items/item_99'));

    // 2. Chained delete().match({ id })
    const res2 = await client.from('items').delete().match({ id: 'item_99' });
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.rowId, 'item_99');
    assert.ok(deletedUrls[1].endsWith('/_baas/v1/shop-project/rest/items/item_99'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('LocalMeClient Mock Fetch: Error handling formats HTTP 400 and 500 into detailed errors', async () => {
  const originalFetch = globalThis.fetch;

  try {
    const client = new LocalMeClient({
      projectSlug: 'err-project',
      baseUrl: 'https://err-project.localme.ir',
      apiKey: 'lm_db_key_err',
    });

    // 1. HTTP 400 with JSON error details
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          error: 'ستون نامعتبر است',
          code: 'PGRST100',
          detail: 'Column "foo" does not exist in table "items"',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await client.from('items').select('foo').execute();
      },
      (err: any) => {
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.code, 'PGRST100');
        assert.ok(err.message.includes('ستون نامعتبر است'));
        assert.strictEqual(err.detail, 'Column "foo" does not exist in table "items"');
        return true;
      }
    );

    // 2. HTTP 500 with non-JSON plain text body
    globalThis.fetch = (async () => {
      return new Response('Internal Server Error Occurred', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await client.from('items').insert({ name: 'Crash' });
      },
      (err: any) => {
        assert.strictEqual(err.status, 500);
        assert.ok(err.message.includes('500'));
        return true;
      }
    );

    // 3. HTTP 401 Unauthorized
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API Key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await client.from('items').execute();
      },
      (err: any) => {
        assert.strictEqual(err.status, 401);
        assert.ok(err.message.includes('Unauthorized'));
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('LocalMeClient Mock Fetch: client.auth.signUp verifies URL, payload, headers, and response', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedOptions: RequestInit | undefined;

  try {
    globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
      interceptedUrl = String(url);
      interceptedOptions = options;
      return new Response(
        JSON.stringify({
          success: true,
          tokens: {
            accessToken: 'tok_jwt_user_1',
            refreshToken: 'rt_user_1',
            expiresInSeconds: 3600,
            tokenType: 'Bearer',
          },
          user: {
            id: 'u_101',
            email: 'dev@test.ir',
            username: 'dev101',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }) as typeof fetch;

    const client = new LocalMeClient({
      projectSlug: 'auth-project',
      baseUrl: 'https://auth-project.localme.ir',
      apiKey: 'lm_anon_key_123',
    });

    const res = await client.auth.signUp({
      username: 'dev101',
      email: 'dev@test.ir',
      phone: '09120000000',
      password: 'MySecretPassword123!',
      fullName: 'Developer Test',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.tokens.accessToken, 'tok_jwt_user_1');
    assert.strictEqual(res.user?.id, 'u_101');
    assert.strictEqual(interceptedOptions?.method, 'POST');
    assert.strictEqual(interceptedUrl, 'https://auth-project.localme.ir/_baas/v1/auth-project/auth/signup');

    const body = JSON.parse(interceptedOptions?.body as string);
    assert.strictEqual(body.username, 'dev101');
    assert.strictEqual(body.email, 'dev@test.ir');
    assert.strictEqual(body.phone, '09120000000');
    assert.strictEqual(body.password, 'MySecretPassword123!');
    assert.strictEqual(body.full_name, 'Developer Test');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('LocalMeClient Mock Fetch: client.auth.signInWithPassword verifies URL, payload, and tokens', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedOptions: RequestInit | undefined;

  try {
    globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
      interceptedUrl = String(url);
      interceptedOptions = options;
      return new Response(
        JSON.stringify({
          success: true,
          tokens: {
            accessToken: 'tok_login_jwt',
            refreshToken: 'rt_login_fresh',
            expiresInSeconds: 7200,
            tokenType: 'Bearer',
          },
          user: {
            id: 'u_202',
            email: 'user@example.com',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }) as typeof fetch;

    const client = new LocalMeClient({
      projectSlug: 'store-app',
      baseUrl: 'https://store-app.localme.ir',
    });

    const res = await client.auth.signInWithPassword({
      login: 'user@example.com',
      password: 'Password999!',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.tokens.accessToken, 'tok_login_jwt');
    assert.strictEqual(interceptedOptions?.method, 'POST');
    assert.strictEqual(interceptedUrl, 'https://store-app.localme.ir/_baas/v1/store-app/auth/login');

    const body = JSON.parse(interceptedOptions?.body as string);
    assert.strictEqual(body.login, 'user@example.com');
    assert.strictEqual(body.password, 'Password999!');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('LocalMeClient Mock Fetch: client.auth.refreshToken verifies URL and payload', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedOptions: RequestInit | undefined;

  try {
    globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
      interceptedUrl = String(url);
      interceptedOptions = options;
      return new Response(
        JSON.stringify({
          success: true,
          tokens: {
            accessToken: 'tok_refreshed_jwt',
            refreshToken: 'rt_new_token',
            expiresInSeconds: 3600,
            tokenType: 'Bearer',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }) as typeof fetch;

    const client = new LocalMeClient({
      projectSlug: 'token-proj',
      baseUrl: 'https://token-proj.localme.ir',
    });

    const res = await client.auth.refreshToken('rt_old_refresh_token');

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.tokens.accessToken, 'tok_refreshed_jwt');
    assert.strictEqual(res.tokens.refreshToken, 'rt_new_token');
    assert.strictEqual(interceptedOptions?.method, 'POST');
    assert.strictEqual(interceptedUrl, 'https://token-proj.localme.ir/_baas/v1/token-proj/auth/refresh');

    const body = JSON.parse(interceptedOptions?.body as string);
    assert.strictEqual(body.refresh_token, 'rt_old_refresh_token');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('LocalMeClient Mock Fetch: client.functions.invoke verifies URL, Authorization header, and payload', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedOptions: RequestInit | undefined;

  try {
    globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
      interceptedUrl = String(url);
      interceptedOptions = options;
      return new Response(
        JSON.stringify({
          success: true,
          output: { result: 'computed_ok', value: 42 },
          executionTimeMs: 12,
          logs: ['[INFO] Processed order'],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }) as typeof fetch;

    const client = new LocalMeClient({
      projectSlug: 'compute-app',
      baseUrl: 'https://compute-app.localme.ir',
      apiKey: 'lm_func_secret_key',
    });

    const res = await client.functions.invoke<{ result: string; value: number }>(
      'process-order',
      { orderId: 'ord_987', amount: 50000 }
    );

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.output?.result, 'computed_ok');
    assert.strictEqual(res.output?.value, 42);
    assert.strictEqual(interceptedOptions?.method, 'POST');
    assert.strictEqual(interceptedUrl, 'https://compute-app.localme.ir/_baas/v1/compute-app/functions/process-order/invoke');

    const headers = interceptedOptions?.headers as Record<string, string>;
    assert.strictEqual(headers['Authorization'], 'Bearer lm_func_secret_key');
    assert.strictEqual(headers['Content-Type'], 'application/json');

    const body = JSON.parse(interceptedOptions?.body as string);
    assert.strictEqual(body.orderId, 'ord_987');
    assert.strictEqual(body.amount, 50000);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('LocalMeClient Mock Fetch: client.auth.requestPasswordReset verifies URL and payload', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedOptions: RequestInit | undefined;

  try {
    globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
      interceptedUrl = String(url);
      interceptedOptions = options;
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Reset instructions sent.',
          resetToken: 'reset_tok_abcdef123456',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }) as typeof fetch;

    const client = new LocalMeClient({
      projectSlug: 'auth-slug',
      baseUrl: 'https://auth-slug.localme.ir',
    });

    const res = await client.auth.requestPasswordReset('user@example.com');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.resetToken, 'reset_tok_abcdef123456');
    assert.strictEqual(interceptedOptions?.method, 'POST');
    assert.strictEqual(interceptedUrl, 'https://auth-slug.localme.ir/_baas/v1/auth-slug/auth/password-reset/request');

    const body = JSON.parse(interceptedOptions?.body as string);
    assert.strictEqual(body.identifier, 'user@example.com');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('LocalMeClient Mock Fetch: client.auth.confirmPasswordReset verifies URL and payload', async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = '';
  let interceptedOptions: RequestInit | undefined;

  try {
    globalThis.fetch = (async (url: string | URL | Request, options?: RequestInit) => {
      interceptedUrl = String(url);
      interceptedOptions = options;
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Password successfully reset.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }) as typeof fetch;

    const client = new LocalMeClient({
      projectSlug: 'auth-slug',
      baseUrl: 'https://auth-slug.localme.ir',
    });

    const res = await client.auth.confirmPasswordReset('user@example.com', 'reset_tok_abcdef123456', 'NewPass2026!');
    assert.strictEqual(res.success, true);
    assert.strictEqual(interceptedOptions?.method, 'POST');
    assert.strictEqual(interceptedUrl, 'https://auth-slug.localme.ir/_baas/v1/auth-slug/auth/password-reset/confirm');

    const body = JSON.parse(interceptedOptions?.body as string);
    assert.strictEqual(body.identifier, 'user@example.com');
    assert.strictEqual(body.resetToken, 'reset_tok_abcdef123456');
    assert.strictEqual(body.newPassword, 'NewPass2026!');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

