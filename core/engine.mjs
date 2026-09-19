import crypto from 'node:crypto';

export const WORKSPACE = {
  workspaceKey: 'northstar-health',
  name: 'Northstar Health',
  plan: 'Enterprise',
  status: 'active'
};

export const BASE_RESOURCES = [
  { type: 'member', name: 'Maya — admin' },
  { type: 'member', name: 'Omar — analyst' },
  { type: 'member', name: 'Lena — operator' },
  { type: 'member', name: 'Sam — billing' },
  { type: 'api_key', name: 'production-api' },
  { type: 'api_key', name: 'analytics-export' },
  { type: 'automation', name: 'Nightly patient sync' },
  { type: 'automation', name: 'SLA escalation' },
  { type: 'scheduled_export', name: 'Monday compliance export' },
  { type: 'scheduled_export', name: 'Monthly finance export' },
  { type: 'webhook', name: 'Incident webhook' }
].map((r, i) => ({ id: `r-${i + 1}`, workspaceKey: WORKSPACE.workspaceKey, ...r }));

export function freshStore() {
  return {
    workspace: { ...WORKSPACE },
    resources: BASE_RESOURCES.map(r => ({ ...r })),
    simulations: {},
    snapshots: {},
    audits: []
  };
}

export function countResources(resources) {
  const counts = { members: 0, api_keys: 0, automations: 0, scheduled_exports: 0, webhooks: 0 };
  for (const item of resources) {
    if (item.type === 'member') counts.members += 1;
    if (item.type === 'api_key') counts.api_keys += 1;
    if (item.type === 'automation') counts.automations += 1;
    if (item.type === 'scheduled_export') counts.scheduled_exports += 1;
    if (item.type === 'webhook') counts.webhooks += 1;
  }
  return counts;
}

export function fingerprint(store) {
  const payload = JSON.stringify({
    workspace: store.workspace && { key: store.workspace.workspaceKey, status: store.workspace.status },
    resources: store.resources
      .map(r => [r.id, r.type, r.criticalGuard === true])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  });
  return `fp_${crypto.createHash('sha256').update(payload).digest('hex').slice(0, 10)}`;
}

export function injectFailureDependency(store) {
  if (!store.resources.some(r => r.type === 'legal_hold')) {
    store.resources.push({
      id: 'r-hidden-hold',
      workspaceKey: WORKSPACE.workspaceKey,
      type: 'legal_hold',
      name: 'Regulatory retention hold',
      criticalGuard: true
    });
  }
  return store;
}

export function simulate(store, { preserveExports = false, failureMode = false } = {}) {
  if (!store.workspace) throw new Error('workspace_deleted');

  if (failureMode) injectFailureDependency(store);

  // Deliberate blind spot: the simulator understands only modeled dependency types.
  // This makes the failure test real: legal_hold exists in live state but is omitted here.
  const modeled = store.resources.filter(r => r.type !== 'legal_hold');
  const deleted = modeled.filter(r => !(preserveExports && r.type === 'scheduled_export'));
  const preserved = modeled.filter(r => preserveExports && r.type === 'scheduled_export');

  return {
    preserveExports,
    failureMode,
    risk: preserveExports ? 'MEDIUM' : 'HIGH',
    effects: countResources(deleted),
    preserved: countResources(preserved),
    sideEffects: [
      `${countResources(deleted).members} member sessions lose access immediately.`,
      `${countResources(deleted).api_keys} API keys become unusable.`,
      `${countResources(deleted).automations} automations stop running.`,
      `${countResources(deleted).webhooks} webhook destination stops receiving events.`
    ],
    rollback: 'Restore the pre-write workspace and every deleted dependency from the persisted snapshot.',
    fingerprint: fingerprint(store)
  };
}

export function preflight(store, simulation) {
  const current = fingerprint(store);
  if (current !== simulation.fingerprint) {
    return { ok: false, code: 'STATE_DRIFT', message: 'Live state changed after the simulation.' };
  }
  const critical = store.resources.filter(r => r.criticalGuard === true);
  if (critical.length) {
    return {
      ok: false,
      code: 'CRITICAL_DEPENDENCY',
      message: 'Authoritative preflight found an unmodeled compliance hold.'
    };
  }
  return { ok: true };
}

export function executeDelete(store, simulation) {
  const gate = preflight(store, simulation);
  if (!gate.ok) return { blocked: true, gate };
  if (!store.workspace) return { blocked: true, gate: { code: 'ALREADY_DELETED', message: 'Workspace already deleted.' } };

  const deletedResources = store.resources.filter(r => !(simulation.preserveExports && r.type === 'scheduled_export'));
  const preservedResources = store.resources.filter(r => simulation.preserveExports && r.type === 'scheduled_export');
  const snapshotId = crypto.randomUUID();
  store.snapshots[snapshotId] = {
    workspace: { ...store.workspace },
    resources: deletedResources.map(r => ({ ...r })),
    createdAt: new Date().toISOString()
  };
  store.workspace = null;
  store.resources = preservedResources;
  return { blocked: false, snapshotId };
}

export function rollback(store, snapshotId) {
  const snapshot = store.snapshots[snapshotId];
  if (!snapshot) throw new Error('snapshot_not_found');
  if (store.workspace) throw new Error('workspace_present');
  store.workspace = { ...snapshot.workspace };
  const existingIds = new Set(store.resources.map(r => r.id));
  store.resources.push(...snapshot.resources.filter(r => !existingIds.has(r.id)).map(r => ({ ...r })));
  return store;
}
