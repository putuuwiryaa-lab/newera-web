import React, { useMemo } from 'react';
import type { PaitoMacroPrediction, HistoryItem } from '../engine/types';
import { predictPaitoMacro, computeBiji, getParity } from '../engine/paitoPredictor';
import { getShioFor2D, getShioByNumber } from '../engine/shio';
import {
  Sparkles,
  Compass,
  AlertTriangle,
  TrendingUp,
  Hash,
  Award,
  CheckCircle2,
  XCircle,
  Crown,
  Activity,
  ArrowRight,
  Zap
} from 'lucide-react';

interface PaitoPredictionCardProps {
  prediction: PaitoMacroPrediction;
  marketName: string;
  historyItems?: HistoryItem[];
}

// Representasi kombinasi 2D untuk setiap biji (0-9)
const BIJI_2D_MAP: Record<number, string[]> = {
  0: ['00'],
  1: ['01', '10', '29', '92', '38', '83', '47', '74', '56', '65'],
  2: ['02', '20', '11', '39', '93', '48', '84', '57', '75', '66'],
  3: ['03', '30', '12', '21', '49', '94', '58', '85', '67', '76'],
  4: ['04', '40', '13', '31', '22', '59', '95', '68', '86', '77'],
  5: ['05', '50', '14', '41', '23', '32', '69', '96', '78', '87'],
  6: ['06', '60', '15', '51', '24', '42', '33', '79', '97', '88'],
  7: ['07', '70', '16', '61', '25', '52', '34', '43', '89', '98'],
  8: ['08', '80', '17', '71', '26', '62', '35', '53', '44', '99'],
  9: ['09', '90', '18', '81', '27', '72', '36', '63', '45', '54']
};

