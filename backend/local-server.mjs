import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { freshStore, countResources, simulate, executeDelete, rollback } from '../core/engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const dataFile = path.join(dataDir, 'store.json');
fs.mkdirSync(dataDir, { recursive: true });

function load() {
  if (!fs.existsSync(dataFile)) save(freshStore());
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}
function save(store) {
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}
function audit(store, kind, message) {
  store.audits.push({ id: crypto.randomUUID(), kind, message, createdAt: new Date().toISOString() });
}

const app = express();
app.use(express.json());

app.get('/api/state', (_req, res) => {
  const store = load();
  res.json({
    workspace: store.workspace,
    counts: countResources(store.resources),
    preservedExports: store.resources.filter(r => r.type === 'scheduled_export').length,
    audits: store.audits
  });
});

app.post('/api/reset', (_req, res) => {
  const store = freshStore();
  save(store);
  res.json({ ok: true });
});

app.post('/api/simulate', (req, res) => {
  try {
    const store = load();
    const preview = simulate(store, req.body || {});
    const simulationId = crypto.randomUUID();
    store.simulations[simulationId] = { ...preview, status: 'pending', createdAt: new Date().toISOString() };
    save(store);
    res.json({ simulationId, workspaceName: store.workspace?.name || 'Northstar Health', ...preview });
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

app.post('/api/reject', (req, res) => {
  const store = load();
  const sim = store.simulations[req.body?.simulationId];
  if (!sim) return res.status(404).json({ error: 'simulation_not_found' });
  sim.status = 'rejected';
  audit(store, 'rejected', 'Human rejected the proposed deletion. No write executed.');
  save(store);
  res.json({ rejected: true });
});

app.post('/api/execute', (req, res) => {
  const store = load();
  const simulationId = req.body?.simulationId;
  const sim = store.simulations[simulationId];
  if (!sim) return res.status(404).json({ error: 'simulation_not_found' });
  if (sim.status !== 'pending') return res.status(409).json({ error: 'simulation_not_executable' });

  const outcome = executeDelete(store, sim);
  if (outcome.blocked) {
    sim.status = 'blocked';
    audit(store, 'blocked', outcome.gate.message);
    save(store);
    return res.json({
      blocked: true,
      message: outcome.gate.code === 'CRITICAL_DEPENDENCY'
        ? 'The simulator missed a regulatory retention hold. The independent execution guard detected it and refused the deletion.'
        : outcome.gate.message,
      safetyNet: outcome.gate.code === 'CRITICAL_DEPENDENCY'
        ? 'Authoritative critical-dependency preflight'
        : 'State fingerprint drift guard'
    });
  }

  sim.status = 'executed';
  audit(store, 'delete', sim.preserveExports
    ? 'Workspace deleted; scheduled exports preserved by approved tweak.'
    : 'Workspace and modeled dependencies deleted.');
  save(store);
  res.json({
    executed: true,
    snapshotId: outcome.snapshotId,
    message: sim.preserveExports
      ? 'Workspace deleted. Scheduled exports were left intact exactly as the revised simulation specified.'
      : 'Workspace and modeled dependencies were deleted. A rollback snapshot is available.'
  });
});

app.post('/api/rollback', (req, res) => {
  try {
    const store = load();
    rollback(store, req.body?.snapshotId);
    audit(store, 'rollback', 'Rollback restored the deleted workspace and dependencies from snapshot.');
    save(store);
    res.json({ restored: true });
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

app.listen(8787, () => {
  console.log('ImpactGate API listening on http://localhost:8787');
});
