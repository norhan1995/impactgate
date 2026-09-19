import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, Check, ChevronRight, CircleStop,
  Database, FileClock, FlaskConical, KeyRound, RotateCcw, ShieldCheck,
  Sparkles, Trash2, Users, Webhook, Workflow, X
} from 'lucide-react';

type Counts = { members: number; api_keys: number; automations: number; scheduled_exports: number; webhooks: number };
type Workspace = { workspaceKey: string; name: string; plan: string; status: string };
type AppState = { workspace: Workspace | null; counts: Counts; preservedExports: number; audits: Array<{ id: string; kind: string; message: string; createdAt: string }> };
type Simulation = { simulationId: string; workspaceName: string; preserveExports: boolean; failureMode: boolean; risk: string; effects: Counts; preserved: Counts; sideEffects: string[]; rollback: string; fingerprint: string };
type Result = { kind: 'executed'; snapshotId: string; message: string } | { kind: 'blocked'; message: string; safetyNet: string } | { kind: 'rejected'; message: string };
const emptyCounts: Counts = { members: 0, api_keys: 0, automations: 0, scheduled_exports: 0, webhooks: 0 };

async function request(path: string, options?: RequestInit) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function Metric({ icon, label, before, after }: { icon: React.ReactNode; label: string; before: number; after: number }) {
  const changed = before !== after;
  return <div className="metric-row"><div className="metric-label">{icon}<span>{label}</span></div><div className="metric-diff"><span className="before">{before}</span><ArrowRight size={14}/><span className={changed ? 'after danger' : 'after safe'}>{after}</span></div></div>;
}
function StepPill({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return <div className={'step-pill ' + (active ? 'active ' : '') + (done ? 'done' : '')}><span className="step-dot">{done ? <Check size={13}/> : n}</span><span>{label}</span></div>;
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [failureMode, setFailureMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [intent, setIntent] = useState('Delete the Northstar Health workspace and revoke everything attached to it.');

  async function refresh() { setState(await request('/api/state')); }
  useEffect(() => { refresh().catch(() => setError('Could not load the demo system.')); }, []);

  async function simulateAction(preserveExports = false) {
    setBusy(true); setError(''); setResult(null);
    try {
      const data = await request('/api/simulate', { method: 'POST', body: JSON.stringify({ preserveExports, failureMode, intent }) });
      setSimulation(data); await refresh();
    } catch { setError('Simulation failed. Reset the demo and try again.'); }
    finally { setBusy(false); }
  }
  async function reject() {
    if (!simulation) return; setBusy(true);
    try { await request('/api/reject', { method: 'POST', body: JSON.stringify({ simulationId: simulation.simulationId }) }); setResult({ kind: 'rejected', message: 'Rejected. No write was executed.' }); setSimulation(null); await refresh(); }
    finally { setBusy(false); }
  }
  async function execute() {
    if (!simulation) return; setBusy(true); setError('');
    try {
      const data = await request('/api/execute', { method: 'POST', body: JSON.stringify({ simulationId: simulation.simulationId }) });
      if (data.blocked) setResult({ kind: 'blocked', message: data.message, safetyNet: data.safetyNet });
      else setResult({ kind: 'executed', snapshotId: data.snapshotId, message: data.message });
      await refresh();
    } catch { setError('Execution failed safely. No destructive write was confirmed.'); }
    finally { setBusy(false); }
  }
  async function doRollback() {
    if (!result || result.kind !== 'executed') return; setBusy(true);
    try { await request('/api/rollback', { method: 'POST', body: JSON.stringify({ snapshotId: result.snapshotId }) }); setSimulation(null); setResult(null); await refresh(); }
    finally { setBusy(false); }
  }
  async function reset() {
    setBusy(true); await request('/api/reset', { method: 'POST', body: '{}' }); setSimulation(null); setResult(null); setFailureMode(false); setError(''); await refresh(); setBusy(false);
  }

  const stage = result ? 3 : simulation ? 2 : 1;
  const before = state?.counts || emptyCounts;
  const after = useMemo(() => simulation ? {
    members: Math.max(0, before.members - simulation.effects.members),
    api_keys: Math.max(0, before.api_keys - simulation.effects.api_keys),
    automations: Math.max(0, before.automations - simulation.effects.automations),
    scheduled_exports: Math.max(0, before.scheduled_exports - simulation.effects.scheduled_exports),
    webhooks: Math.max(0, before.webhooks - simulation.effects.webhooks)
  } : before, [before, simulation]);

  return <div className="shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><ShieldCheck size={20}/></div><div><div className="brand-name">ImpactGate</div><div className="brand-sub">simulation-gated agents</div></div></div><div className="top-actions"><div className="live-pill"><span></span> REAL PERSISTED STATE</div><button className="ghost-button" onClick={reset} disabled={busy}><RotateCcw size={15}/> Reset demo</button></div></header>
    <main>
      <section className="hero"><div className="eyebrow"><Sparkles size={14}/> SIMULATE BEFORE YOU ACT</div><h1>See the blast radius <span>before</span> the write.</h1><p>ImpactGate turns a destructive agent action into a reviewable transaction: simulate, inspect effects, approve or change scope, then execute with an independent safety net.</p></section>
      <div className="stepper"><StepPill n={1} label="Intent" active={stage===1} done={stage>1}/><ChevronRight size={16}/><StepPill n={2} label="Simulation" active={stage===2} done={stage>2}/><ChevronRight size={16}/><StepPill n={3} label="Commit / rollback" active={stage===3} done={false}/></div>
      {error && <div className="error-banner"><AlertTriangle size={17}/>{error}</div>}
      <div className="workspace-grid">
        <section className="main-panel">
          {stage===1 && <div className="card intent-card">
            <div className="card-head"><div><div className="kicker">AGENT INTENT</div><h2>Destructive workspace deletion</h2></div><div className="risk-badge"><AlertTriangle size={14}/> HIGH STAKES</div></div>
            <label className="input-label">Requested action</label><textarea value={intent} onChange={e=>setIntent(e.target.value)}/>
            <div className="target"><div className="target-icon"><Database size={20}/></div><div><strong>{state?.workspace?.name || 'Workspace deleted'}</strong><span>Production customer workspace · persisted database</span></div></div>
            <div className="failure-lab"><div><div className="failure-title"><FlaskConical size={16}/> Failure lab</div><p>Inject an unmodeled compliance hold. The simulator will miss it; the execution guard must catch it.</p></div><button className={'toggle '+(failureMode?'on':'')} onClick={()=>setFailureMode(v=>!v)} aria-label="Toggle failure lab"><span></span></button></div>
            <button className="primary-button" onClick={()=>simulateAction(false)} disabled={busy || !state?.workspace}><Activity size={17}/>{busy?'Simulating…':'Run simulation'}<ArrowRight size={17}/></button>
          </div>}
          {stage===2 && simulation && <div className="card simulation-card">
            <div className="card-head"><div><div className="kicker">SIMULATION COMPLETE</div><h2>Projected transaction</h2></div><div className={'risk-score '+(simulation.failureMode?'warn':'')}>{simulation.failureMode?'MODEL CONFIDENCE GAP':simulation.risk+' RISK'}</div></div>
            <div className="diff-box"><div className="diff-header"><span>BEFORE</span><span>PROJECTED AFTER</span></div><Metric icon={<Users size={16}/>} label="Member access" before={before.members} after={after.members}/><Metric icon={<KeyRound size={16}/>} label="API keys" before={before.api_keys} after={after.api_keys}/><Metric icon={<Workflow size={16}/>} label="Automations" before={before.automations} after={after.automations}/><Metric icon={<FileClock size={16}/>} label="Scheduled exports" before={before.scheduled_exports} after={after.scheduled_exports}/><Metric icon={<Webhook size={16}/>} label="Webhooks" before={before.webhooks} after={after.webhooks}/></div>
            <div className="impact-grid"><div className="impact-card"><div className="impact-title"><AlertTriangle size={16}/> Side effects</div>{simulation.sideEffects.map((item,i)=><div className="side-effect" key={i}><span>0{i+1}</span>{item}</div>)}</div><div className="impact-card rollback-card"><div className="impact-title"><RotateCcw size={16}/> Rollback path</div><p>{simulation.rollback}</p><div className="snapshot-line"><ShieldCheck size={15}/> Snapshot is created atomically before deletion.</div></div></div>
            {simulation.preserveExports && <div className="tweak-banner"><Check size={16}/><strong>Scope changed:</strong> scheduled exports will be preserved.</div>}
            {simulation.failureMode && <div className="warning-banner"><FlaskConical size={16}/> Deliberate failure test: this preview does <strong>not</strong> show every dependency present in the live system.</div>}
            <div className="decision-row"><button className="reject-button" onClick={reject} disabled={busy}><X size={16}/> Reject</button><button className="tweak-button" onClick={()=>simulateAction(true)} disabled={busy || simulation.preserveExports}><Workflow size={16}/>{simulation.preserveExports?'Exports preserved':'Tweak: preserve exports'}</button><button className="execute-button" onClick={execute} disabled={busy}><Trash2 size={16}/>{busy?'Checking preflight…':'Approve & execute'}</button></div>
            <div className="fingerprint">Simulation fingerprint · {simulation.fingerprint}</div>
          </div>}
          {stage===3 && result && <div className={'card result-card '+result.kind}>
            {result.kind==='executed' && <><div className="result-icon success"><Check size={28}/></div><div className="kicker">COMMIT COMPLETE</div><h2>Write executed against live state.</h2><p>{result.message}</p><div className="result-actions"><button className="primary-button" onClick={doRollback} disabled={busy}><RotateCcw size={17}/>{busy?'Restoring…':'Rollback deletion'}</button><button className="ghost-button" onClick={reset}>Start over</button></div></>}
            {result.kind==='blocked' && <><div className="result-icon blocked"><CircleStop size={28}/></div><div className="kicker">SAFETY NET TRIGGERED</div><h2>Simulation was wrong. The write was blocked.</h2><p>{result.message}</p><div className="safety-proof"><ShieldCheck size={18}/><div><strong>{result.safetyNet}</strong><span>The guard re-read live dependencies immediately before commit and refused the stale/incomplete plan.</span></div></div><button className="primary-button" onClick={reset}><RotateCcw size={17}/> Reset failure lab</button></>}
            {result.kind==='rejected' && <><div className="result-icon neutral"><X size={28}/></div><div className="kicker">NO WRITE</div><h2>Human rejected the action.</h2><p>{result.message}</p><button className="primary-button" onClick={reset}><RotateCcw size={17}/> Start over</button></>}
          </div>}
        </section>
        <aside className="side-panel"><div className="state-card"><div className="aside-title"><Database size={16}/> Live system state</div><div className={'workspace-status '+(state?.workspace?'active':'deleted')}><span></span>{state?.workspace?'WORKSPACE ACTIVE':'WORKSPACE DELETED'}</div><h3>{state?.workspace?.name || 'Northstar Health'}</h3><p>{state?.workspace?'Production-like demo data persisted on the backend.':'The destructive write has been committed.'}</p><div className="mini-stats"><div><strong>{before.members}</strong><span>members</span></div><div><strong>{before.api_keys}</strong><span>API keys</span></div><div><strong>{before.automations}</strong><span>rules</span></div><div><strong>{before.scheduled_exports}</strong><span>exports</span></div></div></div>
          <div className="audit-card"><div className="aside-title"><ShieldCheck size={16}/> Audit trail</div>{state?.audits?.length?state.audits.slice(-4).reverse().map(a=><div className="audit-row" key={a.id}><div className={'audit-dot '+a.kind}></div><div><strong>{a.kind.replace('_',' ')}</strong><span>{a.message}</span></div></div>):<div className="empty-audit">No writes yet. Every decision will appear here.</div>}</div>
          <div className="architecture-card"><div className="aside-title">ARCHITECTURE</div><div className="arch-flow"><span>Intent</span><ArrowRight size={12}/><span>Simulate</span><ArrowRight size={12}/><span>Present</span></div><div className="arch-flow second"><span>Preflight</span><ArrowRight size={12}/><span>Execute</span><ArrowRight size={12}/><span>Rollback</span></div></div>
        </aside>
      </div>
    </main><footer><ShieldCheck size={14}/> ImpactGate · simulation is advisory; execution guards are authoritative.</footer>
  </div>;
}
