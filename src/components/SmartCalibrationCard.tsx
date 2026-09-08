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
      className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-xl relative overflow-hidden backdrop-blur-md ${
        isBBFSMode
          ? isHitBBFS
            ? 'bg-slate-900/70 border-purple-500/30 shadow-purple-500/5'
            : 'bg-slate-900/70 border-white/[0.08]'
          : isHitAI
          ? 'bg-slate-900/70 border-emerald-500/30 shadow-emerald-500/5'
          : 'bg-slate-900/70 border-rose-500/30 shadow-rose-500/5'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 relative z-10">
        {/* Kolom Kiri: Status Audit & Per-Tier Freeze vs Calibrate */}
        <div className="space-y-4 flex-1">
          {/* Header Title & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/[0.08]">
              Audit {isBBFSMode ? 'Tuning BBFS 2D' : mode === 'ai' ? 'Tuning AI Adaptif' : 'Engine Kalibrasi'} &bull; {marketName}
            </span>

            {/* Mode-specific status badge */}
            {!isBBFSMode ? (
              isHitAI ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI: HIT ({audit.hitDigits.join(' & ')})</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  <span>AI: LOSE (Dikalibrasi)</span>
                </span>
              )
            ) : (
              isHitBBFS ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>BBFS-7: HIT (2D Tembus)</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-white/[0.06]">
                  <span>BBFS-7: {audit.isTwin ? 'TWIN LOSE' : 'LOSE'}</span>
                </span>
              )
            )}

            {/* Extra badges */}
            {!isBBFSMode && audit.regime === 'HIGH_MOMENTUM' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                <Flame className="w-3 h-3 text-cyan-400" />
                <span>High-Momentum ({audit.streakCount}x Win)</span>
              </span>
            )}

            {isBBFSMode && bbfsAudit?.deadDigitsClean && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <span>Digit Mati Bersih ({bbfsAudit.deadDigitsIsolationRate14}%)</span>
              </span>
            )}

            {isBBFSMode && bbfsAudit?.trimmerZone === 'BOM_10' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <span>Top 10 BOM HIT!</span>
              </span>
            )}
          </div>

          {/* Result vs Prediction Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/[0.08]">
              <span className="text-slate-400">Result Kemarin: </span>
              <span className="font-mono font-bold text-white tracking-wider">
                [{audit.previousDraw.kepala}{audit.previousDraw.ekor}]
              </span>
              {audit.isTwin && (
                <span className="ml-1 text-[10px] text-rose-400 font-medium">(TWIN)</span>
              )}
            </div>

            <span className="text-slate-500 font-bold">&rarr;</span>

            {!isBBFSMode ? (
              <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-cyan-500/30">
                <span className="text-cyan-300 font-medium">Tebakan AI-4: </span>
                <span className="font-mono font-bold text-white tracking-wider">
                  [{audit.previousPrediction.ai4.join(', ')}]
                </span>
              </div>
            ) : (
              <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-purple-500/30">
                <span className="text-purple-300 font-medium">Tebakan BBFS-7: </span>
                <span className="font-mono font-bold text-purple-200 tracking-wider">
                  [{audit.previousPrediction.bbfs7.join('')}]
                </span>
              </div>
            )}
          </div>

          {/* AUDIT STATUS PER-TIER (FREEZE VS KALIBRASI) */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/[0.08] shadow-inner">
            <div className="text-[11px] font-semibold text-slate-300 mb-2.5 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Parameter Per-Tier: Status Zonk &rarr; Kalibrasi, Win &rarr; Freeze</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium bg-slate-900 px-2 py-0.5 rounded border border-white/[0.06]">
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
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                          : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex flex-col">
                          <strong className="font-bold text-white text-sm font-mono">{t.name}</strong>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {t.size === 3 ? '3 Digit Ketat' : t.size === 4 ? '4 Digit Utama' : t.size === 5 ? '5 Digit Moderat' : '6 Digit Proteksi'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isFreeze
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isFreeze ? 'FREEZE' : 'KALIBRASI'}
                        </span>
                      </div>
                      <div className="mt-1 pt-1.5 border-t border-white/[0.06] text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className={isFreeze ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                            {isFreeze ? '✓ Tembus' : '✗ Meleset'}
                          </span>
                          <span className={isFreeze ? 'text-emerald-300 font-mono text-[9px] font-semibold' : 'text-rose-300 font-mono text-[9px] font-semibold'}>
                            {isFreeze ? 'Aksi: FREEZE' : 'Aksi: TUNE'}
                          </span>
                        </div>
                        <span className="text-slate-400 leading-tight block truncate mt-0.5" title={t.tuningDirective || t.marginalNote}>
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
                          ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                          : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex flex-col">
                          <strong className="font-bold text-white text-sm font-mono">{t.name}</strong>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {t.size === 6 ? '6 Digit / 30L' : t.size === 7 ? '7 Digit / 42L' : t.size === 8 ? '8 Digit / 56L' : '9 Digit / 72L'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isFreeze
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isFreeze ? 'FREEZE' : 'KALIBRASI'}
                        </span>
                      </div>
                      <div className="mt-1 pt-1.5 border-t border-white/[0.06] text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className={isFreeze ? 'text-purple-300 font-medium' : 'text-rose-400 font-medium'}>
                            {isFreeze ? '✓ Tembus 2D' : '✗ Meleset'}
                          </span>
                          <span className={isFreeze ? 'text-purple-200 font-mono text-[9px] font-semibold' : 'text-rose-300 font-mono text-[9px] font-semibold'}>
                            {isFreeze ? 'Aksi: FREEZE' : 'Aksi: TUNE'}
                          </span>
                        </div>
                        <span className="text-slate-400 leading-tight block truncate mt-0.5" title={t.tuningDirective || t.marginalNote}>
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
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-white/[0.06]">
            {isBBFSMode && bbfsAudit
              ? bbfsAudit.diagnosis
              : aiAudit
              ? aiAudit.diagnosis
              : audit.diagnosis}
          </p>
        </div>

        {/* Kolom Kanan: Detail Tindakan Tuning Parameter & Bobot */}
        <div className="w-full lg:w-80 bg-slate-950/95 border border-white/[0.08] rounded-2xl p-4 text-xs shrink-0 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200 pb-2.5 border-b border-white/[0.08]">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Tindakan Tuning Parameter</span>
              </span>
              <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
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
                    <div className="bg-rose-950/20 border border-rose-500/25 rounded-xl p-2.5">
                      <div className="text-[10px] text-rose-300 uppercase font-semibold tracking-wider mb-1 flex items-center justify-between">
                        <span>Parameter Dikalibrasi:</span>
                        <span className="font-mono font-bold text-rose-400">{tunedList.length} Tier</span>
                      </div>
                      {tunedList.length > 0 ? (
                        <div className="space-y-1.5 mt-1.5">
                          {tunedList.map((t) => (
                            <div key={t.size} className="flex flex-col font-mono bg-slate-900/90 p-2 rounded-lg border border-rose-500/20">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-rose-300">Parameter {t.name}</span>
                                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-semibold">DIKALIBRASI</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                                {t.tuningDirective || 'Ambang seleksi & bobot dikalibrasi ulang (Zonk)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Semua parameter AI tembus!</span>
                      )}
                    </div>

                    {/* Parameter Di-Freeze */}
                    <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-xl p-2.5">
                      <div className="text-[10px] text-emerald-300 uppercase font-semibold tracking-wider mb-1 flex items-center justify-between">
                        <span>Parameter Di-Freeze:</span>
                        <span className="font-mono font-bold text-emerald-400">{frozenList.length} Tier</span>
                      </div>
                      {frozenList.length > 0 ? (
                        <div className="space-y-1.5 mt-1.5">
                          {frozenList.map((t) => (
                            <div key={t.size} className="flex flex-col font-mono bg-slate-900/90 p-2 rounded-lg border border-emerald-500/20">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-300">Parameter {t.name}</span>
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">DI-FREEZE</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                                {t.tuningDirective || 'Parameter dipertahankan (Akurasi Terjaga)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Semua parameter AI zonk</span>
                      )}
                    </div>

                    {/* Penyesuaian Bobot Metode */}
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/[0.06] space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Penyelarasan Algoritma:
                      </span>
                      {tunedList.length > 0 && frozenList.length > 0 && (
                        <div className="text-[10px] text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/25 mb-2 leading-tight">
                          <strong>Tuning Terisolasi:</strong> Algoritma diselaraskan khusus untuk mengoreksi <strong>{tunedList.map(t => t.name).join(', ')}</strong>. Parameter <strong>{frozenList.map(t => t.name).join(', ')}</strong> tetap <strong>DI-FREEZE</strong>.
                        </div>
                      )}
                      {audit.penaltyApplied.length === 0 && audit.rewardApplied.length === 0 ? (
                        <div className="text-[11px] text-emerald-300 bg-emerald-950/30 px-2.5 py-2 rounded-lg border border-emerald-500/25 flex items-center justify-between">
                          <span className="font-semibold">Bobot Dibekukan (Freeze)</span>
                          <span className="text-[10px] text-emerald-400 font-sans">0 Penalti &bull; Stabil</span>
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
                    <div className="bg-rose-950/20 border border-rose-500/25 rounded-xl p-2.5">
                      <div className="text-[10px] text-rose-300 uppercase font-semibold tracking-wider mb-1 flex items-center justify-between">
                        <span>Parameter Dikalibrasi:</span>
                        <span className="font-mono font-bold text-rose-400">{tunedList.length} Tier</span>
                      </div>
                      {tunedList.length > 0 ? (
                        <div className="space-y-1.5 mt-1.5">
                          {tunedList.map((t) => (
                            <div key={t.size} className="flex flex-col font-mono bg-slate-900/90 p-2 rounded-lg border border-rose-500/20">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-rose-300">Parameter {t.name}</span>
                                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-semibold">DIKALIBRASI</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                                {t.tuningDirective || 'Kombinasi pasangan 2D dikalibrasi ulang'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Semua parameter BBFS tembus!</span>
                      )}
                    </div>

                    {/* Parameter BBFS Di-Freeze */}
                    <div className="bg-purple-950/20 border border-purple-500/25 rounded-xl p-2.5">
                      <div className="text-[10px] text-purple-300 uppercase font-semibold tracking-wider mb-1 flex items-center justify-between">
                        <span>Parameter Di-Freeze:</span>
                        <span className="font-mono font-bold text-purple-300">{frozenList.length} Tier</span>
                      </div>
                      {frozenList.length > 0 ? (
                        <div className="space-y-1.5 mt-1.5">
                          {frozenList.map((t) => (
                            <div key={t.size} className="flex flex-col font-mono bg-slate-900/90 p-2 rounded-lg border border-purple-500/20">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-purple-300">Parameter {t.name}</span>
                                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-semibold">DI-FREEZE</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                                {t.tuningDirective || 'Set 2D dipertahankan (Akurasi Terjaga)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Semua parameter BBFS zonk</span>
                      )}
                    </div>

                    {/* Faktor Tuning BBFS */}
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/[0.06] space-y-1.5">
                      {tunedList.length > 0 && frozenList.length > 0 && (
                        <div className="text-[10px] text-purple-200 bg-purple-950/40 p-2 rounded-lg border border-purple-500/25 mb-2 leading-tight">
                          <strong>Tuning Terisolasi:</strong> Matriks pasangan diselaraskan khusus untuk mengoreksi <strong>{tunedList.map(t => t.name).join(', ')}</strong>. Parameter <strong>{frozenList.map(t => t.name).join(', ')}</strong> tetap <strong>DI-FREEZE</strong>.
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400">
                        <span>Reward Faktor:</span>
                        <span className="text-emerald-400 font-semibold">{bbfsAudit.rewardedFactor}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Penalti Faktor:</span>
                        <span className={bbfsAudit.penalizedFactor === 'None' || bbfsAudit.penalizedFactor.includes('None') ? 'text-slate-500 font-mono' : 'text-rose-400 font-semibold'}>
                          {bbfsAudit.penalizedFactor === 'None' || bbfsAudit.penalizedFactor.includes('None') ? '0 Penalti (Freeze Total)' : bbfsAudit.penalizedFactor}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 pt-1 border-t border-white/[0.06]">
                        <span>Dead Digits 14D:</span>
                        <span className={`font-mono font-bold ${bbfsAudit.deadDigitsClean ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {bbfsAudit.deadDigitsClean ? '100% Aman' : 'Bocor'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>

          {/* Rekomendasi Operasional Hari Ini */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.08]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {isBBFSMode ? 'Saran Tier BBFS Hari Ini:' : 'Saran Tier AI Hari Ini:'}
            </span>
            <span className="text-xs font-semibold text-emerald-300 mt-0.5 block">
              {isBBFSMode && bbfsAudit ? bbfsAudit.recommendedTier : aiAudit ? aiAudit.recommendedTier : audit.recommendedTier}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
