export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Enterprise QA Test Design Dashboard</h2>
      <div className="grid grid-cols-4 gap-4">
        {['Saved Connections', 'Active Release Stories', 'Generated Cases', 'Push Success Rate'].map((k) => (
          <div key={k} className="bg-white p-4 rounded-xl shadow"><p className="text-xs text-slate-500">{k}</p><p className="text-2xl font-semibold">12</p></div>
        ))}
      </div>
    </div>
  );
}
