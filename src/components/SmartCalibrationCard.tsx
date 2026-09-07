import React from 'react';
import type { CalibrationAudit } from '../engine/smartCalibrator';
import { CheckCircle2, AlertOctagon, Flame, Sliders, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface SmartCalibrationCardProps {
  audit: CalibrationAudit | null;
  marketName: string;
  mode?: 'all' | 'ai' | 'bbfs';
}

export const SmartCalibrationCard: React.FC<SmartCalibrationCardProps> = ({
  audit,
  marketName,
  mode = 'all'
}) => {
  if (!audit) return null;

  const isHitAI = audit.statusAI === 'HIT';
  const isHitBBFS = audit.statusBBFS === 'HIT';
  const isBBFSMode = mode === 'bbfs';

  const aiAudit = audit.aiAudit;
  const bbfsAudit = audit.bbfsAudit;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all shadow-xl relative overflow-hidden ${
        isBBFSMode
          ? isHitBBFS
            ? 'bg-gradient-to-r from-purple-950/30 via-gray-900 to-gray-900 border-purple-500/30 shadow-purple-500/5'
            : 'bg-gradient-to-r from-gray-950/40 via-gray-900 to-gray-900 border-gray-800 shadow-sm'
          : isHitAI
          ? 'bg-gradient-to-r from-emerald-950/30 via-gray-900 to-gray-900 border-emerald-500/30 shadow-emerald-500/5'
          : 'bg-gradient-to-r from-rose-950/30 via-gray-900 to-gray-900 border-rose-500/40 shadow-rose-500/5'
      }`}
    >
      {/* Background ambient glow */}
      <div
        className={`absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
          isBBFSMode
            ? isHitBBFS ? 'bg-purple-500/15' : 'bg-gray-500/10'
            : isHitAI ? 'bg-emerald-500/15' : 'bg-rose-500/15'
        }`}
      />

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 relative z-10">
        {/* Kolom Kiri: Status Audit & Per-Tier Freeze vs Calibrate */}
        <div className="space-y-3.5 flex-1">
          {/* Header Title & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
              AUDIT {isBBFSMode ? 'TUNING BBFS 2D' : mode === 'ai' ? 'TUNING AI ADAPTIF' : 'ENGINE KALIBRASI'} &bull; {marketName}
            </span>

            {/* Mode-specific status badge */}
            {!isBBFSMode ? (
              isHitAI ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI: HIT ({audit.hitDigits.join(' & ')})</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  <span>AI: LOSE (DIKALIBRASI)</span>
                </span>
              )
            ) : (
              isHitBBFS ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>BBFS-7: HIT (2D TEMBUS)</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700">
                  <span>BBFS-7: {audit.isTwin ? 'TWIN LOSE' : 'LOSE'}</span>
                </span>
              )
            )}

            {/* Extra badges */}
            {!isBBFSMode && audit.regime === 'HIGH_MOMENTUM' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Flame className="w-3 h-3 text-cyan-400" />
                <span>High-Momentum ({audit.streakCount}x Win)</span>
              </span>
            )}

            {isBBFSMode && bbfsAudit?.deadDigitsClean && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span>🛡️ 2 Digit Mati Bersih ({bbfsAudit.deadDigitsIsolationRate14}%)</span>
              </span>
            )}

            {isBBFSMode && bbfsAudit?.trimmerZone === 'BOM_10' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <span>🚀 Top 10 Line BOM HIT!</span>
              </span>
            )}
          </div>

          {/* Result vs Prediction Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-gray-950/80 px-3 py-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-400">Result Kemarin: </span>
              <span className="font-mono font-bold text-white tracking-wider">
                [{audit.previousDraw.kepala}{audit.previousDraw.ekor}]
              </span>
              {audit.isTwin && (
                <span className="ml-1 text-[10px] text-rose-400 font-bold">(TWIN)</span>
              )}
            </div>

            <span className="text-gray-600 font-bold">&rarr;</span>

            {!isBBFSMode ? (
              <div className="bg-gray-950/80 px-3 py-1.5 rounded-lg border border-cyan-500/30">
                <span className="text-cyan-400 font-medium">Tebakan AI-4: </span>
                <span className="font-mono font-bold text-white tracking-wider">
                  [{audit.previousPrediction.ai4.join(', ')}]
                </span>
              </div>
            ) : (
              <div className="bg-gray-950/80 px-3 py-1.5 rounded-lg border border-purple-500/30">
                <span className="text-purple-400 font-medium">Tebakan BBFS-7: </span>
                <span className="font-mono font-bold text-purple-200 tracking-wider">
                  [{audit.previousPrediction.bbfs7.join('')}]
                </span>
              </div>
            )}
          </div>

          {/* AUDIT STATUS PER-TIER (FREEZE VS KALIBRASI) */}
          <div className="bg-gray-950/80 p-3.5 rounded-xl border border-gray-800/90 shadow-inner">
            <div className="text-[11px] font-bold text-gray-300 mb-2.5 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Parameter Per-Tier: Status Zonk &rarr; Kalibrasi, Win &rarr; Freeze</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                Tuning Terpisah
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              {!isBBFSMode && aiAudit ? (
                Object.values(aiAudit.tierAudits).map((t) => {
                  const isFreeze = t.action === 'FREEZE';
                  return (
                    <div
                      key={t.size}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                        isFreeze
                          ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex flex-col">
                          <strong className="font-extrabold text-white text-sm font-mono">{t.name}</strong>
                          <span className="text-[10px] text-gray-400 font-sans">
                            {t.size === 3 ? '3 Digit Ketat' : t.size === 4 ? '4 Digit Utama' : t.size === 5 ? '5 Digit Moderat' : '6 Digit Proteksi'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isFreeze
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          }`}
                        >
                          {isFreeze ? '🔒 FREEZE' : '⚡ KALIBRASI'}
                        </span>
                      </div>
                      <div className="mt-1 pt-1.5 border-t border-gray-800/80 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className={isFreeze ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                            {isFreeze ? '✓ Status: TEMBUS' : '✗ Status: ZONK'}
                          </span>
                          <span className={isFreeze ? 'text-emerald-300 font-mono text-[9px] font-bold' : 'text-rose-300 font-mono text-[9px] font-bold'}>
                            {isFreeze ? 'Tindakan: FREEZE' : 'Tindakan: TUNE'}
                          </span>
                        </div>
                        <span className="text-gray-400 leading-tight block truncate mt-0.5" title={t.tuningDirective || t.marginalNote}>
                          {t.tuningDirective ? t.tuningDirective.replace(/^[🔒⚡]\s*/u, '') : t.marginalNote}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : bbfsAudit ? (
                Object.values(bbfsAudit.tierAudits).map((t) => {
                  const isFreeze = t.action === 'FREEZE';
                  return (
                    <div
                      key={t.size}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                        isFreeze
                          ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                          : 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex flex-col">
                          <strong className="font-extrabold text-white text-sm font-mono">{t.name}</strong>
                          <span className="text-[10px] text-gray-400 font-sans">
                            {t.size === 6 ? '6 Digit / 30 Line' : t.size === 7 ? '7 Digit / 42 Line' : t.size === 8 ? '8 Digit / 56 Line' : '9 Digit / 72 Line'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isFreeze
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          }`}
                        >
                          {isFreeze ? '🔒 FREEZE' : '⚡ KALIBRASI'}
                        </span>
                      </div>
                      <div className="mt-1 pt-1.5 border-t border-gray-800/80 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className={isFreeze ? 'text-purple-300 font-semibold' : 'text-rose-400 font-semibold'}>
                            {isFreeze ? '✓ Status: TEMBUS 2D' : '✗ Status: ZONK'}
                          </span>
                          <span className={isFreeze ? 'text-purple-200 font-mono text-[9px] font-bold' : 'text-rose-300 font-mono text-[9px] font-bold'}>
                            {isFreeze ? 'Tindakan: FREEZE' : 'Tindakan: TUNE'}
                          </span>
                        </div>
                        <span className="text-gray-400 leading-tight block truncate mt-0.5" title={t.tuningDirective || t.marginalNote}>
                          {t.tuningDirective ? t.tuningDirective.replace(/^[🔒⚡]\s*/u, '') : t.marginalNote}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : null}
            </div>
          </div>

          {/* Narasi Diagnosis */}
          <p className="text-xs text-gray-300 leading-relaxed bg-gray-950/60 p-3.5 rounded-xl border border-gray-800/80">
            {isBBFSMode && bbfsAudit
              ? bbfsAudit.diagnosis
              : aiAudit
              ? aiAudit.diagnosis
              : audit.diagnosis}
          </p>
        </div>

        {/* Kolom Kanan: Detail Tindakan Tuning Parameter & Bobot */}
        <div className="w-full lg:w-80 bg-gray-950/95 border border-gray-800 rounded-2xl p-4 text-xs shrink-0 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-200 pb-2.5 border-b border-gray-800">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>TINDAKAN TUNING PARAMETER</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                Putaran Ini
              </span>
            </div>

            {/* Rincian Parameter yang Di-Tune vs Di-Freeze */}
            {!isBBFSMode && aiAudit ? (
              (() => {
                const tunedList = Object.values(aiAudit.tierAudits).filter((t) => t.action === 'CALIBRATED');
                const frozenList = Object.values(aiAudit.tierAudits).filter((t) => t.action === 'FREEZE');

                return (
                  <div className="space-y-2 text-[11px]">
                    {/* Parameter Dikalibrasi */}
                    <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-2.5">
                      <div className="text-[10px] text-rose-300 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                        <span>⚡ Parameter Dikalibrasi (Zonk):</span>
                        <span className="font-mono font-extrabold text-rose-400">{tunedList.length} Tier</span>
                      </div>
                      {tunedList.length > 0 ? (
                        <div className="space-y-1.5 mt-1.5">
                          {tunedList.map((t) => (
                            <div key={t.size} className="flex flex-col font-mono bg-gray-950/90 p-2 rounded-lg border border-rose-500/30">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-rose-300">Parameter {t.name}</span>
                                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-bold">⚡ DIKALIBRASI</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-sans mt-0.5">
                                {t.tuningDirective || 'Ambang seleksi & bobot dikalibrasi ulang (Zonk)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Tidak ada, semua parameter AI tembus!</span>
                      )}
                    </div>

                    {/* Parameter Di-Freeze */}
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-2.5">
                      <div className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                        <span>🔒 Parameter Di-Freeze (Kunci):</span>
                        <span className="font-mono font-extrabold text-emerald-400">{frozenList.length} Tier</span>
                      </div>
                      {frozenList.length > 0 ? (
                        <div className="space-y-1.5 mt-1.5">
                          {frozenList.map((t) => (
                            <div key={t.size} className="flex flex-col font-mono bg-gray-950/90 p-2 rounded-lg border border-emerald-500/30">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-emerald-300">Parameter {t.name}</span>
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">🔒 DI-FREEZE</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-sans mt-0.5">
                                {t.tuningDirective || 'Parameter dipertahankan (Akurasi Terjaga)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Semua parameter AI zonk</span>
                      )}
                    </div>

                    {/* Penyesuaian Bobot Metode */}
                    <div className="bg-gray-900/80 p-2.5 rounded-xl border border-gray-800 space-y-1.5">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                        Penyelarasan Algoritma:
                      </span>
                      {tunedList.length > 0 && frozenList.length > 0 && (
                        <div className="text-[10px] text-cyan-300/90 bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/30 mb-2 leading-tight">
                          💡 <strong>Tuning Terisolasi:</strong> Algoritma diselaraskan khusus untuk mengoreksi <strong>{tunedList.map(t => t.name).join(', ')}</strong> (Zonk). Parameter <strong>{frozenList.map(t => t.name).join(', ')}</strong> tetap <strong>DI-FREEZE</strong>.
                        </div>
                      )}
                      {audit.penaltyApplied.length === 0 && audit.rewardApplied.length === 0 ? (
                        <div className="text-[11px] text-emerald-300 bg-emerald-950/40 px-2.5 py-2 rounded-lg border border-emerald-500/30 flex items-center justify-between">
                          <span className="flex items-center space-x-1.5 font-bold">
                            <span>🔒</span>
                            <span>Bobot Dibekukan (Freeze)</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-sans">0 Penalti &bull; Parameter Stabil</span>
                        </div>
                      ) : (
                        <>
                          {audit.rewardApplied.length > 0 && (
                            <div className="flex items-center justify-between text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                              <span className="flex items-center space-x-1">
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Reward (+35%):</span>
                              </span>
                              <span className="font-bold font-mono">{audit.rewardApplied.join(', ')}</span>
                            </div>
                          )}
                          {audit.penaltyApplied.length > 0 && (
                            <div className="flex items-center justify-between text-rose-400 bg-rose-950/30 px-2 py-1 rounded border border-rose-500/20">
                              <span className="flex items-center space-x-1">
                                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                                <span>Penalti (-35%):</span>
                              </span>
                              <span className="font-bold font-mono">{audit.penaltyApplied.join(', ')}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : isBBFSMode && bbfsAudit ? (
              (() => {
                const tunedList = Object.values(bbfsAudit.tierAudits).filter((t) => t.action === 'CALIBRATED');
                const frozenList = Object.values(bbfsAudit.tierAudits).filter((t) => t.action === 'FREEZE');

                return (
                  <div className="space-y-2 text-[11px]">
                    {/* Parameter BBFS Dikalibrasi */}
                    <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-2.5">
                      <div className="text-[10px] text-rose-300 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                        <span>⚡ Parameter Dikalibrasi (Zonk):</span>
                        <span className="font-mono font-extrabold text-rose-400">{tunedList.length} Tier</span>
                      </div>
                      {tunedList.length > 0 ? (
                        <div className="space-y-1.5 mt-1.5">
                          {tunedList.map((t) => (
                            <div key={t.size} className="flex flex-col font-mono bg-gray-950/90 p-2 rounded-lg border border-rose-500/30">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-rose-300">Parameter {t.name}</span>
                                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-bold">⚡ DIKALIBRASI</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-sans mt-0.5">
                                {t.tuningDirective || 'Kombinasi pasangan 2D dikalibrasi ulang'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Semua parameter BBFS tembus!</span>
                      )}
                    </div>

                    {/* Parameter BBFS Di-Freeze */}
                    <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-2.5">
                      <div className="text-[10px] text-purple-300 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                        <span>🔒 Parameter Di-Freeze (Kunci):</span>
                        <span className="font-mono font-extrabold text-purple-300">{frozenList.length} Tier</span>
                      </div>
                      {frozenList.length > 0 ? (
                        <div className="space-y-1.5 mt-1.5">
                          {frozenList.map((t) => (
                            <div key={t.size} className="flex flex-col font-mono bg-gray-950/90 p-2 rounded-lg border border-purple-500/30">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-purple-300">Parameter {t.name}</span>
                                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-bold">🔒 DI-FREEZE</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-sans mt-0.5">
                                {t.tuningDirective || 'Set 2D dipertahankan (Akurasi Terjaga)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Semua parameter BBFS zonk</span>
                      )}
                    </div>

                    {/* Faktor Tuning BBFS */}
                    <div className="bg-gray-900/80 p-2.5 rounded-xl border border-gray-800 space-y-1.5">
                      {tunedList.length > 0 && frozenList.length > 0 && (
                        <div className="text-[10px] text-purple-200/90 bg-purple-950/40 p-2 rounded-lg border border-purple-500/30 mb-2 leading-tight">
                          💡 <strong>Tuning Terisolasi:</strong> Matriks pasangan diselaraskan khusus untuk mengoreksi <strong>{tunedList.map(t => t.name).join(', ')}</strong>. Parameter <strong>{frozenList.map(t => t.name).join(', ')}</strong> tetap <strong>DI-FREEZE</strong>.
                        </div>
                      )}
                      <div className="flex justify-between text-gray-400">
                        <span>Reward Faktor:</span>
                        <span className="text-emerald-400 font-bold">{bbfsAudit.rewardedFactor}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Penalti Faktor:</span>
                        <span className={bbfsAudit.penalizedFactor === 'None' || bbfsAudit.penalizedFactor.includes('None') ? 'text-gray-500 font-mono' : 'text-rose-400 font-bold'}>
                          {bbfsAudit.penalizedFactor === 'None' || bbfsAudit.penalizedFactor.includes('None') ? '0 Penalti (Freeze Total)' : bbfsAudit.penalizedFactor}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400 pt-1 border-t border-gray-800">
                        <span>Dead Digits 14D:</span>
                        <span className={`font-mono font-bold ${bbfsAudit.deadDigitsClean ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {bbfsAudit.deadDigitsClean ? '🛡️ 100% Aman' : '⚠️ Bocor'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>

          {/* Rekomendasi Operasional Hari Ini */}
          <div className="mt-3 pt-2.5 border-t border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              {isBBFSMode ? 'Saran Tier BBFS Hari Ini:' : 'Saran Tier AI Hari Ini:'}
            </span>
            <span className="text-xs font-bold text-emerald-300 mt-0.5 block">
              {isBBFSMode && bbfsAudit ? bbfsAudit.recommendedTier : aiAudit ? aiAudit.recommendedTier : audit.recommendedTier}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
