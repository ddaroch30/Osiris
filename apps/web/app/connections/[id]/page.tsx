export default function ConnectionDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Connection Detail: {params.id}</h2>
      <div className="bg-white rounded-xl shadow p-4 text-sm space-y-2">
        <p>Status: <span className="text-emerald-700">ACTIVE</span></p>
        <p>Projects: fetched via connector adapter</p>
        <p>Last validated: just now</p>
      </div>
    </div>
  );
}
