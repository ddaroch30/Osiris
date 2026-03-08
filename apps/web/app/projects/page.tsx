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

type PlanningContext = {
  type: 'SPRINT' | 'RELEASE' | 'BACKLOG';
  id: string;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
};

type StoryRow = {
  id: string;
  key: string;
  title: string;
  status?: string;
  priority?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export default function ProjectsPage() {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectKey, setSelectedProjectKey] = useState('');
  const [planningContext, setPlanningContext] = useState<PlanningContext | null>(null);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
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

    setLoadingProjects(true);
    setMessage('');
    setSelectedProjectKey('');
    setPlanningContext(null);
    setStories([]);

    try {
      const res = await fetch(`${API_BASE}/connections/${selectedConnectionId}/projects`);
      const json = await res.json();
      const rows = (json?.data ?? []) as ProjectRow[];
      setProjects(rows);
      setMessage(rows.length ? `Loaded ${rows.length} Jira project(s). Click a project to auto-discover planning context.` : 'No Jira projects returned for this connection.');
    } catch {
      setMessage('Failed to pull projects from Jira.');
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadPlanningContextAndStories = async (projectKey: string) => {
    setSelectedProjectKey(projectKey);
    setPlanningContext(null);
    setStories([]);
    setLoadingContext(true);
    setMessage('');

    try {
      const contextRes = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectKey)}/planning-context?connectionId=${encodeURIComponent(selectedConnectionId)}`);
      const contextJson = await contextRes.json();
      const context = contextJson?.data as PlanningContext;

      if (!context?.type) {
        setMessage('Could not determine planning context for this project.');
        return;
      }

      setPlanningContext(context);

      const storiesRes = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectKey)}/stories?connectionId=${encodeURIComponent(selectedConnectionId)}&contextType=${encodeURIComponent(context.type)}&contextId=${encodeURIComponent(context.id)}`);
      const storiesJson = await storiesRes.json();
      const storyRows = (storiesJson?.data ?? []) as StoryRow[];
      setStories(storyRows);
      setMessage(`Using ${context.type} context (${context.name}). Loaded ${storyRows.length} stor${storyRows.length === 1 ? 'y' : 'ies'}.`);
    } catch {
      setMessage('Failed to load planning context or stories for this project.');
    } finally {
      setLoadingContext(false);
    }
  };

  const selectedConnection = jiraConnections.find((c) => c.id === selectedConnectionId);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Projects Explorer</h2>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h3 className="font-semibold">Pull Jira Projects</h3>
        <p className="text-sm text-slate-600">Choose a saved Jira connection, pull projects, then click a project to auto-select Sprint / Release / Backlog context.</p>
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
          <button className="px-4 py-2 rounded-xl bg-blue-800 text-white disabled:bg-slate-400" onClick={loadProjects} disabled={loadingProjects || !selectedConnectionId}>
            {loadingProjects ? 'Pulling...' : 'Pull Projects'}
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
              <tr
                key={project.id}
                className={`border-t cursor-pointer ${selectedProjectKey === project.key ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                onClick={() => void loadPlanningContextAndStories(project.key)}
              >
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

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h3 className="font-semibold">Auto-discovered Planning Context</h3>
        {!planningContext ? (
          <p className="text-sm text-slate-500">{loadingContext ? 'Discovering context...' : 'Select a project to discover planning context.'}</p>
        ) : (
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Type:</span> {planningContext.type}</p>
            <p><span className="font-medium">Name:</span> {planningContext.name}</p>
            <p><span className="font-medium">State:</span> {planningContext.state}</p>
            {planningContext.startDate ? <p><span className="font-medium">Start:</span> {planningContext.startDate}</p> : null}
            {planningContext.endDate ? <p><span className="font-medium">End:</span> {planningContext.endDate}</p> : null}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Stories in Selected Context</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Key</th>
              <th className="text-left">Title</th>
              <th className="text-left">Status</th>
              <th className="text-left">Priority</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story) => (
              <tr key={story.id} className="border-t">
                <td className="p-2">{story.key}</td>
                <td>{story.title}</td>
                <td>{story.status ?? '-'}</td>
                <td>{story.priority ?? '-'}</td>
              </tr>
            ))}
            {!stories.length ? (
              <tr className="border-t">
                <td className="p-3 text-slate-500" colSpan={4}>
                  {planningContext ? 'No stories found for selected planning context.' : 'No stories loaded yet.'}
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
