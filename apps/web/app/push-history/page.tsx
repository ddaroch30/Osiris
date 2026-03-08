export default function PushHistoryPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Push Status & Execution History</h2>
      <div className="bg-white rounded-xl shadow p-4">
        <p className="text-sm">Execution push_173083993 - <span className="text-emerald-700">Completed</span></p>
        <ul className="text-sm list-disc ml-5 mt-2">
          <li>ZEPHYR-TC-1000 linked to PAY-101</li>
          <li>ZEPHYR-TC-1001 linked to PAY-102</li>
        </ul>
      </div>
    </div>
  );
}
