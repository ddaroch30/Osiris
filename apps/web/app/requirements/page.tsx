'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

type Workspace = { id: string; name: string; projectKey: string; planningContextName: string };
type Requirement = { externalId: string; externalKey: string; title: string; status?: string; priority?: string; syncedAt?: string };

export default function RequirementsPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [message, setMessage] = useState('');

  const loadWorkspaces = async () => {
    const res = await fetch(`${API_BASE}/workspaces`);
    const json = await res.json();
    const rows = (json?.data ?? []) as Workspace[];
    setWorkspaces(rows);
    if (rows.length && !workspaceId) setWorkspaceId(rows[0].id);
  };

  const loadRequirements = async (id: string) => {
    if (!id) return;
    const res = await fetch(`${API_BASE}/workspaces/${id}/requirements`);
    const json = await res.json();
    setRequirements(json?.data ?? []);
  };

  useEffect(() => { void loadWorkspaces(); }, []);
  useEffect(() => { if (workspaceId) void loadRequirements(workspaceId); }, [workspaceId]);

  const refresh = async () => {
    if (!workspaceId) return;
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/sync-requirements`, { method: 'POST' });
    const json = await res.json();
    if (res.ok) {
      setMessage(`Synced ${json?.data?.syncedCount ?? 0} requirements.`);
      await loadRequirements(workspaceId);
      return;
    }

    setMessage(json?.error?.message ?? 'Sync failed');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Requirements</h2>
      <div className="bg-white rounded-xl shadow p-4 flex gap-3 items-center">
        <select className="border rounded px-3 py-2 min-w-80" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)}>
          <option value="">Select workspace</option>
          {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name} • {w.projectKey} • {w.planningContextName}</option>)}
        </select>
        <button className="px-3 py-2 rounded bg-slate-900 text-white" onClick={() => void refresh()} disabled={!workspaceId}>Manual Refresh from Jira</button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="p-2 text-left">Select</th><th>Key</th><th>Title</th><th>Status</th><th>Priority</th><th>Synced</th></tr></thead>
          <tbody>
            {requirements.map((r) => (
              <tr key={r.externalId} className="border-t">
                <td className="p-2"><input type="checkbox" /></td>
                <td>{r.externalKey}</td>
                <td>{r.title}</td>
                <td>{r.status ?? '-'}</td>
                <td>{r.priority ?? '-'}</td>
                <td>{r.syncedAt ? new Date(r.syncedAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
            {!requirements.length ? <tr className="border-t"><td className="p-3 text-slate-500" colSpan={6}>No persisted requirements yet for this workspace.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
