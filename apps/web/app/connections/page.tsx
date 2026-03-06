'use client';

import { FormEvent, useEffect, useState } from 'react';

type ToolType = 'JIRA_ZEPHYR' | 'AZURE_DEVOPS' | 'QTEST' | 'DEMO';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export default function ConnectionsPage() {
  const [form, setForm] = useState({
    name: 'Client Connection',
    toolType: 'JIRA_ZEPHYR' as ToolType,
    baseUrl: '',
    secondaryBaseUrl: 'https://prod-api.zephyr4jiracloud.com',
    authType: 'API_TOKEN',
    username: '',
    secret: '',
    metadataJson: '{}'
  });
  const [saved, setSaved] = useState<any[]>([]);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadConnections = async () => {
    const res = await fetch(`${API_BASE}/connections`);
    const data = await res.json();
    setSaved(data.data ?? []);
  };

  useEffect(() => { void loadConnections(); }, []);

  const validate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');
    try {
      const res = await fetch(`${API_BASE}/connections/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          secondaryBaseUrl: form.secondaryBaseUrl || undefined,
          username: form.toolType === 'JIRA_ZEPHYR' ? form.username : undefined,
          metadataJson: form.metadataJson ? JSON.parse(form.metadataJson) : undefined
        })
      });
      const data = await res.json();
      setResult(data.data?.message ?? 'Validation completed.');
    } catch {
      setResult('Validation failed due to network or server error.');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          secondaryBaseUrl: form.secondaryBaseUrl || undefined,
          username: form.toolType === 'JIRA_ZEPHYR' ? form.username : undefined,
          metadataJson: form.metadataJson ? JSON.parse(form.metadataJson) : undefined
        })
      });
      const data = await res.json();
      if (data.data?.id) setResult(`Saved connection ${data.data.id}`);
      await loadConnections();
    } catch {
      setResult('Save failed due to network or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Create Client Connection</h2>
      <form onSubmit={validate} className="bg-white rounded-xl shadow p-4 grid grid-cols-2 gap-3">
        <input className="border rounded px-3 py-2" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Connection name" />
        <select className="border rounded px-3 py-2" value={form.toolType} onChange={(e) => setForm((s) => ({ ...s, toolType: e.target.value as ToolType }))}>
          <option value="JIRA_ZEPHYR">Jira + Zephyr</option>
          <option value="AZURE_DEVOPS">Azure DevOps</option>
          <option value="QTEST">qTest</option>
          <option value="DEMO">Demo</option>
        </select>
        <input className="border rounded px-3 py-2" value={form.baseUrl} onChange={(e) => setForm((s) => ({ ...s, baseUrl: e.target.value }))} placeholder="Base URL" />
        <input className="border rounded px-3 py-2" value={form.secondaryBaseUrl} onChange={(e) => setForm((s) => ({ ...s, secondaryBaseUrl: e.target.value }))} placeholder="Secondary URL (Zephyr: prod-api.zephyr4jiracloud.com)" />
        <select className="border rounded px-3 py-2" value={form.authType} onChange={(e) => setForm((s) => ({ ...s, authType: e.target.value }))}><option>API_TOKEN</option><option>BASIC</option><option>BEARER</option></select>
        <input className="border rounded px-3 py-2" value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} placeholder="Username / Email (Jira only)" disabled={form.toolType !== 'JIRA_ZEPHYR'} />
        <input className="border rounded px-3 py-2 col-span-2" type="password" value={form.secret} onChange={(e) => setForm((s) => ({ ...s, secret: e.target.value }))} placeholder="Secret / Token (Zephyr uses bearer token only)" />
        <textarea className="border rounded px-3 py-2 col-span-2" rows={2} value={form.metadataJson} onChange={(e) => setForm((s) => ({ ...s, metadataJson: e.target.value }))} placeholder='Optional metadata JSON, e.g. {"projectKey":"TEST"}' />
        <div className="col-span-2 flex gap-2">
          <button disabled={loading} type="submit" className="px-3 py-2 rounded bg-slate-200">{loading ? 'Validating...' : 'Validate Connection'}</button>
          <button disabled={loading} type="button" onClick={save} className="px-3 py-2 rounded bg-slate-900 text-white">{loading ? 'Saving...' : 'Save Connection'}</button>
        </div>
      </form>
      {result ? <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded p-3 text-sm">{result}</div> : null}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-2">Saved Connections</h3>
        <ul className="text-sm space-y-1">
          {saved.map((c) => <li key={c.id}>{c.name} • {c.toolType} • {c.status} • {c.maskedSecretPreview ?? '****'}</li>)}
        </ul>
      </div>
    </div>
  );
}
