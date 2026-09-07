import React, { useState, useMemo } from 'react';
import type { HistoryItem } from '../engine/types';
import { ListFilter, Search, X } from 'lucide-react';

interface HistoryPaitoTableProps {
  historyItems: HistoryItem[];
  marketName: string;
}

export const HistoryPaitoTable: React.FC<HistoryPaitoTableProps> = ({
  historyItems,
  marketName
}) => {
  const [filterTwinOnly, setFilterTwinOnly] = useState(false);
  const [searchDigit, setSearchDigit] = useState<string>('');
  const [limit, setLimit] = useState<number>(25);

  // Ambil dari yang paling baru (paling belakang)
  const reversed = useMemo(() => [...historyItems].reverse(), [historyItems]);

  const filtered = useMemo(() => {
    return reversed.filter((item) => {
      if (filterTwinOnly && !item.isTwin) return false;
      if (searchDigit.trim()) {
        const query = searchDigit.trim();
        const comb2D = `${item.kepala}${item.ekor}`;
        const draw4D = `${item.as}${item.kop}${item.kepala}${item.ekor}`;
        if (!comb2D.includes(query) && !draw4D.includes(query)) return false;
      }
      return true;
    });
  }, [reversed, filterTwinOnly, searchDigit]);

  const displayed = useMemo(() => filtered.slice(0, limit), [filtered, limit]);

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
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ListFilter className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white tracking-wide">
              RIWAYAT PAITO & PENGELUARAN 2D: {marketName}
            </h4>
            <p className="text-xs text-gray-400">
              Menampilkan {displayed.length} dari {filtered.length} putaran ({historyItems.length} total tercatat)
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search by digit */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari digit / 2D..."
              value={searchDigit}
              onChange={(e) => setSearchDigit(e.target.value)}
              className="pl-8 pr-7 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-gray-200 text-xs w-36 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
            />
            {searchDigit && (
              <button
                onClick={() => setSearchDigit('')}
                className="absolute right-2 text-gray-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterTwinOnly(!filterTwinOnly)}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filterTwinOnly
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold shadow-sm'
                : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {filterTwinOnly ? '✓ Filter Twin Saja' : 'Filter Twin Saja'}
          </button>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-gray-300 text-xs focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
          >
            <option value={15}>15 Data</option>
            <option value={25}>25 Data</option>
            <option value={50}>50 Data</option>
            <option value={100}>100 Data</option>
          </select>
        </div>
      </div>

      {/* Mini Stat Summary Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-gray-400 font-sans text-[11px] mr-1">Statistik Sampel:</span>
        <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-300">
          Twin: <strong className="text-rose-400">{stats.twinPct}%</strong>
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-300">
          Besar: <strong className="text-amber-400">{stats.besarPct}%</strong> | Kecil: <strong className="text-blue-400">{100 - stats.besarPct}%</strong>
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-300">
          Genap: <strong className="text-emerald-400">{stats.genapPct}%</strong> | Ganjil: <strong className="text-purple-400">{100 - stats.genapPct}%</strong>
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 font-mono uppercase text-[10px]">
              <th className="pb-2.5">No</th>
              <th className="pb-2.5">Result 4D</th>
              <th className="pb-2.5">Target 2D</th>
              <th className="pb-2.5">Status Twin</th>
              <th className="pb-2.5">Biji 2D</th>
              <th className="pb-2.5">Kategori</th>
              <th className="pb-2.5 text-right">Pola</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40 font-mono">
            {displayed.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-2.5 text-gray-500 text-[11px]">
                  #{item.index}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">{item.as}</span>
                    <span className="text-gray-500">{item.kop}</span>
                    <span className="font-bold text-emerald-400">{item.kepala}</span>
                    <span className="font-bold text-emerald-400">{item.ekor}</span>
                  </div>
                </td>
                <td className="py-2.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-bold tracking-wider shadow-sm">
                    {item.kepala}{item.ekor}
                  </span>
                </td>
                <td className="py-2.5">
                  {item.isTwin ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold animate-pulse">
                      TWIN ({item.kepala}{item.ekor})
                    </span>
                  ) : (
                    <span className="text-gray-600 text-[11px]">-</span>
                  )}
                </td>
                <td className="py-2.5 font-bold text-cyan-400">
                  {item.biji}
                </td>
                <td className="py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.besarKecil === 'Besar'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {item.besarKecil}
                  </span>
                </td>
                <td className="py-2.5 text-right text-gray-400 text-[11px]">
                  {item.ganjilGenap}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

