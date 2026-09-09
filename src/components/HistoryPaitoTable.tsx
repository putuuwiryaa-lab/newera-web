import React, { useState, useMemo } from 'react';
import type { HistoryItem, PaitoMacroPrediction } from '../engine/types';
import { predictPaitoMacro } from '../engine/paitoPredictor';
import { PaitoPredictionCard } from './PaitoPredictionCard';
import { ListFilter, Search, X, Copy, Check, Star } from 'lucide-react';

interface HistoryPaitoTableProps {
  historyItems: HistoryItem[];
  marketName: string;
  paitoPrediction?: PaitoMacroPrediction | null;
}

export const HistoryPaitoTable: React.FC<HistoryPaitoTableProps> = ({
  historyItems,
  marketName,
  paitoPrediction
}) => {
  const [filterTwinOnly, setFilterTwinOnly] = useState(false);
  const [filterBiji, setFilterBiji] = useState<'all' | 'top3' | number>('all');
  const [filterParity, setFilterParity] = useState<string>('all');
  const [searchDigit, setSearchDigit] = useState<string>('');
  const [limit, setLimit] = useState<number>(25);
  const [copied, setCopied] = useState(false);

  const computedPrediction = useMemo(() => {
    if (paitoPrediction) return paitoPrediction;
    const h2D: [number, number][] = historyItems.map((item) => [item.kepala, item.ekor]);
    return predictPaitoMacro(h2D);
  }, [paitoPrediction, historyItems]);

  // Ambil dari yang paling baru (paling belakang)
  const reversed = useMemo(() => [...historyItems].reverse(), [historyItems]);

  const filtered = useMemo(() => {
    return reversed.filter((item) => {
      if (filterTwinOnly && !item.isTwin) return false;
      if (filterBiji === 'top3') {
        if (!computedPrediction.topBiji.includes(item.biji)) return false;
      } else if (typeof filterBiji === 'number') {
        if (item.biji !== filterBiji) return false;
      }
      if (filterParity !== 'all') {
        if (item.ganjilGenap !== filterParity) return false;
      }
      if (searchDigit.trim()) {
        const query = searchDigit.trim();
        const comb2D = `${item.kepala}${item.ekor}`;
        const draw4D = `${item.as}${item.kop}${item.kepala}${item.ekor}`;
        if (!comb2D.includes(query) && !draw4D.includes(query)) return false;
      }
      return true;
    });
  }, [reversed, filterTwinOnly, filterBiji, filterParity, searchDigit, computedPrediction]);

  const displayed = useMemo(() => filtered.slice(0, limit), [filtered, limit]);

  const handleCopyPaito = () => {
    const lines = displayed.map(
      (d) =>
        `#${d.index}\t${d.full}\t${d.kepala}${d.ekor}\t${d.isTwin ? 'TWIN' : '-'}\tBiji:${d.biji}\t${d.besarKecil}\t${d.ganjilGenap}`
    );
    const header = `=== REKAP PAITO ${marketName} (${displayed.length} PUTARAN) ===\nNo\tResult 4D\tTarget 2D\tTwin\tBiji\tKategori\tPola`;
    navigator.clipboard.writeText([header, ...lines].join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Statistik cepat dari data yang sedang ditampilkan
  const stats = useMemo(() => {
    if (displayed.length === 0) return { twinPct: 0, besarPct: 0, genapPct: 0 };
    const twins = displayed.filter((d) => d.isTwin).length;
    const besars = displayed.filter((d) => d.besarKecil === 'Besar').length;
    const genaps = displayed.filter((d) => d.ganjilGenap.includes('Genap')).length;

    return {
      twinPct: Math.round((twins / displayed.length) * 100),
      besarPct: Math.round((besars / displayed.length) * 100),
      genapPct: Math.round((genaps / displayed.length) * 100)
    };
  }, [displayed]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Kartu Prediksi Makro Paito */}
      <PaitoPredictionCard
        prediction={computedPrediction}
        marketName={marketName}
        historyItems={historyItems}
      />

      {/* Tabel Riwayat Paito & Filter */}
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ListFilter className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-base font-semibold text-white tracking-tight">
                Riwayat Paito & Pengeluaran 2D
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 font-mono border border-white/[0.08]">
                {marketName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Menampilkan {displayed.length} dari {filtered.length} putaran ({historyItems.length} total putaran tercatat)
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search by digit */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari digit / 2D..."
              value={searchDigit}
              onChange={(e) => setSearchDigit(e.target.value)}
              className="pl-8 pr-7 py-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl text-slate-200 text-xs w-36 sm:w-44 focus:outline-none focus:border-emerald-500/50 font-mono transition-colors"
            />
            {searchDigit && (
              <button
                onClick={() => setSearchDigit('')}
                className="absolute right-2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={typeof filterBiji === 'number' ? filterBiji : filterBiji}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all' || val === 'top3') setFilterBiji(val);
              else setFilterBiji(Number(val));
            }}
            className="px-3 py-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500/50 font-mono cursor-pointer"
          >
            <option value="all">Semua Biji</option>
            <option value="top3">★ Top 3 Biji ({computedPrediction.topBiji.join(',')})</option>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((b) => (
              <option key={b} value={b}>
                Biji {b}
              </option>
            ))}
          </select>

          <select
            value={filterParity}
            onChange={(e) => setFilterParity(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500/50 font-mono cursor-pointer"
          >
            <option value="all">Semua Pola</option>
            <option value="Genap-Genap">Genap-Genap</option>
            <option value="Genap-Ganjil">Genap-Ganjil</option>
            <option value="Ganjil-Genap">Ganjil-Genap</option>
            <option value="Ganjil-Ganjil">Ganjil-Ganjil</option>
          </select>

          <button
            onClick={() => setFilterTwinOnly(!filterTwinOnly)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              filterTwinOnly
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 font-semibold shadow-sm'
                : 'bg-slate-950/80 border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            {filterTwinOnly ? 'Twin Aktif' : 'Twin Saja'}
          </button>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500/50 font-mono cursor-pointer"
          >
            <option value={15}>15 Data</option>
            <option value={25}>25 Data</option>
            <option value={50}>50 Data</option>
            <option value={100}>100 Data</option>
            <option value={200}>200 Data</option>
            <option value={500}>500 Data</option>
          </select>

          <button
            onClick={handleCopyPaito}
            className="px-3 py-1.5 rounded-xl border border-white/[0.08] bg-slate-950/80 text-slate-300 hover:text-white flex items-center space-x-1.5 text-xs font-medium transition-colors"
            title="Salin data tabel paito yang tampil"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>
      </div>

      {/* Mini Stat Summary Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-950/50 p-3 rounded-xl border border-white/[0.06]">
        <span className="text-slate-400 font-sans text-[11px] mr-1">Statistik Sampel:</span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300">
          Twin: <strong className="text-rose-400">{stats.twinPct}%</strong>
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300">
          Besar: <strong className="text-amber-400">{stats.besarPct}%</strong> | Kecil: <strong className="text-cyan-400">{100 - stats.besarPct}%</strong>
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300">
          Genap: <strong className="text-emerald-400">{stats.genapPct}%</strong> | Ganjil: <strong className="text-purple-400">{100 - stats.genapPct}%</strong>
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <th className="pb-2.5 font-medium">No</th>
              <th className="pb-2.5 font-medium">Result 4D</th>
              <th className="pb-2.5 font-medium">Target 2D</th>
              <th className="pb-2.5 font-medium">Status Twin</th>
              <th className="pb-2.5 font-medium">Biji 2D</th>
              <th className="pb-2.5 font-medium">Kategori</th>
              <th className="pb-2.5 text-right font-medium">Pola</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] font-mono">
            {displayed.map((item, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 text-slate-500 text-[11px]">
                  #{item.index}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-500">{item.as}</span>
                    <span className="text-slate-500">{item.kop}</span>
                    <span className="font-bold text-emerald-400">{item.kepala}</span>
                    <span className="font-bold text-emerald-400">{item.ekor}</span>
                  </div>
                </td>
                <td className="py-2.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-bold tracking-wider shadow-sm">
                    {item.kepala}{item.ekor}
                  </span>
                </td>
                <td className="py-2.5">
                  {item.isTwin ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold">
                      TWIN ({item.kepala}{item.ekor})
                    </span>
                  ) : (
                    <span className="text-slate-600 text-[11px]">-</span>
                  )}
                </td>
                <td className="py-2.5 font-bold">
                  {computedPrediction.topBiji.includes(item.biji) ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] shadow-sm font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{item.biji}</span>
                    </span>
                  ) : (
                    <span className="text-cyan-400">{item.biji}</span>
                  )}
                </td>
                <td className="py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      item.besarKecil === 'Besar'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25'
                    } ${
                      item.besarKecil === computedPrediction.primaryMagnitude
                        ? 'ring-1 ring-white/20'
                        : ''
                    }`}
                  >
                    {item.besarKecil}
                  </span>
                </td>
                <td className="py-2.5 text-right text-[11px]">
                  {item.ganjilGenap === computedPrediction.primaryParity ? (
                    <span className="text-emerald-400 font-semibold inline-flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      <span>{item.ganjilGenap}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">{item.ganjilGenap}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};


