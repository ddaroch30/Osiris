export default function AuditPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Activity Log</h2>
      <div className="bg-white rounded-xl shadow p-4 text-sm space-y-2">
        <p>CONNECTION_CREATED • ClientConnection • conn_demo_1</p>
        <p>GENERATION_BATCH_CREATED • GeneratedTestCaseBatch • batch_1</p>
        <p>PUSH_EXECUTION_COMPLETED • PushExecution • push_1</p>
      </div>
    </div>
  );
}
