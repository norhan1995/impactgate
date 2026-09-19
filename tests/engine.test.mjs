import test from 'node:test';
import assert from 'node:assert/strict';
import { freshStore, simulate, preflight, executeDelete, rollback, countResources } from '../core/engine.mjs';

test('normal simulation predicts full destructive blast radius', () => {
  const store = freshStore();
  const preview = simulate(store);
  assert.deepEqual(preview.effects, { members: 4, api_keys: 2, automations: 2, scheduled_exports: 2, webhooks: 1 });
  assert.equal(preflight(store, preview).ok, true);
});

test('tweak preserves scheduled exports in prediction and execution', () => {
  const store = freshStore();
  const preview = simulate(store, { preserveExports: true });
  assert.equal(preview.effects.scheduled_exports, 0);
  const result = executeDelete(store, preview);
  assert.equal(result.blocked, false);
  assert.equal(store.workspace, null);
  assert.equal(countResources(store.resources).scheduled_exports, 2);
});

test('under-predicted legal hold is caught by independent preflight', () => {
  const store = freshStore();
  const preview = simulate(store, { failureMode: true });
  assert.equal(preview.effects.members, 4); // preview looks normal
  const gate = preflight(store, preview);
  assert.equal(gate.ok, false);
  assert.equal(gate.code, 'CRITICAL_DEPENDENCY');
  const result = executeDelete(store, preview);
  assert.equal(result.blocked, true);
  assert.notEqual(store.workspace, null);
});

test('state drift invalidates a previously approved simulation', () => {
  const store = freshStore();
  const preview = simulate(store);
  store.resources.push({ id: 'late-change', workspaceKey: 'northstar-health', type: 'api_key', name: 'Created after preview' });
  const gate = preflight(store, preview);
  assert.equal(gate.ok, false);
  assert.equal(gate.code, 'STATE_DRIFT');
});

test('rollback restores the deleted workspace and dependencies', () => {
  const store = freshStore();
  const preview = simulate(store);
  const result = executeDelete(store, preview);
  assert.equal(store.workspace, null);
  rollback(store, result.snapshotId);
  assert.equal(store.workspace.name, 'Northstar Health');
  assert.deepEqual(countResources(store.resources), { members: 4, api_keys: 2, automations: 2, scheduled_exports: 2, webhooks: 1 });
});
