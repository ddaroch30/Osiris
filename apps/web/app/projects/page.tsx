export default function ProjectsPage() {
  const rows = [{ key: 'PAY', name: 'Payments Modernization', source: 'Jira+Zephyr' }, { key: 'IAM', name: 'Identity Hardening', source: 'Azure DevOps' }];
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Projects Explorer</h2>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-slate-100"><tr><th className="p-2 text-left">Project Key</th><th>Name</th><th>Source</th></tr></thead><tbody>{rows.map((r) => <tr key={r.key} className="border-t"><td className="p-2">{r.key}</td><td>{r.name}</td><td>{r.source}</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
