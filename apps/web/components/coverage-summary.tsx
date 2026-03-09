export function CoverageSummary({ total, approved }: { total: number; approved: number }) {
  const pct = total === 0 ? 0 : Math.round((approved / total) * 100);
  return <span>{approved}/{total} approved ({pct}%)</span>;
}
