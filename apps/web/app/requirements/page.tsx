const requirements = [
  { key: 'PAY-101', title: 'Reset password via OTP', status: 'In Progress', priority: 'High' },
  { key: 'PAY-102', title: 'Revoke active sessions', status: 'To Do', priority: 'Medium' }
];

export default function RequirementsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Requirements Explorer</h2>
      <input className="w-full border rounded px-3 py-2" placeholder="Search requirements..." />
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-slate-100"><tr><th className="p-2">Select</th><th>Key</th><th>Title</th><th>Status</th><th>Priority</th></tr></thead><tbody>{requirements.map((r) => <tr key={r.key} className="border-t"><td className="p-2"><input type="checkbox" /></td><td>{r.key}</td><td>{r.title}</td><td>{r.status}</td><td>{r.priority}</td></tr>)}</tbody></table>
      </div>
      <button className="px-3 py-2 rounded bg-slate-900 text-white">Generate Test Cases</button>
    </div>
  );
}