export const PaitoPredictionCard: React.FC<PaitoPredictionCardProps> = ({
  prediction,
  marketName,
  historyItems
}) => {
  const {
    topBiji,
    bijiProbabilities,
    primaryParity,
    parityProbabilities,
    primaryMagnitude,
    magnitudeProbabilities,
    topShios = [1, 2, 3],
    primaryJalur = 1,
    shioProbabilities = {},
    jalurProbabilities = { 1: 0.34, 2: 0.33, 3: 0.33 },
    overdueAlerts,
    confidenceScore,
    movement
  } = prediction;

  // Verifikasi Audit Draw Kemarin
  const lastDrawAudit = useMemo(() => {
    if (!historyItems || historyItems.length < 5) return null;
    const pastItems = historyItems.slice(0, historyItems.length - 1);
    const lastItem = historyItems[historyItems.length - 1];
    const past2D: [number, number][] = pastItems.map((h) => [h.kepala, h.ekor]);
    const prevPred = predictPaitoMacro(past2D);

    const actualK = lastItem.kepala;
    const actualE = lastItem.ekor;
    const actualBiji = computeBiji(actualK, actualE);
    const actualParity = getParity(actualK, actualE);
    const actualMag = actualK * 10 + actualE >= 50 ? 'Besar' : 'Kecil';
    const actualShioInfo = getShioFor2D(actualK * 10 + actualE);

    const hitBiji = prevPred.topBiji.includes(actualBiji);
    const hitParity = actualParity === prevPred.primaryParity;
    const hitMag = actualMag === prevPred.primaryMagnitude;
    const hitShio = (prevPred.topShios || []).includes(actualShioInfo.no);
    const hitJalur = actualShioInfo.jalur === prevPred.primaryJalur;
    const hitCount = (hitBiji ? 1 : 0) + (hitParity ? 1 : 0) + (hitMag ? 1 : 0) + (hitShio ? 1 : 0);

    return {
      lastFull: lastItem.full,
      target2D: `${actualK}${actualE}`,
      actualBiji,
      actualParity,
      actualMag,
      actualShioInfo,
      predictedTopBiji: prevPred.topBiji,
      predictedParity: prevPred.primaryParity,
      predictedMag: prevPred.primaryMagnitude,
      predictedTopShios: prevPred.topShios || [],
      predictedJalur: prevPred.primaryJalur || 1,
      hitBiji,
      hitParity,
      hitMag,
      hitShio,
      hitJalur,
      hitCount
    };
  }, [historyItems]);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/[0.1] bg-slate-900/80 shadow-xl space-y-4 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-white tracking-tight">
                Prediksi Makro Paito 2D
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {marketName}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Analisis siklus Biji, Transisi Paritas 4-Kuadran, dan Shio 2026 (Tahun Kuda Api)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 font-mono">Keyakinan Model:</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>{confidenceScore}%</span>
          </span>
        </div>
      </div>

      {/* Verifikasi Audit Result Kemarin */}
      {lastDrawAudit && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-200">
                  Audit Result Kemarin ({lastDrawAudit.lastFull} &rarr; 2D: {lastDrawAudit.target2D}):
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    lastDrawAudit.hitCount === 4
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : lastDrawAudit.hitCount >= 2
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {lastDrawAudit.hitCount === 4
                    ? '🎯 4/4 HIT - STRIKE SEMPURNA'
                    : `${lastDrawAudit.hitCount}/4 ELEMEN HIT`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                <span className="flex items-center space-x-1">
                  <span>Biji {lastDrawAudit.actualBiji}:</span>
                  {lastDrawAudit.hitBiji ? (
                    <span className="text-emerald-400 font-bold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> HIT (Top 3)
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center">
                      <XCircle className="w-3 h-3 mr-0.5 inline" /> Miss
                    </span>
                  )}
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="flex items-center space-x-1">
                  <span>Pola {lastDrawAudit.actualParity}:</span>
                  {lastDrawAudit.hitParity ? (
                    <span className="text-emerald-400 font-bold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> HIT
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center">
                      <XCircle className="w-3 h-3 mr-0.5 inline" /> Miss
                    </span>
                  )}
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="flex items-center space-x-1">
                  <span>Ukuran {lastDrawAudit.actualMag}:</span>
                  {lastDrawAudit.hitMag ? (
                    <span className="text-emerald-400 font-bold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> HIT
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center">
                      <XCircle className="w-3 h-3 mr-0.5 inline" /> Miss
                    </span>
                  )}
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="flex items-center space-x-1">
                  <span>Shio {lastDrawAudit.actualShioInfo.emoji} {lastDrawAudit.actualShioInfo.name} ({lastDrawAudit.actualShioInfo.no}):</span>
                  {lastDrawAudit.hitShio ? (
                    <span className="text-emerald-400 font-bold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> HIT (Top 3)
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center">
                      <XCircle className="w-3 h-3 mr-0.5 inline" /> Miss
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 Monitor Pola Dinamika Pergerakan Kinetik */}
      {movement && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/25 shadow-lg space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>Radar Dinamika Pola Pergerakan</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Kinetic Trajectory Engine
                  </span>
                </h5>
                <p className="text-[11px] text-slate-400">
                  Kalkulasi ritme osilasi zig-zag, rotasi orbit Jalur mod 3, dan osilasi kutub Kepala-Ekor
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 font-mono">Ritme Makro:</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>{movement.magnitude.rhythmLabel}</span>
              </span>
            </div>
          </div>

          {/* 1. Jejak Lintasan 5 Result Terakhir */}
          {movement.last5Draws && movement.last5Draws.length > 0 && (
            <div>
              <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center space-x-1">
                <span>Lintasan Aliran 5 Result Terakhir:</span>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 overflow-x-auto pb-1">
                {movement.last5Draws.map((d, idx) => {
                  const isLatest = idx === movement.last5Draws.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      <div
                        className={`flex-1 min-w-[72px] p-2 rounded-xl border text-center transition-all ${
                          isLatest
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-md ring-1 ring-cyan-400/30'
                            : 'bg-slate-900/90 border-white/[0.06] text-slate-300'
                        }`}
                      >
                        <div className="text-[10px] font-mono text-slate-400 mb-0.5">
                          {isLatest ? 'Terkini' : `D-${movement.last5Draws.length - 1 - idx}`}
                        </div>
                        <div className="text-sm font-mono font-black tracking-wider text-white">
                          {d.comb2D}
                        </div>
                        <div className="text-[9px] font-mono mt-1 flex items-center justify-center space-x-1 text-slate-400">
                          <span className={d.magnitude === 'Besar' ? 'text-amber-300 font-bold' : 'text-cyan-300 font-bold'}>
                            {d.magnitude.charAt(0)}
                          </span>
                          <span>&bull;</span>
                          <span>B{d.biji}</span>
                          <span>&bull;</span>
                          <span>J{d.jalur}</span>
                        </div>
                      </div>
                      {!isLatest && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Grid Indikator Dinamika 4 Dimensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {/* Besar/Kecil Rhythm */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Pergerakan B/K</span>
                <span className="font-bold text-amber-300">{movement.magnitude.prediction}</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">
                {movement.magnitude.rhythmLabel}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Flip: {Math.round(movement.magnitude.flipRate * 100)}% &bull; Streak: {movement.magnitude.currentStreak}x {movement.magnitude.currentStreakState}
              </div>
            </div>

            {/* Paritas Partikel Kepala & Ekor */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Partikel Paritas</span>
                <span className="font-bold text-purple-300">{movement.parity.primaryParity}</span>
              </div>
              <div className="text-xs font-semibold text-slate-200">
                K: <span className="font-mono text-purple-400 font-bold">{movement.parity.kepalaOscillation}</span> &bull; E: <span className="font-mono text-cyan-400 font-bold">{movement.parity.ekorOscillation}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate" title={movement.parity.trajectoryFlow}>
                {movement.parity.trajectoryFlow}
              </div>
            </div>

            {/* Orbit Jalur & Shio */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Orbit Siklis Jalur</span>
                <span className="font-bold text-emerald-300">Jalur {movement.jalur.predictedJalur}</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">
                {movement.jalur.orbitLabel}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Ritme Shio: {movement.jalur.shioStepRhythm}
              </div>
            </div>

            {/* Biji Step Modular */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Langkah Biji 2D</span>
                <span className="font-bold text-cyan-300">Target: {movement.biji.targetBiji.join(', ')}</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">
                {movement.biji.stepLabel}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Step Δ: {movement.biji.dominantStepDelta >= 0 ? `+${movement.biji.dominantStepDelta}` : movement.biji.dominantStepDelta} mod 10
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kartu Analisis Shio 2026 (Tahun Kuda Api) */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-white/[0.08] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🐴</span>
            <div>
              <h5 className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
                <span>Analisis Shio 2026 (Tahun Kuda Api)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Fire Horse
                </span>
              </h5>
              <p className="text-[11px] text-slate-400">
                Rotasi 12 Zodiak Mundur &middot; Matriks Markov Orde-1 &middot; Trinitas Jalur Togel
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-mono">Jalur Utama:</span>
            <span
              className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs border flex items-center space-x-1 ${
                primaryJalur === 1
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : primaryJalur === 2
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
              }`}
            >
              <Crown className="w-3 h-3 mr-1 text-amber-400" />
              <span>Jalur {primaryJalur === 1 ? 'I' : primaryJalur === 2 ? 'II' : 'III'}</span>
              <span className="text-[10px] opacity-80">
                ({Math.round((jalurProbabilities[primaryJalur] || 0.33) * 100)}%)
              </span>
            </span>
          </div>
        </div>

        {/* Top 3 Shio Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topShios.map((shioNo, idx) => {
            const shioObj = getShioByNumber(shioNo);
            const prob = shioProbabilities[shioNo]
              ? Math.round(shioProbabilities[shioNo] * 100)
              : Math.round(100 / 12);
            return (
              <div
                key={shioNo}
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                  idx === 0
                    ? 'bg-amber-500/10 border-amber-500/35 ring-1 ring-amber-400/25 shadow-sm'
                    : idx === 1
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-900/60 border-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{shioObj.emoji}</span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm font-bold text-white font-mono">{shioObj.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                          {String(shioObj.no).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Jalur {shioObj.jalur === 1 ? 'I' : shioObj.jalur === 2 ? 'II' : 'III'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-amber-300">{prob}%</span>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                      {idx === 0 ? '★ Pilihan 1' : idx === 1 ? 'Pilihan 2' : 'Pilihan 3'}
                    </span>
                  </div>
                </div>

                {/* Nomor 2D Shio */}
                <div className="pt-1.5 border-t border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block mb-1">
                    Angka 2D ({shioObj.numbers.length} Line):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {shioObj.numbers.map((nStr) => (
                      <span
                        key={nStr}
                        className="px-1.5 py-0.5 rounded bg-slate-950 border border-white/[0.08] text-[10px] font-mono font-semibold text-slate-300 hover:border-amber-400/50 hover:text-white transition-colors"
                      >
                        {nStr}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Jalur Meter Bar */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/[0.04] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Distribusi Bobot Trinitas Jalur:</span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="text-amber-300">
                Jalur I: {Math.round((jalurProbabilities[1] || 0.34) * 100)}%
              </span>
              <span className="text-emerald-300">
                Jalur II: {Math.round((jalurProbabilities[2] || 0.33) * 100)}%
              </span>
              <span className="text-purple-300">
                Jalur III: {Math.round((jalurProbabilities[3] || 0.33) * 100)}%
              </span>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/[0.04]">
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${Math.round((jalurProbabilities[1] || 0.34) * 100)}%` }}
              title="Jalur I (Kuda, Kelinci, Tikus, Ayam)"
            />
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${Math.round((jalurProbabilities[2] || 0.33) * 100)}%` }}
              title="Jalur II (Ular, Harimau, Babi, Monyet)"
            />
            <div
              className="bg-purple-500 h-full transition-all"
              style={{ width: `${Math.round((jalurProbabilities[3] || 0.33) * 100)}%` }}
              title="Jalur III (Naga, Kerbau, Anjing, Kambing)"
            />
          </div>
        </div>
      </div>

      {/* 3 Grid Pillars: Biji, Ganjil-Genap, Besar-Kecil */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Pilar 1: Top 3 Biji 2D */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <span>Top 3 Biji 2D</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400">Digital Root</span>
          </div>

          <div className="flex items-center space-x-2">
            {topBiji.map((biji, rank) => {
              const prob = bijiProbabilities[biji]
                ? Math.round(bijiProbabilities[biji] * 100)
                : 15;
              return (
                <div
                  key={biji}
                  className={`flex-1 flex flex-col items-center py-2 px-1.5 rounded-xl border transition-all ${
                    rank === 0
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm'
                      : 'bg-white/[0.03] border-white/[0.08] text-slate-300'
                  }`}
                  title={`Angka 2D Biji ${biji}: ${(BIJI_2D_MAP[biji] || []).join(', ')}`}
                >
                  <span className="text-xl font-bold font-mono tracking-tight">{biji}</span>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">{prob}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                    {rank === 0 ? 'Utama' : rank === 1 ? 'Kedua' : 'Ketiga'}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            Prioritas: Biji <strong className="text-cyan-300">{topBiji[0]}</strong> memuat kombinasi{' '}
            <span className="font-mono text-slate-300 text-[10px]">
              {(BIJI_2D_MAP[topBiji[0]] || []).slice(0, 5).join(', ')}...
            </span>
          </p>
        </div>

        {/* Pilar 2: Pola Ganjil-Genap (Paritas) */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>Pola Ganjil-Genap</span>
            </span>
            <span className="text-[10px] font-mono text-purple-400">
              {movement?.parity.kepalaOscillation ? `K:${movement.parity.kepalaOscillation} • E:${movement.parity.ekorOscillation}` : '4-Kuadran'}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Kecenderungan:</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono font-bold text-xs">
                {primaryParity}
              </span>
            </div>

            {/* Mini distribution bars */}
            <div className="space-y-1 mt-2 font-mono text-[10px]">
              {(['Genap-Genap', 'Genap-Ganjil', 'Ganjil-Genap', 'Ganjil-Ganjil'] as const).map(
                (state) => {
                  const prob = Math.round((parityProbabilities[state] || 0.25) * 100);
                  const isPrimary = state === primaryParity;
                  return (
                    <div key={state} className="flex items-center justify-between">
                      <span className={isPrimary ? 'text-purple-300 font-semibold' : 'text-slate-500'}>
                        {state}
                      </span>
                      <div className="flex items-center space-x-1.5 w-24">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isPrimary ? 'bg-purple-500' : 'bg-slate-600'}`}
                            style={{ width: `${prob}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 w-7 text-right">{prob}%</span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Pilar 3: Kategori Besar-Kecil (Magnitude) */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Kategori Nilai 2D</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              {movement?.magnitude.rhythm ? `Ritme: ${movement.magnitude.rhythmLabel}` : '00-49 vs 50-99'}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Kecenderungan:</span>
              <span
                className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs border ${
                  primaryMagnitude === 'Besar'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {primaryMagnitude} ({primaryMagnitude === 'Besar' ? '50-99' : '00-49'})
              </span>
            </div>

            {/* Visual ratio bar */}
            <div className="space-y-1.5 mt-2">
              <div className="h-3 w-full bg-slate-800 rounded-lg overflow-hidden flex border border-white/[0.04]">
                <div
                  className="bg-cyan-500/70 h-full flex items-center justify-center text-[9px] font-mono font-bold text-white transition-all"
                  style={{ width: `${Math.round((magnitudeProbabilities.Kecil || 0.5) * 100)}%` }}
                >
                  Kecil {Math.round((magnitudeProbabilities.Kecil || 0.5) * 100)}%
                </div>
                <div
                  className="bg-amber-500/70 h-full flex items-center justify-center text-[9px] font-mono font-bold text-white transition-all"
                  style={{ width: `${Math.round((magnitudeProbabilities.Besar || 0.5) * 100)}%` }}
                >
                  Besar {Math.round((magnitudeProbabilities.Besar || 0.5) * 100)}%
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center font-mono">
                Rasio: {Math.round((magnitudeProbabilities.Kecil || 0.5) * 100)}% Kecil vs{' '}
                {Math.round((magnitudeProbabilities.Besar || 0.5) * 100)}% Besar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alert Banner (jika ada pola/biji yang terlambat) */}
      {overdueAlerts.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start space-x-2.5 animate-in slide-in-from-top-1">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-amber-300">Deteksi Pola Overdue (Anomali Gap):</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {overdueAlerts.map((a, idx) => (
                <span key={idx} className="mr-2">
                  <strong className="font-mono text-amber-200">{a.label}</strong> (absen {a.gap}{' '}
                  putaran)
                  {idx < overdueAlerts.length - 1 ? ',' : '.'}
                </span>
              ))}
              <span className="text-slate-400 italic">
                Waspada tekanan pembalikan rata-rata (mean-reversion rebound).
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
