import React from 'react';
import type { PredictionResult } from '../engine/types';
import type { CalibrationAudit } from '../engine/smartCalibrator';
import { Gauge, AlertTriangle, Skull, Scissors } from 'lucide-react';

interface MarketIntelligenceWidgetProps {
  prediction: PredictionResult | null;
  audit: CalibrationAudit | null;
  onOpenSmartTrimmer: () => void;
}

export const MarketIntelligenceWidget: React.FC<MarketIntelligenceWidgetProps> = ({
  prediction,
  audit,
  onOpenSmartTrimmer
}) => {
  if (!prediction) return null;

  const { confidenceScore, convergenceStatus, deadDigits } = prediction;
  const twinGap = audit ? audit.twinGap : 0;
  const twinAnomaly = audit ? audit.twinAnomalyLevel : 'NORMAL';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Model Confidence Score */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-300">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Tingkat Keyakinan Model</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                convergenceStatus === 'TINGGI'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : convergenceStatus === 'SEDANG'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {convergenceStatus}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {confidenceScore}%
            </span>
            <span className="text-xs text-gray-500">Konsensus 4 Metode</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden border border-gray-800/80 mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                confidenceScore >= 80
                  ? 'bg-emerald-400'
                  : confidenceScore >= 68
                  ? 'bg-cyan-400'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
        </div>

        <p className="text-[11px] text-gray-400">
          {confidenceScore >= 80
            ? 'Metode kompak menyepakati digit teratas (Konvergensi Tinggi).'
            : 'Pergerakan angka menyebar; disarankan pasang tier moderat (AI-4/5).'}
        </p>
      </div>

      {/* 2. Twin Anomaly Index (TPI) */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Indeks Anomali Twin 2D</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                twinAnomaly === 'EKSTREM'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                  : twinAnomaly === 'MENINGKAT'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {twinAnomaly}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {twinGap}
            </span>
            <span className="text-xs text-gray-500">Putaran Tanpa Twin</span>
          </div>

          <p className="text-[11px] text-gray-400">
            {twinGap >= 20
              ? '⚠️ Kemarau twin ekstrem! Probabilitas kemunculan twin melonjak tajam. Wajib sertakan twin.'
              : twinGap >= 14
              ? 'Jarak twin mulai di atas rata-rata (ekspektasi normal 1 per 10 putaran).'
              : 'Siklus angka kembar masih dalam batas probabilitas acak normal.'}
          </p>
        </div>

        <div className="mt-2 text-[11px] text-amber-400/90 font-mono">
          Rekomendasi: {twinGap >= 18 ? 'Aktifkan Opsi +Twin' : 'BBFS Non-Twin Aman'}
        </div>
      </div>

      {/* 3. Dead Digits & Smart Trimmer Action */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-300">
              <Skull className="w-4 h-4 text-rose-400" />
              <span>2 Digit Terlemah (Dead Digits)</span>
            </div>
            <span className="text-[10px] bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
              Eliminasi BBFS 2D
            </span>
          </div>

          <div className="flex items-center space-x-3 my-2">
            <div className="flex items-center space-x-2">
              {deadDigits.map((d) => (
                <span
                  key={d}
                  className="w-9 h-9 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-400 flex items-center justify-center font-mono font-extrabold text-lg line-through"
                  title="Skor afinitas pasangan 2D BBFS terendah"
                >
                  {d}
                </span>
              ))}
            </div>
            <span className="text-[11px] text-gray-400 leading-tight">
              Skor pasangan 2D terendah di matriks BBFS. Sangat aman dipangkas dari line Kepala & Ekor.
            </span>
          </div>
        </div>

        {/* Tombol Pemangkas Cerdas 2D */}
        <button
          onClick={onOpenSmartTrimmer}
          className="w-full mt-3 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-500/20"
        >
          <Scissors className="w-4 h-4" />
          <span>Buka Pemangkas Cerdas (Top 10 Line)</span>
        </button>
      </div>
    </div>
  );
};
