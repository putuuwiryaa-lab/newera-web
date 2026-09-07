import React from 'react';
import type { PredictionResult } from '../engine/types';
import { Sparkles, Layers, Copy, Check, BarChart2 } from 'lucide-react';

interface PredictionCardProps {
  prediction: PredictionResult | null;
  onOpenGenerator: (digits: number[], tierName: string) => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  onOpenGenerator
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!prediction) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm">
        Memuat kalkulasi adaptif...
      </div>
    );
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const { lastDraw, ai, bbfs, methodWeights } = prediction;

  return (
    <div className="space-y-6">
      {/* Kartu Result Terakhir & Info Periode */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                RESULT SEBELUMNYA
              </span>
              <span className="text-xs text-gray-500 font-mono">
                2D Belakang: [{lastDraw.kepala}{lastDraw.ekor}]
              </span>
            </div>
            <div className="mt-2 flex items-center space-x-2 font-mono">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 uppercase">As</span>
                <span className="w-10 h-11 bg-gray-950 border border-gray-800 rounded-lg flex items-center justify-center text-lg font-bold text-gray-400">
                  {lastDraw.as}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 uppercase">Kop</span>
                <span className="w-10 h-11 bg-gray-950 border border-gray-800 rounded-lg flex items-center justify-center text-lg font-bold text-gray-400">
                  {lastDraw.kop}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-emerald-400 font-semibold uppercase">Kepala</span>
                <span className="w-10 h-11 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-center text-lg font-bold text-emerald-400">
                  {lastDraw.kepala}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-emerald-400 font-semibold uppercase">Ekor</span>
                <span className="w-10 h-11 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-center text-lg font-bold text-emerald-400">
                  {lastDraw.ekor}
                </span>
              </div>
            </div>
          </div>

          {/* Bobot Ensemble Aktif */}
          <div className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3 text-xs">
            <div className="text-[11px] font-semibold text-gray-400 flex items-center mb-1.5">
              <BarChart2 className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              Bobot Metode Adaptif (Rolling Window):
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              {Object.entries(methodWeights).map(([name, w]) => (
                <div key={name} className="flex justify-between text-gray-400">
                  <span>{name}:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {w.toFixed(1)}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Kiri AI (3-6), Kanan BBFS (6-9) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL ANGKA IKUT (AI 3 - 6) */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800/80 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    ANGKA IKUT (AI) ADAPTIF 2D
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Minimal 1 digit diproyeksikan hadir di Kepala atau Ekor
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { size: 3, label: 'AI-3 (Ketat)', baseline: '51%', desc: '3 Digit Teratas' },
                { size: 4, label: 'AI-4 (Utama)', baseline: '64%', desc: 'Rekomendasi Komunitas' },
                { size: 5, label: 'AI-5 (Moderat)', baseline: '75%', desc: 'Cakupan Sedang' },
                { size: 6, label: 'AI-6 (Aman)', baseline: '84%', desc: 'Peluang Tembus Tinggi' }
              ].map(({ size, label, baseline, desc }) => {
                const digits = ai[size as keyof typeof ai];
                const digitStr = digits.join(' ');
                const isCopied = copiedKey === `ai-${size}`;

                return (
                  <div
                    key={size}
                    className={`p-3 rounded-xl border transition-all ${
                      size === 4
                        ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                        : 'bg-gray-950/50 border-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold ${size === 4 ? 'text-cyan-400' : 'text-gray-300'}`}>
                          {label}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {desc}
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 font-mono text-gray-400">
                        Teoretis: {baseline}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        {digits.map((d, i) => (
                          <span
                            key={i}
                            className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-sm ${
                              size === 4
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-gray-800 text-white'
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleCopy(digitStr, `ai-${size}`)}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs flex items-center space-x-1 transition-colors"
                        title="Salin Angka"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL BBFS (6 - 9 DIGIT) */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800/80 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      BBFS 2D BELAKANG (BOLAK BALIK)
                    </h3>
                    <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                      Engine Pasangan 2D
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Optimasi joint-pair coverage & matriks afinitas (independen dari AI)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { size: 6, label: 'BBFS-6', lines: 30, baseline: '30%', color: 'border-purple-500/30' },
                { size: 7, label: 'BBFS-7', lines: 42, baseline: '42%', color: 'border-purple-500/40 bg-purple-950/20' },
                { size: 8, label: 'BBFS-8', lines: 56, baseline: '56%', color: 'border-gray-800/80' },
                { size: 9, label: 'BBFS-9', lines: 72, baseline: '72%', color: 'border-gray-800/80' }
              ].map(({ size, label, lines, baseline, color }) => {
                const digits = bbfs[size as keyof typeof bbfs];
                const digitStr = digits.join('');
                const isCopied = copiedKey === `bbfs-${size}`;

                return (
                  <div
                    key={size}
                    className={`p-3 rounded-xl border transition-all ${color} ${
                      size === 7 ? 'shadow-sm shadow-purple-500/10' : 'bg-gray-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-purple-300">
                          {label}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          ({lines} Line Non-Twin)
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 font-mono text-gray-400">
                        Teoretis: {baseline}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {digits.map((d, i) => (
                          <span
                            key={i}
                            className="w-6 h-6 rounded bg-purple-950/60 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-xs text-purple-200"
                          >
                            {d}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onOpenGenerator(digits, label)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center space-x-1 transition-colors shadow-sm"
                        >
                          <span>Generate 2D</span>
                        </button>

                        <button
                          onClick={() => handleCopy(digitStr, `bbfs-${size}`)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                          title="Salin Angka BBFS"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
