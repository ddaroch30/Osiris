'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

type Workspace = {
  id: string;
  name: string;
  projectKey: string;
  planningContextType: string;
  planningContextName: string;
  status: string;
  lastSyncedAt?: string | null;
};

type Requirement = { externalKey: string; title: string; status?: string; priority?: string };

export default function WorkspaceDetailPage({ params }: { params: { id: string } }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [tab, setTab] = useState<'overview' | 'requirements' | 'design' | 'push'>('overview');

  const load = async () => {
    const [wRes, rRes] = await Promise.all([
      fetch(`${API_BASE}/workspaces/${params.id}`),
      fetch(`${API_BASE}/workspaces/${params.id}/requirements`)
    ]);
    const wJson = await wRes.json();
    const rJson = await rRes.json();
    setWorkspace(wJson?.data ?? null);
    setRequirements(rJson?.data ?? []);
  };

  useEffect(() => { void load(); }, [params.id]);

  const onRefresh = async () => {
    await fetch(`${API_BASE}/workspaces/${params.id}/sync-requirements`, { method: 'POST' });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{workspace?.name ?? 'Workspace'}</h2>
          <p className="text-sm text-slate-600">Project: {workspace?.projectKey} • Context: {workspace?.planningContextType} / {workspace?.planningContextName} • Last Synced: {workspace?.lastSyncedAt ? new Date(workspace.lastSyncedAt).toLocaleString() : '-'}</p>
        </div>
        <button className="px-3 py-2 rounded bg-slate-900 text-white" onClick={() => void onRefresh()}>Refresh</button>
      </div>

      <div className="flex gap-2">
        <button className={`px-3 py-2 rounded ${tab === 'overview' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`px-3 py-2 rounded ${tab === 'requirements' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`} onClick={() => setTab('requirements')}>Requirements</button>
        <button className={`px-3 py-2 rounded ${tab === 'design' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`} onClick={() => setTab('design')}>Test Design</button>
        <button className={`px-3 py-2 rounded ${tab === 'push' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`} onClick={() => setTab('push')}>Push History</button>
      </div>

      {tab === 'overview' ? <div className="bg-white rounded-xl shadow p-4 text-sm">Status: {workspace?.status ?? '-'}</div> : null}
      {tab === 'requirements' ? (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100"><tr><th className="p-2 text-left">Select</th><th>Key</th><th>Title</th><th>Status</th><th>Priority</th></tr></thead>
            <tbody>
              {requirements.map((r) => <tr key={r.externalKey} className="border-t"><td className="p-2"><input type="checkbox" /></td><td>{r.externalKey}</td><td>{r.title}</td><td>{r.status ?? '-'}</td><td>{r.priority ?? '-'}</td></tr>)}
              {!requirements.length ? <tr className="border-t"><td className="p-3 text-slate-500" colSpan={5}>No synced requirements yet. Click Refresh.</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : null}
      {tab === 'design' ? <div className="bg-white rounded-xl shadow p-4 text-sm">Generate/edit/finalize test cases from synced requirements in this workspace.</div> : null}
      {tab === 'push' ? <div className="bg-white rounded-xl shadow p-4 text-sm">Push execution history for this workspace appears here.</div> : null}
    </div>
  );
}
