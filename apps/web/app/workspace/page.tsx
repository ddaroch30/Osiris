const grouped = {
  'PAY-101': [
    { id: 'tc1', title: 'Positive flow', status: 'APPROVED' },
    { id: 'tc2', title: 'Validation checks', status: 'DRAFT' }
  ]
};

export default function WorkspacePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Review Workspace</h2>
      <label className="text-sm"><input type="checkbox" className="mr-2"/>Show approved only</label>
      {Object.entries(grouped).map(([req, cases]) => (
        <section key={req} className="bg-white rounded-xl shadow p-4 space-y-2">
          <h3 className="font-semibold">Requirement {req} ({cases.length} cases)</h3>
          {cases.map((c) => <div key={c.id} className="border rounded p-3 space-y-2"><div className="flex justify-between"><p>{c.title}</p><span className="text-xs">{c.status}</span></div><textarea className="w-full border rounded p-2" defaultValue="Edit preconditions, steps, expected result"/><div className="flex gap-2"><button className="bg-emerald-600 text-white px-2 py-1 rounded">Approve</button><button className="px-2 py-1 rounded bg-slate-200">Unapprove</button><button className="px-2 py-1 rounded bg-rose-100">Delete</button></div></div>)}
          <button className="px-2 py-1 rounded bg-slate-900 text-white">Add Manual Test Case</button>
        </section>
      ))}
      <button className="px-3 py-2 rounded bg-indigo-700 text-white">Push Approved Test Cases</button>
    </div>
  );
}
