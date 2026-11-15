import test from 'node:test';
import assert from 'node:assert/strict';
import { TableQueryBuilder } from '../dist/query-builder.js';

test('TableQueryBuilder: Builds full query string with operators and chaining', () => {
  const qb = new TableQueryBuilder('https://api.localme.ir', 'proj-123', 'orders', {});

  qb.select('id, amount, status')
    .eq('status', 'active')
    .neq('cancelled', true)
    .gt('amount', 1000)
    .gte('priority', 1)
    .lt('amount', 50000)
    .lte('attempts', 3)
    .like('code', 'IR%')
    .ilike('note', '%paid%')
    .in('category', ['vps', 'dedicated'])
    .is('deleted_at', 'null')
    .is('verified_at', 'not_null')
    .not('env', 'eq', 'test')
    .or('status.eq.active,role.eq.admin')
    .contains('tags', ['cloud', 'fast'])
    .containedBy('meta', { env: 'prod' })
    .textSearch('desc', 'server')
    .order('created_at', { ascending: false })
    .limit(25);

  const queryStr = (qb as any).buildQueryString();

  assert.ok(queryStr.startsWith('?'));
  const params = new URLSearchParams(queryStr.slice(1));

  assert.strictEqual(params.get('select'), 'id, amount, status');
  assert.strictEqual(params.get('status'), 'eq.active');
  assert.strictEqual(params.get('cancelled'), 'neq.true');
  assert.deepStrictEqual(params.getAll('amount'), ['gt.1000', 'lt.50000']);
  assert.strictEqual(params.get('priority'), 'gte.1');
  assert.strictEqual(params.get('attempts'), 'lte.3');
  assert.strictEqual(params.get('code'), 'like.IR%');
  assert.strictEqual(params.get('note'), 'ilike.%paid%');
  assert.strictEqual(params.get('category'), 'in.(vps,dedicated)');
  assert.strictEqual(params.get('deleted_at'), 'is.null');
  assert.strictEqual(params.get('verified_at'), 'is.not_null');
  assert.strictEqual(params.get('env'), 'not.eq.test');
  assert.strictEqual(params.get('or'), '(status.eq.active,role.eq.admin)');
  assert.strictEqual(params.get('tags'), 'cs.["cloud","fast"]');
  assert.strictEqual(params.get('meta'), 'cd.{"env":"prod"}');
  assert.strictEqual(params.get('desc'), 'fts.server');
  assert.strictEqual(params.get('order'), 'created_at.desc');
  assert.strictEqual(params.get('limit'), '25');
});

test('TableQueryBuilder: select replaces previous select', () => {
  const qb = new TableQueryBuilder('https://api.localme.ir', 'proj-123', 'users', {});
  qb.select('id, name');
  qb.select('email, phone');

  const queryStr = (qb as any).buildQueryString();
  const params = new URLSearchParams(queryStr.slice(1));
  assert.strictEqual(params.get('select'), 'email, phone');
});

test('TableQueryBuilder: range sets offset and limit', () => {
  const qb = new TableQueryBuilder('https://api.localme.ir', 'proj-123', 'logs', {});
  qb.range(10, 29);

  const queryStr = (qb as any).buildQueryString();
  const params = new URLSearchParams(queryStr.slice(1));
  assert.strictEqual(params.get('offset'), '10');
  assert.strictEqual(params.get('limit'), '20'); // 29 - 10 + 1
});
