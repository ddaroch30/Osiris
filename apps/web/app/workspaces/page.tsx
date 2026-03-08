'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

type Connection = { id: string; name: string; toolType: string };
type Workspace = {
  id: string;
  name: string;
  jiraConnectionId: string;
  targetConnectionId: string;
  projectKey: string;
  planningContextType: 'SPRINT' | 'RELEASE' | 'BACKLOG';
  planningContextName: string;
  status: string;
  lastSyncedAt?: string | null;
};

export default function WorkspacesPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', jiraConnectionId: '', targetConnectionId: '', projectKey: '' });

  const jiraConnections = useMemo(() => connections.filter((c) => c.toolType === 'JIRA'), [connections]);
  const targetConnections = useMemo(() => connections.filter((c) => c.toolType !== 'JIRA'), [connections]);

  const load = async () => {
    const [cRes, wRes] = await Promise.all([fetch(`${API_BASE}/connections`), fetch(`${API_BASE}/workspaces`)]);
    const cJson = await cRes.json();
    const wJson = await wRes.json();
    setConnections(cJson?.data ?? []);
    setWorkspaces(wJson?.data ?? []);
  };

  useEffect(() => { void load(); }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    const res = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const json = await res.json();
    if (res.ok) {
      setMessage(`Workspace created: ${json.data.name}`);
      setForm({ name: '', jiraConnectionId: '', targetConnectionId: '', projectKey: '' });
      await load();
    } else {
      setMessage(json?.error?.message ?? 'Failed to create workspace');
    }
  };

  const onSync = async (workspaceId: string) => {
    setMessage('');
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/sync-requirements`, { method: 'POST' });
    const json = await res.json();
    if (res.ok) {
      setMessage(`Synced ${json?.data?.syncedCount ?? 0} requirements.`);
      await load();
    } else {
      setMessage(json?.error?.message ?? 'Sync failed');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Workspaces</h2>

      <form onSubmit={onCreate} className="bg-white rounded-xl shadow p-4 space-y-3">
        <h3 className="font-semibold">Create Workspace</h3>
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Workspace name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <input className="border rounded px-3 py-2" placeholder="Jira project key (e.g. PAY)" value={form.projectKey} onChange={(e) => setForm((s) => ({ ...s, projectKey: e.target.value }))} />
          <select className="border rounded px-3 py-2" value={form.jiraConnectionId} onChange={(e) => setForm((s) => ({ ...s, jiraConnectionId: e.target.value }))}>
            <option value="">Select Jira connection</option>
            {jiraConnections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border rounded px-3 py-2" value={form.targetConnectionId} onChange={(e) => setForm((s) => ({ ...s, targetConnectionId: e.target.value }))}>
            <option value="">Select target connection</option>
            {targetConnections.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.toolType})</option>)}
          </select>
        </div>
        <button className="px-4 py-2 rounded bg-blue-800 text-white">Create Workspace</button>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="p-2 text-left">Name</th><th>Project</th><th>Context</th><th>Status</th><th>Last Synced</th><th /></tr></thead>
          <tbody>
            {workspaces.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="p-2"><a className="text-blue-700 underline" href={`/workspaces/${w.id}`}>{w.name}</a></td>
                <td>{w.projectKey}</td>
                <td>{w.planningContextType} • {w.planningContextName}</td>
                <td>{w.status}</td>
                <td>{w.lastSyncedAt ? new Date(w.lastSyncedAt).toLocaleString() : '-'}</td>
                <td><button className="px-2 py-1 rounded bg-slate-900 text-white" onClick={() => void onSync(w.id)}>Sync Requirements</button></td>
              </tr>
            ))}
            {!workspaces.length ? <tr className="border-t"><td className="p-3 text-slate-500" colSpan={6}>No workspaces yet.</td></tr> : null}
          </tbody>
        </table>
      </div>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
