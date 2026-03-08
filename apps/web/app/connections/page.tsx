'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type ToolType = '' | 'JIRA' | 'ZEPHYR_ESSENTIAL' | 'AZURE_DEVOPS' | 'QTEST' | 'DEMO';
type ResultKind = 'success' | 'error' | 'info';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

const endpointPathHint = (url: string) => {
  const lower = url.trim().toLowerCase().replace(/\/+$/, '');
  return ['/projects', '/issues', '/testcases', '/testcase', '/search'].some((p) => lower.endsWith(p));
};

export default function ConnectionsPage() {
  const [form, setForm] = useState({
    name: '',
    toolType: '' as ToolType,
    authType: '',
    baseUrl: '',
    secondaryBaseUrl: '',
    username: '',
    secret: '',
    defaultProjectKey: ''
  });
  const [saved, setSaved] = useState<any[]>([]);
  const [result, setResult] = useState('');
  const [resultKind, setResultKind] = useState<ResultKind>('info');
  const [loading, setLoading] = useState(false);
  const [workflowName, setWorkflowName] = useState('Jira to Zephyr Essential Flow');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');

  const isZephyrEssential = form.toolType === 'ZEPHYR_ESSENTIAL';
  const isJira = form.toolType === 'JIRA';

  const title = useMemo(() => {
    if (isZephyrEssential) return 'ZEPHYR ESSENTIAL CONFIGURATION';
    if (isJira) return 'JIRA CONFIGURATION';
    return 'CONNECTION CONFIGURATION';
  }, [isJira, isZephyrEssential]);

  const resultClass = resultKind === 'success' ? 'text-emerald-700' : resultKind === 'error' ? 'text-rose-700' : 'text-slate-700';

  const loadConnections = async () => {
    const res = await fetch(`${API_BASE}/connections`);
    const json = await res.json();
    setSaved(json.data ?? []);
  };

  useEffect(() => { void loadConnections(); }, []);

  const validateBasicForm = () => {
    if (!form.name || !form.toolType || !form.authType || !form.baseUrl || !form.secret) {
      setResultKind('error');
      setResult('Please complete all required fields before validating or saving.');
      return false;
    }
    if (endpointPathHint(form.baseUrl)) {
      setResultKind('error');
      setResult('This field expects a base URL, not a specific endpoint path.');
      return false;
    }
    if (isJira && !form.username) {
      setResultKind('error');
      setResult('Jira requires Email / Username.');
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    name: form.name,
    toolType: form.toolType,
    authType: form.authType,
    baseUrl: form.baseUrl,
    secondaryBaseUrl: form.secondaryBaseUrl || undefined,
    username: isZephyrEssential ? undefined : form.username || undefined,
    secret: form.secret,
    metadataJson: form.defaultProjectKey ? { defaultProjectKey: form.defaultProjectKey } : undefined
  });

  const callValidate = async () => {
    const res = await fetch(`${API_BASE}/connections/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload())
    });
    const json = await res.json();
    const success = Boolean(json?.data?.success);
    return { success, message: json?.data?.message ?? (success ? 'Validation successful.' : 'Validation failed.') };
  };

  const onValidate = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateBasicForm()) return;
    setLoading(true);
    try {
      const out = await callValidate();
      setResultKind(out.success ? 'success' : 'error');
      setResult(out.message);
    } catch {
      setResultKind('error');
      setResult('Validation failed due to network/server error.');
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!validateBasicForm()) return;
    setLoading(true);
    try {
      const validation = await callValidate();
      if (!validation.success) {
        setResultKind('error');
        setResult(`Save blocked: ${validation.message}`);
        return;
      }

      const res = await fetch(`${API_BASE}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload())
      });
      const json = await res.json();
      if (res.ok && json?.data?.id) {
        setResultKind('success');
        setResult(`Saved configuration ${json.data.id}`);
        await loadConnections();
      } else {
        setResultKind('error');
        setResult(json?.error?.message ?? 'Save failed.');
      }
    } catch {
      setResultKind('error');
      setResult('Save failed due to network/server error.');
    } finally {
      setLoading(false);
    }
  };

  const saveWorkflowConfig = async () => {
    if (!workflowName || !sourceId || !targetId) {
      setResultKind('error');
      setResult('Select a Jira source and Zephyr Essential target before saving workflow config.');
      return;
    }
    const res = await fetch(`${API_BASE}/connections/workflow-configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: workflowName, requirementsSourceConnectionId: sourceId, testManagementTargetConnectionId: targetId })
    });
    const json = await res.json();
    if (res.ok) {
      setResultKind('success');
      setResult(`Workflow config saved: ${json.data.id}`);
    } else {
      setResultKind('error');
      setResult(json?.error?.message ?? 'Failed to save workflow config.');
    }
  };

  const jiraConnections = saved.filter((c) => c.toolType === 'JIRA');
  const zephyrEssentialConnections = saved.filter((c) => c.toolType === 'ZEPHYR_ESSENTIAL');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-4xl font-bold mb-6">Primary Tool Selection</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm">Tool Type</label>
            <select value={form.toolType} onChange={(e) => setForm((s) => ({ ...s, toolType: e.target.value as ToolType, authType: e.target.value === 'ZEPHYR_ESSENTIAL' ? 'BEARER' : '' }))} className="w-full border rounded-xl px-4 py-3">
              <option value="">Select tool type</option>
              <option value="JIRA">Jira</option>
              <option value="ZEPHYR_ESSENTIAL">Zephyr Essential</option>
              <option value="AZURE_DEVOPS">Azure DevOps</option>
              <option value="QTEST">qTest</option>
              <option value="DEMO">Demo</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm">Authentication Type</label>
            <select value={form.authType} disabled={!form.toolType || isZephyrEssential} onChange={(e) => setForm((s) => ({ ...s, authType: e.target.value }))} className="w-full border rounded-xl px-4 py-3 disabled:bg-slate-100">
              <option value="">Select auth type</option>
              <option value="BEARER">BEARER</option>
              <option value="API_TOKEN">API_TOKEN</option>
              <option value="BASIC">BASIC</option>
            </select>
          </div>
        </div>
      </div>

      <form onSubmit={onValidate} className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h3 className="text-3xl font-bold">{title}</h3>
        <p className="text-sm text-slate-500">Enter the base API URL only. Do not include specific paths such as /projects.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm">Connection Name</label>
            <input className="w-full border rounded-xl px-4 py-3" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Enter connection name" />
          </div>
          <div>
            <label className="block mb-1 text-sm">{isZephyrEssential ? 'Zephyr Essential Base URL' : 'Base URL'}</label>
            <input className="w-full border rounded-xl px-4 py-3" value={form.baseUrl} onChange={(e) => setForm((s) => ({ ...s, baseUrl: e.target.value }))} placeholder={isZephyrEssential ? 'https://prod-api.zephyr4jiracloud.com' : 'https://your-domain.atlassian.net'} />
            {endpointPathHint(form.baseUrl) ? <p className="text-xs text-amber-700 mt-1">This field expects a base URL, not a specific endpoint path.</p> : null}
          </div>
          <div>
            <label className="block mb-1 text-sm">API Token</label>
            <input className="w-full border rounded-xl px-4 py-3" type="password" value={form.secret} onChange={(e) => setForm((s) => ({ ...s, secret: e.target.value }))} placeholder="Paste API token" />
          </div>

          {isJira ? (
            <div>
              <label className="block mb-1 text-sm">Jira Email / Username</label>
              <input className="w-full border rounded-xl px-4 py-3" value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} placeholder="qa.user@company.com" />
            </div>
          ) : null}

          {isZephyrEssential ? (
            <div>
              <label className="block mb-1 text-sm">Default Project Key (optional)</label>
              <input className="w-full border rounded-xl px-4 py-3" value={form.defaultProjectKey} onChange={(e) => setForm((s) => ({ ...s, defaultProjectKey: e.target.value }))} placeholder="KAN" />
            </div>
          ) : null}
        </div>

        <div className="flex gap-3">
          <button className="px-6 py-3 rounded-xl bg-slate-100" disabled={loading} type="submit">{loading ? 'Testing...' : 'Validate Connection'}</button>
          <button className="px-6 py-3 rounded-xl bg-blue-800 text-white" disabled={loading} type="button" onClick={onSave}>Save Configuration</button>
        </div>

        {result ? <p className={`${resultClass} text-xl`}>{result}</p> : null}
      </form>

      <div className="bg-white rounded-2xl shadow p-6 space-y-3">
        <h3 className="font-semibold">Workflow Mapping (Optional)</h3>
        <p className="text-sm text-slate-500">Link one Jira connection as requirements source and one Zephyr Essential connection as test target.</p>
        <input className="w-full border rounded-xl px-4 py-3" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} placeholder="Workflow config name" />
        <div className="grid grid-cols-2 gap-4">
          <select className="border rounded-xl px-4 py-3" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">Select Jira source connection</option>
            {jiraConnections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border rounded-xl px-4 py-3" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Select Zephyr Essential target</option>
            {zephyrEssentialConnections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button className="px-6 py-3 rounded-xl bg-indigo-700 text-white" onClick={saveWorkflowConfig}>Save Workflow Mapping</button>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="font-semibold mb-2">Saved Connections</h3>
        <div className="space-y-1 text-sm">
          {saved.map((c) => <div key={c.id}>{c.name} • {c.toolType} • {c.status} • {c.maskedSecretPreview ?? '****'}</div>)}
        </div>
      </div>
    </div>
  );
}
