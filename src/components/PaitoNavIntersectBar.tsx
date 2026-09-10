import React from 'react';
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react';

interface PaitoNavIntersectBarProps {
  jarak: number;
  setJarak: (j: number) => void;
  onNavigate: (
    target: 'as' | 'kop' | 'kepala' | 'ekor' | 'jumlah' | 'depan' | 'lurus',
    dir: -1 | 1
  ) => void;
  theme: 'dark' | 'light';
}

export const PaitoNavIntersectBar: React.FC<PaitoNavIntersectBarProps> = ({
  jarak,
  setJarak,
  onNavigate,
  theme
}) => {
  return (
    <div
      className={`rounded-2xl border p-2.5 sm:p-3 shadow-md space-y-2 transition-colors ${
        theme === 'light'
          ? 'bg-slate-100 border-slate-300 text-slate-800'
          : 'bg-slate-950/80 border-white/[0.08] text-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Info & Jarak Selector */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="flex items-center space-x-1 font-bold text-amber-400">
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">KANCING TARIKAN:</span>
          </div>

          <div className="flex items-center space-x-1">
            <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>Jarak:</span>
            <select
              value={jarak}
              onChange={(e) => setJarak(Number(e.target.value))}
              className={`px-2 py-0.5 rounded border text-xs font-bold focus:outline-none cursor-pointer ${
                theme === 'light'
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-slate-900 border-white/[0.1] text-amber-300'
              }`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((j) => (
                <option key={j} value={j}>
                  {j} baris
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center/Right: Kancing 1-Digit A, C, K, E, J */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          {/* AS (Gold) */}
          <div className="flex items-stretch rounded-lg overflow-hidden border border-amber-600/50 shadow-sm">
            <button
              onClick={() => onNavigate('as', -1)}
              title="Cari tarikan As mundur"
              className="bg-amber-700 hover:bg-amber-600 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="bg-[#e38204] text-white font-black px-2.5 py-1 text-xs flex items-center justify-center">
              A
            </div>
            <button
              onClick={() => onNavigate('as', 1)}
              title="Cari tarikan As maju"
              className="bg-amber-700 hover:bg-amber-600 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* KOP / COP (Ungu) */}
          <div className="flex items-stretch rounded-lg overflow-hidden border border-purple-600/50 shadow-sm">
            <button
              onClick={() => onNavigate('kop', -1)}
              title="Cari tarikan Kop mundur"
              className="bg-purple-800 hover:bg-purple-700 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="bg-[#8e44ad] text-white font-black px-2.5 py-1 text-xs flex items-center justify-center">
              C
            </div>
            <button
              onClick={() => onNavigate('kop', 1)}
              title="Cari tarikan Kop maju"
              className="bg-purple-800 hover:bg-purple-700 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* KEPALA (Merah) */}
          <div className="flex items-stretch rounded-lg overflow-hidden border border-rose-600/50 shadow-sm">
            <button
              onClick={() => onNavigate('kepala', -1)}
              title="Cari tarikan Kepala mundur"
              className="bg-rose-700 hover:bg-rose-600 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="bg-[#f80000] text-white font-black px-2.5 py-1 text-xs flex items-center justify-center">
              K
            </div>
            <button
              onClick={() => onNavigate('kepala', 1)}
              title="Cari tarikan Kepala maju"
              className="bg-rose-700 hover:bg-rose-600 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* EKOR (Hijau) */}
          <div className="flex items-stretch rounded-lg overflow-hidden border border-emerald-600/50 shadow-sm">
            <button
              onClick={() => onNavigate('ekor', -1)}
              title="Cari tarikan Ekor mundur"
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="bg-[#27ae60] text-white font-black px-2.5 py-1 text-xs flex items-center justify-center">
              E
            </div>
            <button
              onClick={() => onNavigate('ekor', 1)}
              title="Cari tarikan Ekor maju"
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* JUMLAH / BIJI (Biru) */}
          <div className="flex items-stretch rounded-lg overflow-hidden border border-cyan-600/50 shadow-sm">
            <button
              onClick={() => onNavigate('jumlah', -1)}
              title="Cari tarikan Jumlah mundur"
              className="bg-cyan-700 hover:bg-cyan-600 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="bg-[#0ea5e9] text-white font-black px-2.5 py-1 text-xs flex items-center justify-center">
              J
            </div>
            <button
              onClick={() => onNavigate('jumlah', 1)}
              title="Cari tarikan Jumlah maju"
              className="bg-cyan-700 hover:bg-cyan-600 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* 2D DEPAN (As & Kop) */}
          <div className="flex items-stretch rounded-lg overflow-hidden border border-amber-600/50 shadow-sm">
            <button
              onClick={() => onNavigate('depan', -1)}
              title="Cari tarikan 2D Depan (As-Kop) mundur"
              className="bg-amber-800 hover:bg-amber-700 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold px-2 py-1 text-[11px] flex items-center justify-center whitespace-nowrap">
              2D DEPAN
            </div>
            <button
              onClick={() => onNavigate('depan', 1)}
              title="Cari tarikan 2D Depan (As-Kop) maju"
              className="bg-amber-800 hover:bg-amber-700 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* 2D LURUS (Kepala & Ekor) */}
          <div className="flex items-stretch rounded-lg overflow-hidden border border-emerald-600/50 shadow-sm">
            <button
              onClick={() => onNavigate('lurus', -1)}
              title="Cari tarikan 2D Lurus (Kepala-Ekor) mundur"
              className="bg-emerald-800 hover:bg-emerald-700 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-2 py-1 text-[11px] flex items-center justify-center whitespace-nowrap">
              2D LURUS
            </div>
            <button
              onClick={() => onNavigate('lurus', 1)}
              title="Cari tarikan 2D Lurus (Kepala-Ekor) maju"
              className="bg-emerald-800 hover:bg-emerald-700 text-white px-1.5 py-1 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
