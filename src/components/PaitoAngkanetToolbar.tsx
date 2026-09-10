import React from 'react';
import { RefreshCw, Sun, Moon, Paintbrush } from 'lucide-react';

export interface AngkanetColor {
  id: string;
  name: string;
  hex: string;
  textDark?: boolean;
}

export const ANGKANET_COLORS: AngkanetColor[] = [
  { id: 'red', name: 'Merah', hex: '#e74c3c' },
  { id: 'purple', name: 'Ungu', hex: '#8e44ad' },
  { id: 'green', name: 'Hijau', hex: '#0a9344' },
  { id: 'yellow', name: 'Kuning', hex: '#f39c12', textDark: true },
  { id: 'lightblue', name: 'Biru Muda', hex: '#3498db', textDark: true },
  { id: 'teal', name: 'Tosca', hex: '#1abc9c', textDark: true },
  { id: 'orange', name: 'Oranye', hex: '#d35400' },
  { id: 'darkblue', name: 'Biru Tua', hex: '#114edf' }
];

interface PaitoAngkanetToolbarProps {
  colCount: number;
  setColCount: (cols: number) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  rowsLimit: number;
  setRowsLimit: (n: number) => void;
  activeColor: string;
  onSelectColor: (c: string) => void;
  onReset: () => void;
  paintedCount: number;
  marketName: string;
}

export const PaitoAngkanetToolbar: React.FC<PaitoAngkanetToolbarProps> = ({
  colCount,
  setColCount,
  theme,
  setTheme,
  rowsLimit,
  setRowsLimit,
  activeColor,
  onSelectColor,
  onReset,
  paintedCount,
  marketName
}) => {
  return (
    <div
      className={`sticky top-0 z-30 transition-colors shadow-xl border rounded-2xl p-2.5 sm:p-3 backdrop-blur-md space-y-2.5 ${
        theme === 'light'
          ? 'bg-slate-100/95 border-slate-300 text-slate-900'
          : 'bg-slate-950/95 border-white/[0.12] text-white'
      }`}
    >
      {/* Baris 1: Pengaturan Grid Kolom & Kontrol Tampilan */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {/* Market Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold font-sans">
            <span>PASARAN:</span>
            <span className="text-white tracking-wide">{marketName}</span>
          </div>

          {/* Kolom Grid Selector (5, 6, 7 Col) */}
          <div className="flex items-center space-x-1">
            <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>Grid:</span>
            <select
              value={colCount}
              onChange={(e) => setColCount(Number(e.target.value))}
              className={`px-2.5 py-1 rounded-lg border font-bold text-xs focus:outline-none cursor-pointer ${
                theme === 'light'
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                  : 'bg-slate-900 border-white/[0.15] text-amber-300 focus:border-amber-400'
              }`}
            >
              <option value={7}>7 col (Senin-Minggu)</option>
              <option value={6}>6 col</option>
              <option value={5}>5 col (Format SGP)</option>
              <option value={4}>4 col</option>
              <option value={3}>3 col</option>
              <option value={2}>2 col</option>
              <option value={1}>1 col</option>
            </select>
          </div>

          {/* Batas Baris */}
          <div className="flex items-center space-x-1">
            <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>Baris:</span>
            <select
              value={rowsLimit}
              onChange={(e) => setRowsLimit(Number(e.target.value))}
              className={`px-2 py-1 rounded-lg border text-xs focus:outline-none cursor-pointer ${
                theme === 'light'
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-900 border-white/[0.15] text-slate-200'
              }`}
            >
              <option value={20}>20 Baris (~{20 * colCount} draw)</option>
              <option value={35}>35 Baris (~{35 * colCount} draw)</option>
              <option value={50}>50 Baris (~{50 * colCount} draw)</option>
              <option value={100}>100 Baris</option>
              <option value={9999}>Semua Baris</option>
            </select>
          </div>
        </div>

        {/* Right side: Tema Paito (Dark/Light) & Info Coretan */}
        <div className="flex items-center space-x-2">
          {paintedCount > 0 && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
              {paintedCount} Digit Dicat
            </span>
          )}

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Ganti Tema Tampilan Paito (Gelap / Terang Klasik)"
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
              theme === 'light'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-900 border-white/[0.15] text-slate-300 hover:text-white'
            }`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Paito Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Paito Gelap</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Baris 2: Palet Kuas Warna Asli Angkanet (Model Fieldset Sticky) */}
      <div
        className={`flex flex-wrap items-center gap-2 p-1.5 rounded-xl border ${
          theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-white/[0.08]'
        }`}
      >
        {/* Tombol RESET */}
        <button
          onClick={onReset}
          title="Reset semua warna cat di paito"
          className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-[11px] font-mono font-bold tracking-wider transition-all flex items-center space-x-1 shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          <span>RESET</span>
        </button>

        {/* 8 Kotak Warna Angkanet */}
        <div className="flex items-center space-x-1 flex-1 min-w-[200px]">
          {ANGKANET_COLORS.map((c) => {
            const isSelected = activeColor === c.hex;
            return (
              <button
                key={c.id}
                onClick={() => onSelectColor(c.hex)}
                title={`Kuas ${c.name}`}
                className={`h-7 flex-1 min-w-[24px] max-w-[48px] rounded-lg transition-transform border flex items-center justify-center relative shadow-sm ${
                  isSelected
                    ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-950 z-10 border-white'
                    : 'opacity-90 hover:opacity-100 hover:scale-105 border-black/30'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && (
                  <div
                    className={`w-2 h-2 rounded-full ${
                      c.textDark ? 'bg-slate-950' : 'bg-white'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tombol Brush / Eraser */}
        <button
          onClick={() => onSelectColor('eraser')}
          title="Kuas Penghapus (Klik digit untuk hapus warna)"
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center space-x-1 shrink-0 ${
            activeColor === 'eraser'
              ? 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-400'
              : theme === 'light'
              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              : 'bg-slate-950 border-white/[0.1] text-slate-300 hover:text-white'
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>{activeColor === 'eraser' ? 'Penghapus Aktif' : 'Brush / Hapus'}</span>
        </button>
      </div>
    </div>
  );
};
