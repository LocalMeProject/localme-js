import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalMeClient, createClient } from '../dist/index.js';
import { TableQueryBuilder } from '../dist/query-builder.js';

test('LocalMeClient: Initializes with default sovereign baseUrl', () => {
  const client = new LocalMeClient({ projectSlug: 'test-project' });

  assert.strictEqual(client.projectSlug, 'test-project');
  assert.strictEqual(client.baseUrl, 'https://test-project.localme.ir');
});

test('LocalMeClient: Preserves custom baseUrl when provided', () => {
  const client = new LocalMeClient({
    projectSlug: 'custom-proj',
    baseUrl: 'https://api.custom-domain.ir',
    apiKey: 'lm_sec_123',
  });

  assert.strictEqual(client.baseUrl, 'https://api.custom-domain.ir');
});

test('LocalMeClient: Injects Authorization header when apiKey is supplied', () => {
  const clientWithKey = new LocalMeClient({
    projectSlug: 'key-proj',
    apiKey: 'my_secret_api_key',
  });

  const headers = (clientWithKey as any).getHeaders({ 'X-Custom': 'Value' });
  assert.strictEqual(headers['Content-Type'], 'application/json');
  assert.strictEqual(headers['Authorization'], 'Bearer my_secret_api_key');
  assert.strictEqual(headers['X-Custom'], 'Value');

  const clientNoKey = new LocalMeClient({ projectSlug: 'no-key-proj' });
  const headersNoKey = (clientNoKey as any).getHeaders();
  assert.strictEqual(headersNoKey['Authorization'], undefined);
});

test('LocalMeClient: Factory createClient constructs properly configured instance', () => {
  const client = createClient({ projectSlug: 'factory-test', apiKey: 'key_abc' });
  assert.ok(client instanceof LocalMeClient);
  assert.strictEqual(client.projectSlug, 'factory-test');

  const qb = client.from('products');
  assert.ok(qb instanceof TableQueryBuilder);

  assert.ok(client.functions);
  assert.ok(client.auth);
  assert.ok(client.telemetry);
});
