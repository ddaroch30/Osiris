'use client';

import { useEffect, useMemo, useState } from 'react';

type SavedConnection = {
  id: string;
  name: string;
  toolType: string;
};

type ProjectRow = {
  id: string;
  key: string;
  name: string;
  sourceType: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export default function ProjectsPage() {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const jiraConnections = useMemo(() => connections.filter((c) => c.toolType === 'JIRA'), [connections]);

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const res = await fetch(`${API_BASE}/connections`);
        const json = await res.json();
        const rows = (json?.data ?? []) as SavedConnection[];
        setConnections(rows);

        const firstJira = rows.find((c) => c.toolType === 'JIRA');
        if (firstJira) {
          setSelectedConnectionId(firstJira.id);
        }
      } catch {
        setMessage('Failed to load saved connections.');
      }
    };

    void loadConnections();
  }, []);

  const loadProjects = async () => {
    if (!selectedConnectionId) {
      setMessage('Select a Jira connection first.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/connections/${selectedConnectionId}/projects`);
      const json = await res.json();
      const rows = (json?.data ?? []) as ProjectRow[];
      setProjects(rows);
      setMessage(rows.length ? `Loaded ${rows.length} Jira project(s).` : 'No Jira projects returned for this connection.');
    } catch {
      setMessage('Failed to pull projects from Jira.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedConnection = jiraConnections.find((c) => c.id === selectedConnectionId);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Projects Explorer</h2>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h3 className="font-semibold">Pull Jira Projects</h3>
        <p className="text-sm text-slate-600">Choose a saved Jira connection and pull projects from Jira.</p>
        <div className="flex gap-3 items-center">
          <select
            className="border rounded-xl px-4 py-2 min-w-80"
            value={selectedConnectionId}
            onChange={(e) => setSelectedConnectionId(e.target.value)}
            disabled={!jiraConnections.length}
          >
            <option value="">Select Jira connection</option>
            {jiraConnections.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {connection.name}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 rounded-xl bg-blue-800 text-white disabled:bg-slate-400" onClick={loadProjects} disabled={loading || !selectedConnectionId}>
            {loading ? 'Pulling...' : 'Pull Projects'}
          </button>
        </div>
        {!jiraConnections.length ? <p className="text-sm text-amber-700">No Jira connections found. Create and validate a Jira connection first.</p> : null}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Project Key</th>
              <th className="text-left">Name</th>
              <th className="text-left">Source</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-t">
                <td className="p-2">{project.key}</td>
                <td>{project.name}</td>
                <td>{project.sourceType}</td>
              </tr>
            ))}
            {!projects.length ? (
              <tr className="border-t">
                <td className="p-3 text-slate-500" colSpan={3}>
                  {selectedConnection ? 'No projects loaded yet. Click Pull Projects.' : 'Select a Jira connection to start.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
