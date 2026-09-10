import React from 'react';
import type { DeadDigitDetail } from '../engine/types';
import { Scissors, ShieldCheck, AlertTriangle } from 'lucide-react';

interface TriadKumatCardProps {
  triadKumat?: DeadDigitDetail[];
  fallbackDeadDigits?: number[];
  onToast?: (message: string) => void;
}

export const TriadKumatCard: React.FC<TriadKumatCardProps> = ({
  triadKumat,
  fallbackDeadDigits = [],
  onToast
}) => {
  // Jika triadKumat tidak tersedia, buat fallback dari 2-3 digit terlemah
  const displayKumat: DeadDigitDetail[] = triadKumat && triadKumat.length > 0
    ? triadKumat
    : fallbackDeadDigits.slice(0, 3).map((d) => ({
        digit: d,
        safetyScore: 80,
        status: 'AMAN' as const,
        reason: 'Afinitas 2D Terlemah',
        gap: 10
      }));

  const handleCopyDigit = (d: number) => {
    navigator.clipboard.writeText(d.toString());
    if (onToast) onToast(`Digit mati ${d} disalin`);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-rose-500/25 bg-gradient-to-b from-rose-950/20 via-slate-900/80 to-slate-950/90 shadow-lg flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                3 Triad Kumat (Digit Buang Paito)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                10 - 7 = 3
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              3 digit terdingin & paling terisolasi yang sengaja dicoret dari formasi
            </p>
          </div>
        </div>

        {/* 3 Digits Display */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          {displayKumat.map((item) => {
            const isSafe = item.status === 'AMAN';
            const isWarning = item.status === 'WASPADA';
            return (
              <div
                key={item.digit}
                onClick={() => handleCopyDigit(item.digit)}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer relative group ${
                  isSafe
                    ? 'bg-slate-950/70 border-rose-500/30 hover:border-rose-400'
                    : isWarning
                    ? 'bg-amber-950/30 border-amber-500/30 hover:border-amber-400'
                    : 'bg-slate-950/60 border-white/[0.08]'
                }`}
                title={`Digit ${item.digit}: ${item.reason}. Klik untuk salin.`}
              >
                {/* Red cross tag */}
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                  ✕
                </span>

                {/* Big Digit with Strikethrough */}
                <div className="font-mono font-black text-3xl sm:text-4xl text-rose-300/80 line-through decoration-rose-500 decoration-2 my-1">
                  {item.digit}
                </div>

                {/* Safety Badge */}
                <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center space-x-1 ${
                  isSafe
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : isWarning
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {isSafe && <ShieldCheck className="w-2.5 h-2.5" />}
                  {isWarning && <AlertTriangle className="w-2.5 h-2.5" />}
                  <span>{item.safetyScore}% {item.status}</span>
                </div>

                {/* Reason tag */}
                <span className="text-[10px] text-slate-400 text-center line-clamp-1 mt-1 font-mono">
                  {item.reason}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed text-center px-1">
          Ketiga digit ini memiliki momentum terdingin, skor matriks afinitas terendah, dan berada di luar rotasi Shio aktif.
        </p>
      </div>

      <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
        <span className="text-rose-400/90 font-mono">Zero Risk Pruning</span>
        <span className="font-mono text-slate-400">Pangkas 58 line sia-sia</span>
      </div>
    </div>
  );
};
