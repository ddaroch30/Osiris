export default function ConnectionsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Create Client Connection</h2>
      <div className="bg-white rounded-xl shadow p-4 grid grid-cols-2 gap-3">
        <input className="border rounded px-3 py-2" placeholder="Connection name" />
        <select className="border rounded px-3 py-2"><option>Jira + Zephyr</option><option>Azure DevOps</option><option>qTest</option></select>
        <input className="border rounded px-3 py-2" placeholder="Base URL" />
        <input className="border rounded px-3 py-2" placeholder="Secondary URL (optional)" />
        <select className="border rounded px-3 py-2"><option>API_TOKEN</option><option>BASIC</option><option>BEARER</option></select>
        <input className="border rounded px-3 py-2" placeholder="Username / Email (optional)" />
        <input className="border rounded px-3 py-2 col-span-2" type="password" placeholder="Secret / Token" />
        <div className="col-span-2 flex gap-2">
          <button className="px-3 py-2 rounded bg-slate-200">Validate Connection</button>
          <button className="px-3 py-2 rounded bg-slate-900 text-white">Save Connection</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-2">Saved Connections</h3>
        <p className="text-sm">Demo Jira + Zephyr • ACTIVE • secret: ****demo</p>
      </div>
    </div>
  );
}
