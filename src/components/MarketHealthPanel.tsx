import type { MarketHealth, HealthStatus } from '../engine/marketHealth';

const colors: Record<HealthStatus, string> = {
  HEALTHY: 'text-emerald-300 border-emerald-500/30', STALE: 'text-amber-300 border-amber-500/30',
  DRIFT: 'text-orange-300 border-orange-500/30', ERROR: 'text-rose-300 border-rose-500/30'
};

export function MarketHealthPanel({ health, productionAvailable }: { health: MarketHealth; productionAvailable: boolean }) {
  const issues = health.checks.filter(c => c.status !== 'HEALTHY');
  return <section aria-label="Market health" className={`glass-panel rounded-2xl p-4 border ${colors[health.status]}`}>
    <div className="flex flex-wrap gap-3 items-center justify-between">
      <strong className="text-sm">Market health · {health.status}</strong>
      <span className="text-xs font-mono">{productionAvailable ? 'Sumber prediksi: Python / Firestore' : 'Prediksi production tidak tersedia'}</span>
    </div>
    <p className="text-xs text-slate-300 mt-2">
      {health.parity?.status === 'DRIFT'
        ? `Diagnostik TypeScript berbeda pada ${health.parity.differingFields}/${health.parity.comparedFields} field (${health.parity.divergencePct.toFixed(2)}%). Prediksi tersimpan Python tetap menjadi acuan.`
        : 'TypeScript digunakan untuk diagnostik. Status health tidak menunjukkan akurasi atau edge prediksi.'}
    </p>
    <p className="text-xs text-slate-400 mt-1">Confidence AI/convergence, movement, detail Triad, dan timeline rekonstruksi adalah diagnostik lokal.</p>
    <details className="mt-3 text-xs text-slate-400">
      <summary className="cursor-pointer">{issues.length} pemeriksaan perlu perhatian · lihat detail</summary>
      <ul className="space-y-1 mt-2 break-words">{health.checks.map(c => <li key={c.code}><span className={colors[c.status].split(' ')[0]}>{c.status}</span> · {c.code}: {c.detail}</li>)}</ul>
      {health.parity && <div className="overflow-x-auto mt-3"><table className="w-full text-left">
        <thead><tr><th>Komponen</th><th>Field berbeda</th></tr></thead>
        <tbody>{Object.entries(health.parity.groups).map(([name, g]) => <tr key={name}><td>{name}</td><td>{g.differing}/{g.compared}</td></tr>)}</tbody>
      </table></div>}
    </details>
  </section>;
}
