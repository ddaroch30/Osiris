export default function GeneratePage() {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Generate Draft Test Cases</h2>
      <div className="bg-white rounded-xl shadow p-4 text-sm">
        <p>Generation Provider: MockTestCaseGenerationProvider</p>
        <p>Scenarios: positive, negative, edge, validation, alternate</p>
      </div>
    </div>
  );
}
