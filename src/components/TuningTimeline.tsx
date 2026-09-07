import React, { useState } from 'react';
import type { DayTuningLog } from '../engine/types';
import { History, RotateCcw, Award, Layers, Sparkles, ShieldCheck } from 'lucide-react';

interface TuningTimelineProps {
  logs: DayTuningLog[];
  marketName: string;
  initialMode?: 'ai' | 'bbfs';
}

export const TuningTimeline: React.FC<TuningTimelineProps> = ({
  logs,
  marketName,
  initialMode = 'ai'
}) => {
  const [activeMode, setActiveMode] = useState<'ai' | 'bbfs'>(initialMode);

  if (logs.length === 0) return null;

  // AI Metrics
  const aiHits = logs.filter((l) => l.statusAI === 'HIT').length;
  const winRateAI = Math.round((aiHits / logs.length) * 100);

  let lossCount = 0;
  let recoveryCount = 0;
  for (let i = 0; i < logs.length; i++) {
    if (logs[i].statusAI === 'LOSE') {
      lossCount++;
      if (i < logs.length - 1 && logs[i + 1].statusAI === 'HIT') {
        recoveryCount++;
      }
    }
  }
  const recoveryRate = lossCount > 0 ? Math.round((recoveryCount / lossCount) * 100) : 100;

  // BBFS Metrics
  const bbfsHits = logs.filter((l) => l.statusBBFS === 'HIT').length;
  const winRateBBFS = Math.round((bbfsHits / logs.length) * 100);
  const deadDigitsCleanCount = logs.filter((l) => l.bbfs?.deadDigitsClean ?? true).length;
  const bomHits = logs.filter((l) => l.bbfs?.trimmerZone === 'BOM_10').length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header & Sub-Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
              <span>MEMORI KALIBRASI & LOG AUTO-TUNING (7 PERIODE)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-mono">
                {marketName}
              </span>
            </h3>
            <p className="text-xs text-gray-400">
              Audit respons penyesuaian parameter per-tier & evaluasi deterministik
            </p>
          </div>
        </div>

        {/* Toggle Switcher Mode AI vs Mode BBFS */}
        <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 self-start md:self-auto">
          <button
            onClick={() => setActiveMode('ai')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'ai'
                ? 'bg-cyan-500 text-gray-950 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🎯 Tuning AI</span>
          </button>
          <button
            onClick={() => setActiveMode('bbfs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'bbfs'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>⚡ Tuning BBFS</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Skor Header Sesuai Mode */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-gray-950/60 p-3 rounded-xl border border-gray-800/80">
        <div className="text-gray-400 text-xs font-medium">
          {activeMode === 'ai' ? (
            <span>Fokus: <strong className="text-cyan-300">Peluang Marginal 1D Kepala/Ekor & 4 Metode Adaptif</strong></span>
          ) : (
            <span>Fokus: <strong className="text-purple-300">Densitas Pasangan 2D Belakang, Dead Digits & Trimmer</strong></span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeMode === 'ai' ? (
            <>
              <div className="px-2.5 py-1 bg-gray-900 border border-cyan-500/30 rounded-lg flex items-center space-x-1.5 font-mono">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-gray-400">AI-4 Hit:</span>
                <strong className="text-cyan-300">{winRateAI}% ({aiHits}/{logs.length})</strong>
              </div>
              <div className="px-2.5 py-1 bg-gray-900 border border-emerald-500/30 rounded-lg flex items-center space-x-1.5 font-mono">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-gray-400">Auto-Recovery:</span>
                <strong className="text-emerald-400">{recoveryRate}%</strong>
              </div>
            </>
          ) : (
            <>
              <div className="px-2.5 py-1 bg-gray-900 border border-purple-500/30 rounded-lg flex items-center space-x-1.5 font-mono">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-gray-400">BBFS-7 Hit:</span>
                <strong className="text-purple-300">{winRateBBFS}% ({bbfsHits}/{logs.length})</strong>
              </div>
              <div className="px-2.5 py-1 bg-gray-900 border border-emerald-500/30 rounded-lg flex items-center space-x-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-gray-400">Dead Digits Aman:</span>
                <strong className="text-emerald-400">{deadDigitsCleanCount}/{logs.length}</strong>
              </div>
              <div className="px-2.5 py-1 bg-gray-900 border border-amber-500/30 rounded-lg flex items-center space-x-1.5 font-mono">
                <span className="text-amber-400">🚀 BOM Hit:</span>
                <strong className="text-amber-300">{bomHits}x</strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid Kartu Timeline 7 Hari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {[...logs].reverse().map((log, idx) => {
          const isHitAI = log.statusAI === 'HIT';
          const isHitBBFS = log.statusBBFS === 'HIT';
          const dayLabel = idx === 0 ? 'Kemarin' : `H-${idx + 1}`;

          const isAIView = activeMode === 'ai';
          const isCardHit = isAIView ? isHitAI : isHitBBFS;

          return (
            <div
              key={log.periodIndex}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                isCardHit
                  ? isAIView
                    ? 'bg-gray-950/70 border-emerald-500/30 hover:border-emerald-500/50'
                    : 'bg-gray-950/70 border-purple-500/30 hover:border-purple-500/50'
                  : 'bg-gray-950/70 border-rose-500/30 hover:border-rose-500/50'
              }`}
            >
              <div>
                {/* Header Kartu: Day Label + Status Utama */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 font-mono">
                    {dayLabel}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isCardHit
                        ? isAIView
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-purple-500/20 text-purple-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isAIView ? (isHitAI ? 'AI: HIT' : 'AI: LOSE') : (isHitBBFS ? 'BBFS: HIT' : log.isTwin ? 'TWIN LOSE' : 'LOSE')}
                  </span>
                </div>

                {/* Result 2D */}
                <div className="my-1.5 bg-gray-900/80 p-1.5 rounded-lg border border-gray-800">
                  <div className="text-[9px] text-gray-500 uppercase font-mono">Result 2D:</div>
                  <div className="font-mono font-bold text-base text-white flex items-center justify-between">
                    <span>{log.target2D}</span>
                    {log.isTwin && (
                      <span className="text-[9px] text-rose-400 font-sans font-bold bg-rose-950/50 px-1 py-0.5 rounded">
                        TWIN
                      </span>
                    )}
                  </div>
                </div>

                {/* MODE AI: Tebakan & Status Per-Tier AI-3..6 */}
                {isAIView && (
                  <div className="space-y-1.5 my-2">
                    <div className="text-[10px] font-mono">
                      <span className="text-gray-500 text-[9px] block">AI-4 Kandidat:</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {log.predictedAI4.map((d) => {
                          const isMatch = log.hitDigits.includes(d);
                          return (
                            <span
                              key={d}
                              className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[9px] ${
                                isMatch
                                  ? 'bg-emerald-500 text-gray-950 shadow-sm'
                                  : 'bg-gray-800 text-gray-400'
                              }`}
                            >
                              {d}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Per-Tier AI (Freeze vs Calibrate) */}
                    {log.ai?.tierAudits && (
                      <div className="pt-1 border-t border-gray-800/60 space-y-0.5 text-[9px] font-mono">
                        {[3, 4, 5, 6].map((sz) => {
                          const t = log.ai.tierAudits[sz];
                          if (!t) return null;
                          const isFrozen = t.action === 'FREEZE';
                          return (
                            <div key={sz} className="flex items-center justify-between text-gray-400">
                              <span>AI-{sz}:</span>
                              <span className={isFrozen ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                                {isFrozen ? 'FREEZE' : 'CALIB'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODE BBFS: Tebakan, Dead Digits & Status Per-Tier BBFS-6..9 */}
                {!isAIView && (
                  <div className="space-y-1.5 my-2">
                    <div className="text-[10px] font-mono">
                      <span className="text-purple-400 text-[9px] block">BBFS-7 Set:</span>
                      <span className="text-purple-200 tracking-wider font-bold text-[11px]">
                        {log.predictedBBFS7.join('')}
                      </span>
                    </div>

                    {/* Status Dead Digits & Trimmer Zone */}
                    <div className="text-[9px] font-mono space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mati:</span>
                        <span className={log.bbfs?.deadDigitsClean ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                          {log.bbfs?.deadDigitsClean ? '🛡️ Aman' : '⚠️ Bocor'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Zona:</span>
                        <span className="text-purple-300 font-bold">
                          {log.bbfs?.trimmerZone || 'CADANGAN'}
                        </span>
                      </div>
                    </div>

                    {/* Status Per-Tier BBFS (Freeze vs Calibrate) */}
                    {log.bbfs?.tierAudits && (
                      <div className="pt-1 border-t border-gray-800/60 space-y-0.5 text-[9px] font-mono">
                        {[6, 7, 8, 9].map((sz) => {
                          const t = log.bbfs.tierAudits[sz];
                          if (!t) return null;
                          const isFrozen = t.action === 'FREEZE';
                          return (
                            <div key={sz} className="flex items-center justify-between text-gray-400">
                              <span>BBFS-{sz}:</span>
                              <span className={isFrozen ? 'text-purple-300 font-bold' : 'text-rose-400'}>
                                {isFrozen ? 'FREEZE' : 'CALIB'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tindakan Tuning Sesuai Mode */}
              <div className="mt-2 pt-1.5 border-t border-gray-800 text-[10px] space-y-1">
                {isAIView ? (
                  (() => {
                    const calibrated = Object.values(log.ai?.tierAudits || {})
                      .filter((t) => t.action === 'CALIBRATED')
                      .map((t) => t.name);
                    const frozen = Object.values(log.ai?.tierAudits || {})
                      .filter((t) => t.action === 'FREEZE')
                      .map((t) => t.name);

                    return (
                      <>
                        <div className="text-[9px] font-mono leading-tight space-y-0.5">
                          {calibrated.length > 0 ? (
                            <div className="text-rose-400 font-bold">
                              ⚡ Tune: {calibrated.join(', ')}
                            </div>
                          ) : (
                            <div className="text-gray-500">
                              ⚡ Tune: -
                            </div>
                          )}
                          {frozen.length > 0 && (
                            <div className="text-emerald-400 font-bold">
                              🔒 Freeze: {frozen.join(', ')}
                            </div>
                          )}
                        </div>
                        {log.penalizedMethod === 'None' || log.rewardedMethod === 'Freeze' ? (
                          <div className="text-[8px] text-emerald-400 font-mono text-center pt-1 border-t border-gray-800/60 font-semibold">
                            🔒 Bobot Freeze (Stabil)
                          </div>
                        ) : (
                          <div className="text-[8px] text-gray-400 font-mono flex items-center justify-between pt-1 border-t border-gray-800/60">
                            <span className="text-emerald-400">+{log.rewardedMethod.slice(0, 8)}</span>
                            <span className="text-rose-400">-{log.penalizedMethod.slice(0, 8)}</span>
                          </div>
                        )}
                        {log.recoveredFromPreviousLoss && (
                          <div className="mt-1 inline-block text-[8px] font-bold text-cyan-300 bg-cyan-950/60 px-1 py-0.5 rounded border border-cyan-500/30">
                            ↺ Auto-Recovery!
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  (() => {
                    const calibrated = Object.values(log.bbfs?.tierAudits || {})
                      .filter((t) => t.action === 'CALIBRATED')
                      .map((t) => t.name);
                    const frozen = Object.values(log.bbfs?.tierAudits || {})
                      .filter((t) => t.action === 'FREEZE')
                      .map((t) => t.name);

                    return (
                      <>
                        <div className="text-[9px] font-mono leading-tight space-y-0.5">
                          {calibrated.length > 0 ? (
                            <div className="text-rose-400 font-bold">
                              ⚡ Tune: {calibrated.join(', ')}
                            </div>
                          ) : (
                            <div className="text-gray-500">
                              ⚡ Tune: -
                            </div>
                          )}
                          {frozen.length > 0 && (
                            <div className="text-purple-300 font-bold">
                              🔒 Freeze: {frozen.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="text-[8px] text-gray-500 font-mono truncate pt-1 border-t border-gray-800/60">
                          {log.bbfs?.penalizedFactor === 'None' || log.bbfs?.penalizedFactor?.includes('None')
                            ? '🔒 Formasi Freeze (0 Penalti)'
                            : `+${log.bbfs?.rewardedFactor?.split(' ')[0] || 'Densitas'}`}
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
