import React, { useState } from 'react';
import {
  Palette,
  Eraser,
  Trash2,
  Sparkles,
  Check,
  Paintbrush
} from 'lucide-react';

export interface PaitoColorOption {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
}

export const PAITO_COLORS: PaitoColorOption[] = [
  {
    id: 'yellow',
    name: 'Kuning',
    hex: '#eab308',
    bgClass: 'bg-yellow-400 text-slate-950 font-black',
    borderClass: 'border-yellow-300 ring-yellow-400/50',
    textClass: 'text-yellow-400',
    badgeClass: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40'
  },
  {
    id: 'red',
    name: 'Merah',
    hex: '#ef4444',
    bgClass: 'bg-rose-500 text-white font-black',
    borderClass: 'border-rose-400 ring-rose-500/50',
    textClass: 'text-rose-400',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  {
    id: 'green',
    name: 'Hijau',
    hex: '#22c55e',
    bgClass: 'bg-emerald-500 text-slate-950 font-black',
    borderClass: 'border-emerald-300 ring-emerald-400/50',
    textClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    id: 'blue',
    name: 'Biru',
    hex: '#3b82f6',
    bgClass: 'bg-blue-500 text-white font-black',
    borderClass: 'border-blue-300 ring-blue-400/50',
    textClass: 'text-blue-400',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  {
    id: 'purple',
    name: 'Ungu',
    hex: '#a855f7',
    bgClass: 'bg-purple-500 text-white font-black',
    borderClass: 'border-purple-300 ring-purple-400/50',
    textClass: 'text-purple-400',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  {
    id: 'orange',
    name: 'Oranye',
    hex: '#f97316',
    bgClass: 'bg-orange-500 text-slate-950 font-black',
    borderClass: 'border-orange-300 ring-orange-400/50',
    textClass: 'text-orange-400',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
  },
  {
    id: 'cyan',
    name: 'Cyan',
    hex: '#06b6d4',
    bgClass: 'bg-cyan-400 text-slate-950 font-black',
    borderClass: 'border-cyan-300 ring-cyan-400/50',
    textClass: 'text-cyan-400',
    badgeClass: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40'
  },
  {
    id: 'pink',
    name: 'Pink',
    hex: '#ec4899',
    bgClass: 'bg-pink-500 text-white font-black',
    borderClass: 'border-pink-300 ring-pink-400/50',
    textClass: 'text-pink-400',
    badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40'
  }
];

export function getPaitoColorStyle(colorId?: string): string {
  if (!colorId) return '';
  const found = PAITO_COLORS.find((c) => c.id === colorId);
  return found ? found.bgClass : '';
}

export function getPaitoColorHex(colorId?: string): string {
  if (!colorId) return '';
  const found = PAITO_COLORS.find((c) => c.id === colorId);
  return found ? found.hex : '';
}

interface PaitoColorPaletteBarProps {
  activeColor: string; // id color or 'eraser'
  onSelectColor: (colorId: string) => void;
  onClearAll: () => void;
  paintedCount: number;
  onAutoHighlight: (digit: number, position: 'all' | 'as' | 'kop' | 'kepala' | 'ekor' | '2d', colorId: string) => void;
  marketName: string;
}

export const PaitoColorPaletteBar: React.FC<PaitoColorPaletteBarProps> = ({
  activeColor,
  onSelectColor,
  onClearAll,
  paintedCount,
  onAutoHighlight,
  marketName
}) => {
  const [autoDigit, setAutoDigit] = useState<number>(0);
  const [autoPosition, setAutoPosition] = useState<'all' | 'as' | 'kop' | 'kepala' | 'ekor' | '2d'>('ekor');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleApplyAuto = () => {
    const targetColor = activeColor === 'eraser' ? 'yellow' : activeColor;
    onAutoHighlight(autoDigit, autoPosition, targetColor);
  };

  const currentColorObj = PAITO_COLORS.find((c) => c.id === activeColor);

  return (
    <div className="bg-slate-900/95 border border-white/[0.1] p-3 rounded-2xl shadow-xl backdrop-blur-md space-y-3">
      {/* Baris 1: Pilihan Kuas Warna & Tool Dasar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Kuas Indikator & Warna */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 pr-2 border-r border-white/[0.1] text-xs font-semibold text-slate-300">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Palet Paito:</span>
          </div>

          {/* 8 Warna Buttons */}
          <div className="flex items-center space-x-1.5">
            {PAITO_COLORS.map((c) => {
              const isSelected = activeColor === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectColor(c.id)}
                  title={`Pilih Warna ${c.name}`}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all flex items-center justify-center shadow-md relative ${
                    isSelected
                      ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-950 z-10'
                      : 'hover:scale-105 opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && (
                    <Check
                      className={`w-4 h-4 ${
                        c.id === 'yellow' || c.id === 'green' || c.id === 'orange' || c.id === 'cyan'
                          ? 'text-slate-950 stroke-[3]'
                          : 'text-white stroke-[3]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Eraser Button */}
          <button
            onClick={() => onSelectColor('eraser')}
            title="Penghapus (Klik angka untuk hapus warna)"
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeColor === 'eraser'
                ? 'bg-rose-500/25 border-rose-400 text-rose-300 ring-2 ring-rose-400/40'
                : 'bg-slate-950/80 border-white/[0.1] text-slate-400 hover:text-white hover:border-white/[0.2]'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Hapus</span>
          </button>
        </div>

        {/* Right: Info Kuas Aktif & Clear Button */}
        <div className="flex items-center space-x-2.5 text-xs">
          {/* Badge Status Kuas Aktif */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-white/[0.08] text-[11px] font-mono">
            <Paintbrush className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">Kuas:</span>
            {activeColor === 'eraser' ? (
              <span className="text-rose-400 font-bold">Penghapus</span>
            ) : currentColorObj ? (
              <span
                className="font-bold px-1.5 py-0.2 rounded"
                style={{
                  backgroundColor: currentColorObj.hex,
                  color: ['yellow', 'green', 'orange', 'cyan'].includes(currentColorObj.id) ? '#020617' : '#ffffff'
                }}
              >
                {currentColorObj.name}
              </span>
            ) : (
              <span className="text-slate-300">Default</span>
            )}
            {paintedCount > 0 && (
              <span className="text-slate-400 border-l border-white/[0.1] pl-1.5 ml-1 text-[10px]">
                {paintedCount} disorot
              </span>
            )}
          </div>

          {/* Clear All Button */}
          {showConfirmClear ? (
            <div className="flex items-center space-x-1 bg-rose-950/80 border border-rose-500/50 p-1 rounded-xl animate-in fade-in">
              <span className="text-[10px] text-rose-200 px-1 font-sans">Hapus semua?</span>
              <button
                onClick={() => {
                  onClearAll();
                  setShowConfirmClear(false);
                }}
                className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-500"
              >
                Ya
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] hover:bg-slate-700"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmClear(true)}
              disabled={paintedCount === 0}
              title={`Hapus semua coretan warna di ${marketName}`}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                paintedCount > 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                  : 'bg-slate-950/40 border-white/[0.04] text-slate-600 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Cat</span>
            </button>
          )}
        </div>
      </div>

      {/* Baris 2: Power Tool - Auto-Highlight Digit & Posisi (Fitur Khas Paito Internet) */}
      <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-slate-400 text-[11px] font-medium mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sorot Cepat Otomatis:</span>
          </div>

          {/* Digit Selector */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-500 font-mono">Digit:</span>
            <select
              value={autoDigit}
              onChange={(e) => setAutoDigit(Number(e.target.value))}
              className="px-2 py-1 bg-slate-950 border border-white/[0.1] rounded-lg text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-500"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <option key={d} value={d}>
                  Digit {d}
                </option>
              ))}
            </select>
          </div>

          {/* Posisi Selector */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-500 font-mono">Posisi:</span>
            <select
              value={autoPosition}
              onChange={(e) => setAutoPosition(e.target.value as any)}
              className="px-2 py-1 bg-slate-950 border border-white/[0.1] rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ekor">Ekor Belakang (x-x-x-[D])</option>
              <option value="kepala">Kepala Belakang (x-x-[D]-x)</option>
              <option value="2d">Target 2D (x-x-[D-D])</option>
              <option value="as">As Depan ([D]-x-x-x)</option>
              <option value="kop">Kop Depan (x-[D]-x-x)</option>
              <option value="all">Semua Posisi (4D)</option>
            </select>
          </div>

          {/* Action Button */}
          <button
            onClick={handleApplyAuto}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md transition-all active:scale-95"
            title={`Warnai semua kemunculan angka ${autoDigit} di posisi ${autoPosition}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Cat Otomatis</span>
          </button>
        </div>

        {/* Petunjuk Cepat */}
        <div className="text-[10px] text-slate-500 italic hidden xl:block">
          *Klik angka mana saja di tabel / grid paito di bawah untuk mewarnai tarikan Anda.
        </div>
      </div>
    </div>
  );
};
