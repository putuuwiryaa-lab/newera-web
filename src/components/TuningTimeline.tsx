import React, { useState } from 'react';
import type { DayTuningLog } from '../engine/types';
import { getShioByNumber } from '../engine/shio';
import {
  History,
  RotateCcw,
  Award,
  Layers,
  Sparkles,
  ShieldCheck,
  Lock,
  Sliders,
  AlertTriangle,
  Compass,
  Target,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface TuningTimelineProps {
  logs: DayTuningLog[];
  marketName: string;
  mode?: 'ai' | 'bbfs' | 'paito';
  initialMode?: 'ai' | 'bbfs' | 'paito';
  onModeChange?: (newMode: 'ai' | 'bbfs' | 'paito') => void;
}

export const TuningTimeline: React.FC<TuningTimelineProps> = ({
  logs,
  marketName,
  mode,
  initialMode = 'ai',
  onModeChange
}) => {
  const [internalMode, setInternalMode] = useState<'ai' | 'bbfs' | 'paito'>(initialMode);
  const activeMode = mode ?? internalMode;

  const handleModeChange = (nextMode: 'ai' | 'bbfs' | 'paito') => {
    setInternalMode(nextMode);
    onModeChange?.(nextMode);
  };

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

  // Paito Metrics
  const paitoHits = logs.filter((l) => (l.paito?.strikeCount ?? 0) >= 2).length;
  const paitoStrikeRate = Math.round((paitoHits / logs.length) * 100);
  const paitoBomHits = logs.filter((l) => l.paito?.sniperZone === 'BOM_SNIPER').length;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-xl space-y-4">
      {/* Header & Sub-Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Rekonstruksi Walk-Forward 7 Periode
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 font-mono border border-white/[0.08]">
                {marketName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulasi ulang dari history untuk diagnostik; bukan log production Firestore yang tersimpan
            </p>
          </div>
        </div>

        {/* Toggle Switcher Mode AI vs Mode BBFS vs Mode Paito */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/[0.08] self-start md:self-auto">
          <button
            onClick={() => handleModeChange('ai')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'ai'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tuning AI</span>
          </button>
          <button
            onClick={() => handleModeChange('bbfs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'bbfs'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tuning BBFS</span>
          </button>
          <button
            onClick={() => handleModeChange('paito')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'paito'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Audit Paito</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Skor Header Sesuai Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/50 p-3.5 rounded-xl border border-white/[0.06]">
        <div className="text-slate-400 text-xs">
          {activeMode === 'ai' ? (
            <span>Fokus Metrik: <strong className="text-cyan-300 font-medium">Peluang Marginal Kepala/Ekor & Penyetelan MWU</strong></span>
          ) : activeMode === 'bbfs' ? (
            <span>Fokus Metrik: <strong className="text-purple-300 font-medium">Densitas Pasangan 2D, Dead Digits & Efektivitas Trimmer</strong></span>
          ) : (
            <span>Fokus Metrik: <strong className="text-amber-300 font-medium">Siklus Biji 2D, Paritas 4-Kuadran & Efisiensi Sniper BOM</strong></span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeMode === 'ai' ? (
            <>
              <div className="px-2.5 py-1 bg-slate-900/80 border border-cyan-500/25 rounded-lg flex items-center space-x-1.5 font-mono text-[11px]">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">AI-4:</span>
                <strong className="text-cyan-300">{winRateAI}% ({aiHits}/{logs.length})</strong>
              </div>
              <div className="px-2.5 py-1 bg-slate-900/80 border border-emerald-500/25 rounded-lg flex items-center space-x-1.5 font-mono text-[11px]">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Auto-Recovery:</span>
                <strong className="text-emerald-400">{recoveryRate}%</strong>
              </div>
            </>
          ) : activeMode === 'bbfs' ? (
            <>
              <div className="px-2.5 py-1 bg-slate-900/80 border border-purple-500/25 rounded-lg flex items-center space-x-1.5 font-mono text-[11px]">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-400">BBFS-7:</span>
                <strong className="text-purple-300">{winRateBBFS}% ({bbfsHits}/{logs.length})</strong>
              </div>
              <div className="px-2.5 py-1 bg-slate-900/80 border border-emerald-500/25 rounded-lg flex items-center space-x-1.5 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Dead Digits:</span>
                <strong className="text-emerald-400">{deadDigitsCleanCount}/{logs.length} Bersih</strong>
              </div>
              <div className="px-2.5 py-1 bg-slate-900/80 border border-amber-500/25 rounded-lg flex items-center space-x-1.5 font-mono text-[11px]">
                <span className="text-amber-400 font-semibold">BOM Hit:</span>
                <strong className="text-amber-300">{bomHits}x</strong>
              </div>
            </>
          ) : (
            <>
              <div className="px-2.5 py-1 bg-slate-900/80 border border-amber-500/25 rounded-lg flex items-center space-x-1.5 font-mono text-[11px]">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Strike &ge;2/4:</span>
                <strong className="text-amber-300">{paitoStrikeRate}% ({paitoHits}/{logs.length})</strong>
              </div>
              <div className="px-2.5 py-1 bg-slate-900/80 border border-emerald-500/25 rounded-lg flex items-center space-x-1.5 font-mono text-[11px]">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">BOM Sniper:</span>
                <strong className="text-emerald-400">{paitoBomHits}x Tembus</strong>
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
          const isHitPaito = (log.paito?.strikeCount ?? 0) >= 2;
          const dayLabel = idx === 0 ? 'Kemarin' : `H-${idx + 1}`;

          const isAIView = activeMode === 'ai';
          const isCardHit = activeMode === 'ai' ? isHitAI : activeMode === 'bbfs' ? isHitBBFS : isHitPaito;

          return (
            <div
              key={log.periodIndex}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all backdrop-blur-sm ${
                isCardHit
                  ? activeMode === 'ai'
                    ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/50'
                    : activeMode === 'bbfs'
                    ? 'bg-slate-900/60 border-purple-500/30 hover:border-purple-500/50'
                    : 'bg-slate-900/60 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-slate-900/60 border-rose-500/25 hover:border-rose-500/40'
              }`}
            >
              <div>
                {/* Header Kartu: Day Label + Status Utama */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {dayLabel}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                      isCardHit
                        ? activeMode === 'ai'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : activeMode === 'bbfs'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {activeMode === 'ai'
                      ? (isHitAI ? 'AI: HIT' : 'AI: LOSE')
                      : activeMode === 'bbfs'
                      ? (isHitBBFS ? 'BBFS: HIT' : log.isTwin ? 'TWIN LOSE' : 'LOSE')
                      : `${log.paito?.strikeCount ?? 0}/3 HIT`}
                  </span>
                </div>

                {/* Result 2D */}
                <div className="my-1.5 bg-slate-950/70 p-2 rounded-lg border border-white/[0.06]">
                  <div className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Result 2D:</div>
                  <div className="font-mono font-bold text-base text-white flex items-center justify-between mt-0.5">
                    <span className="tracking-wider">{log.target2D}</span>
                    {log.isTwin && (
                      <span className="text-[9px] text-rose-400 font-mono font-semibold bg-rose-500/10 border border-rose-500/20 px-1 py-0.5 rounded">
                        TWIN
                      </span>
                    )}
                  </div>
                </div>

                {/* MODE AI: Tebakan & Status Per-Tier AI-3..6 */}
                {isAIView && (
                  <div className="space-y-2 my-2">
                    <div className="text-[10px] font-mono">
                      <span className="text-slate-400 text-[9px] block">AI-4 Kandidat:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {log.predictedAI4.map((d) => {
                          const isMatch = log.hitDigits.includes(d);
                          return (
                            <span
                              key={d}
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] transition-all ${
                                isMatch
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                                  : 'bg-slate-800/80 text-slate-400 border border-white/[0.04]'
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
                      <div className="pt-1.5 border-t border-white/[0.06] space-y-1 text-[9px] font-mono">
                        {[3, 4, 5, 6].map((sz) => {
                          const t = log.ai.tierAudits[sz];
                          if (!t) return null;
                          const isFrozen = t.action === 'FREEZE';
                          return (
                            <div key={sz} className="flex items-center justify-between text-slate-400">
                              <span>AI-{sz}:</span>
                              <span className={isFrozen ? 'text-emerald-400 font-semibold' : 'text-amber-400/90'}>
                                {isFrozen ? 'FREEZE' : 'TUNE'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODE BBFS: Tebakan, Dead Digits & Status Per-Tier BBFS-6..9 */}
                {activeMode === 'bbfs' && (
                  <div className="space-y-2 my-2">
                    <div className="text-[10px] font-mono">
                      <span className="text-purple-400 text-[9px] block">BBFS-7 Set:</span>
                      <span className="text-purple-200 tracking-wider font-bold text-[11px] block mt-0.5">
                        {log.predictedBBFS7.join('')}
                      </span>
                    </div>

                    {/* Status Dead Digits & Trimmer Zone */}
                    <div className="text-[9px] font-mono space-y-1 pt-1 border-t border-white/[0.06]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Dead Digits:</span>
                        <span className={log.bbfs?.deadDigitsClean ? 'text-emerald-400 font-semibold flex items-center space-x-1' : 'text-rose-400 flex items-center space-x-1'}>
                          {log.bbfs?.deadDigitsClean ? (
                            <>
                              <ShieldCheck className="w-3 h-3 inline" />
                              <span>Bersih</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 inline" />
                              <span>Bocor</span>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Zona:</span>
                        <span className="text-purple-300 font-semibold">
                          {log.bbfs?.trimmerZone || 'CADANGAN'}
                        </span>
                      </div>
                    </div>

                    {/* Status Per-Tier BBFS (Freeze vs Calibrate) */}
                    {log.bbfs?.tierAudits && (
                      <div className="pt-1.5 border-t border-white/[0.06] space-y-1 text-[9px] font-mono">
                        {[6, 7, 8, 9].map((sz) => {
                          const t = log.bbfs.tierAudits[sz];
                          if (!t) return null;
                          const isFrozen = t.action === 'FREEZE';
                          return (
                            <div key={sz} className="flex items-center justify-between text-slate-400">
                              <span>BBFS-{sz}:</span>
                              <span className={isFrozen ? 'text-purple-300 font-semibold' : 'text-amber-400/90'}>
                                {isFrozen ? 'FREEZE' : 'TUNE'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODE PAITO: Biji, Paritas, Besar/Kecil & Sniper BOM */}
                {activeMode === 'paito' && log.paito && (
                  <div className="space-y-1.5 my-2 text-[10px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Biji {log.paito.actualBiji}:</span>
                      <span className={log.paito.hitBiji ? 'text-emerald-400 font-semibold flex items-center space-x-0.5' : 'text-slate-500 flex items-center space-x-0.5'}>
                        {log.paito.hitBiji ? <CheckCircle2 className="w-3 h-3 inline text-emerald-400" /> : <XCircle className="w-3 h-3 inline text-slate-500" />}
                        <span>{log.paito.hitBiji ? 'Top 3' : 'Miss'}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Pola:</span>
                      <span className={log.paito.hitParity ? 'text-emerald-400 font-semibold flex items-center space-x-0.5' : 'text-slate-500 flex items-center space-x-0.5'}>
                        {log.paito.hitParity ? <CheckCircle2 className="w-3 h-3 inline text-emerald-400" /> : <XCircle className="w-3 h-3 inline text-slate-500" />}
                        <span>{log.paito.actualParity.split('-').map((p) => p[0]).join('')}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Ukuran:</span>
                      <span className={log.paito.hitMagnitude ? 'text-emerald-400 font-semibold flex items-center space-x-0.5' : 'text-slate-500 flex items-center space-x-0.5'}>
                        {log.paito.hitMagnitude ? <CheckCircle2 className="w-3 h-3 inline text-emerald-400" /> : <XCircle className="w-3 h-3 inline text-slate-500" />}
                        <span>{log.paito.actualMagnitude}</span>
                      </span>
                    </div>
                    {log.paito.actualShio && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">
                          {getShioByNumber(log.paito.actualShio).emoji} {getShioByNumber(log.paito.actualShio).name}:
                        </span>
                        <span className={log.paito.hitShio ? 'text-emerald-400 font-semibold flex items-center space-x-0.5' : 'text-slate-500 flex items-center space-x-0.5'}>
                          {log.paito.hitShio ? <CheckCircle2 className="w-3 h-3 inline text-emerald-400" /> : <XCircle className="w-3 h-3 inline text-slate-500" />}
                          <span>{log.paito.hitShio ? 'Top 3' : 'Miss'}</span>
                        </span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-white/[0.06] flex justify-between items-center">
                      <span className="text-slate-400">Sniper:</span>
                      <span
                        className={
                          log.paito.sniperZone === 'BOM_SNIPER'
                            ? 'text-amber-300 font-bold bg-amber-500/20 px-1 rounded'
                            : log.paito.sniperZone === 'SEKUNDER'
                            ? 'text-purple-300'
                            : 'text-slate-500'
                        }
                      >
                        {log.paito.sniperZone === 'BOM_SNIPER'
                          ? '🎯 BOM HIT'
                          : log.paito.sniperZone === 'SEKUNDER'
                          ? 'Sekunder'
                          : 'Miss'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tindakan Tuning Sesuai Mode */}
              <div className="mt-2 pt-2 border-t border-white/[0.06] text-[10px] space-y-1">
                {activeMode === 'paito' ? (
                  <div className="text-[9px] font-mono leading-tight space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Evaluasi Paito:</span>
                      <span
                        className={
                          log.paito?.strikeCount === 4
                            ? 'text-emerald-400 font-bold'
                            : (log.paito?.strikeCount ?? 0) >= 2
                            ? 'text-amber-300 font-semibold'
                            : 'text-slate-500'
                        }
                      >
                        {log.paito?.strikeCount === 4 ? 'PERFECT' : `${log.paito?.strikeCount ?? 0}/4 Hit`}
                      </span>
                    </div>
                    <div className="text-[8px] text-center pt-1 border-t border-white/[0.04] text-slate-400">
                      {log.paito?.sniperZone === 'BOM_SNIPER' ? (
                        <span className="text-amber-300 font-bold">🎯 BOM 100% TEMBUS</span>
                      ) : log.paito?.hitBiji ? (
                        <span className="text-cyan-300">Biji 2D Sesuai Siklus</span>
                      ) : (
                        <span className="text-slate-500">Pola Siklus Variatif</span>
                      )}
                    </div>
                  </div>
                ) : isAIView ? (
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
                            <div className="text-amber-400/90 font-semibold flex items-center space-x-1">
                              <Sliders className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">Tune: {calibrated.join(', ')}</span>
                            </div>
                          ) : (
                            <div className="text-slate-500">
                              Tune: -
                            </div>
                          )}
                          {frozen.length > 0 && (
                            <div className="text-emerald-400 font-semibold flex items-center space-x-1">
                              <Lock className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">Freeze: {frozen.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        {log.penalizedMethod === 'None' || log.rewardedMethod === 'Freeze' ? (
                          <div className="text-[8px] text-emerald-400/90 font-mono text-center pt-1 border-t border-white/[0.04] font-medium flex items-center justify-center space-x-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Bobot Terkunci (Stabil)</span>
                          </div>
                        ) : (
                          <div className="text-[8px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-white/[0.04]">
                            <span className="text-emerald-400 font-medium">+{log.rewardedMethod.slice(0, 8)}</span>
                            <span className="text-rose-400 font-medium">-{log.penalizedMethod.slice(0, 8)}</span>
                          </div>
                        )}
                        {log.recoveredFromPreviousLoss && (
                          <div className="mt-1 inline-flex items-center space-x-1 text-[8px] font-semibold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/25">
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Auto-Recovery</span>
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
                            <div className="text-amber-400/90 font-semibold flex items-center space-x-1">
                              <Sliders className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">Tune: {calibrated.join(', ')}</span>
                            </div>
                          ) : (
                            <div className="text-slate-500">
                              Tune: -
                            </div>
                          )}
                          {frozen.length > 0 && (
                            <div className="text-purple-300 font-semibold flex items-center space-x-1">
                              <Lock className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">Freeze: {frozen.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[8px] text-slate-400 font-mono truncate pt-1 border-t border-white/[0.04]">
                          {log.bbfs?.penalizedFactor === 'None' || log.bbfs?.penalizedFactor?.includes('None')
                            ? 'Formasi Terkunci (0 Penalti)'
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

