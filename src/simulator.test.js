import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, isLost, simulate, validate } from './simulator.js';
const scenario = { count: 12, window: 4, loss: 0, seed: 42 };

test('no-loss window one behaves identically for all protocols', () => {
  const runs = compare({ ...scenario, window: 1 });
  assert.deepEqual(runs.map(r => r.stats.goodput), [0.25, 0.25, 0.25]);
  for (const r of runs) {
    assert.equal(r.complete, true);
    assert.equal(r.stats.delivered, 12);
    assert.equal(r.stats.attempts, 12);
    assert.equal(r.stats.retransmissions, 0);
    assert.equal(r.stats.efficiency, 100);
  }
});

test('pipelining at zero loss improves goodput without spurious timeouts', () => {
  const [stop, gbn, sr] = compare(scenario);
  assert.ok(gbn.stats.goodput > stop.stats.goodput);
  assert.equal(gbn.stats.goodput, sr.stats.goodput);
  for (const run of [stop, gbn, sr]) assert.ok(!run.events.some(e => e.type === 'timeout'));
});

test('a lost middle frame is discarded by GBN but buffered by SR', () => {
  const config = { count: 7, window: 4, loss: 20, seed: 42 };
  const [, gbn, sr] = compare(config);
  assert.ok(gbn.complete && sr.complete);
  assert.ok(gbn.events.some(e => e.type === 'discard'));
  assert.ok(sr.events.some(e => e.type === 'buffer'));
  assert.ok(gbn.stats.retransmissions > sr.stats.retransmissions);
  assert.equal(sr.stats.delivered, config.count);
  assert.equal(gbn.stats.delivered, config.count);
});

test('every loss lacks receiver delivery for that particular attempt', () => {
  for (const run of compare({ ...scenario, loss: 50 })) {
    const losses = run.events.filter(e => e.type === 'loss');
    assert.equal(losses.length, run.stats.lost);
    for (const e of losses) assert.ok(!run.events.some(other =>
      other.frame === e.frame && other.attempt === e.attempt &&
      ['receive', 'buffer', 'discard', 'duplicate'].includes(other.type)));
    assert.equal(run.stats.attempts, scenario.count + run.stats.retransmissions);
    assert.equal(run.stats.efficiency, scenario.count / run.stats.attempts * 100);
  }
});

test('runs and per-attempt loss are reproducible, independent of protocol', () => {
  const config = { ...scenario, loss: 25, protocol: 'sr' };
  assert.deepEqual(simulate(config), simulate(config));
  for (let f = 0; f < 12; f++) assert.equal(isLost(42, f, 1, 25), isLost(42, f, 1, 25));
  for (let f = 0; f < 12; f++) assert.equal(isLost(42, f, 1, 0), false);
});

test('boundaries and invalid inputs', () => {
  assert.equal(validate({ count: 1, window: 16, loss: 50, seed: 0, protocol: 'sr' }), null);
  for (const key of ['count', 'window', 'loss', 'seed']) {
    const value = key === 'seed' ? 1.2 : -1;
    assert.ok(validate({ ...scenario, protocol: 'stop', [key]: value }));
  }
  assert.throws(() => simulate({ ...scenario, protocol: 'unknown' }));
  const run = simulate({ count: 100, window: 16, loss: 50, seed: 42, protocol: 'sr' });
  assert.ok(run.complete);
  assert.equal(run.stats.delivered, 100);
});
