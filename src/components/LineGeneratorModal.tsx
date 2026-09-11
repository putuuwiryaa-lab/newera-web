import React, { useState, useEffect, useMemo } from 'react';
import {
  generate2DLines,
  formatLines,
  generateSmartTrim,
  generateSniperTrim,
  generateWheelingSystem
} from '../engine/generator';
import type { PaitoMacroPrediction, PolaTarungPrediction } from '../engine/types';
import {
  X,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Bomb,
  Shield,
  Sparkles,
  Target,
  Swords,
  Coins,
  Receipt
} from 'lucide-react';

interface LineGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  digits: number[];
  tierName: string;
  initialMode?: 'full' | 'trimmer' | 'sniper' | 'tarung' | 'wheeling';
  paitoPrediction?: PaitoMacroPrediction | null;
  polaTarung?: PolaTarungPrediction | null;
}

export const LineGeneratorModal: React.FC<LineGeneratorModalProps> = ({
  isOpen,
  onClose,
  digits,
  tierName,
  initialMode = 'full',
  paitoPrediction,
  polaTarung
}) => {
  const [userMode, setUserMode] = useState<'full' | 'trimmer' | 'sniper' | 'tarung' | 'wheeling' | null>(null);
  const mode = userMode ?? initialMode;
  const [includeTwins, setIncludeTwins] = useState(false);
  const [delimiter, setDelimiter] = useState<'space' | 'comma' | 'newline'>('space');
  const [betSuffix, setBetSuffix] = useState<string>(''); // '', '*1000', '*500', '*2000', '*1'
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [wheelSubTab, setWheelSubTab] = useState<'3d_smart' | '3d_full' | '4d_smart' | '4d_full'>('3d_smart');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sniper Paito Trimmer
  const sniper = useMemo(() => {
    if (!paitoPrediction) return null;
    return generateSniperTrim(digits, paitoPrediction, includeTwins);
  }, [digits, paitoPrediction, includeTwins]);

  // Wheeling System
  const wheeling = useMemo(() => {
    return generateWheelingSystem(digits);
  }, [digits]);

  // Helper pemformat baris dengan bet suffix
  const formatWithBet = (rawLines: string[]) => {
    if (!betSuffix) return formatLines(rawLines, delimiter);
    const suffixed = rawLines.map((l) => `${l}${betSuffix}`);
    return formatLines(suffixed, delimiter);
  };

  if (!isOpen) return null;

  const lines = generate2DLines(digits, includeTwins);
  const formattedFullText = formatWithBet(lines);

  // Smart Trimmer
  const trimmed = generateSmartTrim(digits);
  const top10Text = formatWithBet(trimmed.top10);
  const medium15Text = formatWithBet(trimmed.medium15);
  const cadanganText = formatWithBet(trimmed.cadangan);

  const sniperTopText = sniper ? formatWithBet(sniper.sniperTop) : '';
  const superSniperText = sniper?.superSniperShio ? formatWithBet(sniper.superSniperShio) : '';
  const sniperSecText = sniper ? formatWithBet(sniper.sniperSecondary) : '';

  const tarung3x3Text = polaTarung ? formatWithBet(polaTarung.tarung3x3) : '';
  const tarung4x4Text = polaTarung ? formatWithBet(polaTarung.tarung4x4) : '';
  const tarung5x5Text = polaTarung ? formatWithBet(polaTarung.tarung5x5) : '';

  // Wheeling Formats
  const wheel3DText = formatWithBet(wheeling.wheel3D);
  const wheel3DFullText = formatWithBet(wheeling.wheel3DFull);
  const wheel4DText = formatWithBet(wheeling.wheel4D);
  const wheel4DFullText = formatWithBet(wheeling.wheel4DFull);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Salin Format Slip WAP (2D*1000*01,23,45#)
  const handleCopyWap = (rawLines: string[], gameType: '2D' | '3D' | '4D') => {
    const betVal = betSuffix ? betSuffix.replace('*', '') : '1000';
    const wapStr = `${gameType}*${betVal}*${rawLines.join(',')}#`;
    navigator.clipboard.writeText(wapStr);
    setCopiedKey('wap-slip');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel bg-slate-900/95 border border-white/[0.1] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-slate-950/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-400 font-mono font-semibold text-xs px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                {tierName}
              </span>
              <h3 className="font-semibold text-white text-base">
                Generator & Pemangkas Line BBFS
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Digit Terpilih: <strong className="font-mono text-emerald-400">{digits.join(', ')}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tab */}
        <div className="flex flex-wrap border-b border-white/[0.06] bg-slate-950/80 p-1 gap-1">
          <button
            onClick={() => setUserMode('full')}
            className={`flex-1 min-w-[75px] py-2 text-xs font-medium rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'full'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Penuh ({lines.length})</span>
          </button>

          <button
            onClick={() => setUserMode('trimmer')}
            className={`flex-1 min-w-[75px] py-2 text-xs font-medium rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'trimmer'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bomb className="w-3.5 h-3.5 text-amber-300" />
            <span>Smart Trim</span>
          </button>

          {paitoPrediction && (
            <button
              onClick={() => setUserMode('sniper')}
              className={`flex-1 min-w-[75px] py-2 text-xs font-medium rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                mode === 'sniper'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-cyan-200" />
              <span>Sniper</span>
            </button>
          )}

          {polaTarung && (
            <button
              onClick={() => setUserMode('tarung')}
              className={`flex-1 min-w-[75px] py-2 text-xs font-medium rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                mode === 'tarung'
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-rose-200" />
              <span>Pola Tarung</span>
            </button>
          )}

          <button
            onClick={() => setUserMode('wheeling')}
            className={`flex-1 min-w-[95px] py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'wheeling'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-sm'
                : 'text-amber-300 hover:text-amber-200 bg-amber-950/30 border border-amber-500/20'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>🎡 Wheeling 3D/4D</span>
          </button>
        </div>

        {/* Controls Bar: Pemformat Delimiter & Format Bet BO */}
        <div className="p-3 bg-slate-950/50 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {mode === 'full' ? (
            <button
              onClick={() => setIncludeTwins(!includeTwins)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                includeTwins
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                  : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
            >
              {includeTwins ? (
                <ToggleRight className="w-4 h-4 text-purple-400" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              <span>+Twin ({digits.length} line)</span>
            </button>
          ) : mode === 'wheeling' ? (
            <span className="text-amber-300 font-mono text-[11px] font-semibold">
              ★ Coverage subset kombinasi — bukan jaminan straight
            </span>
          ) : (
            <span className="text-slate-400 font-mono text-[11px]">
              2D Non-Twin Hierarkis
            </span>
          )}

          {/* Quick Format Bet BO Chips */}
          <div className="flex items-center space-x-1 bg-slate-900/80 border border-white/[0.08] p-0.5 rounded-lg">
            <span className="text-[10px] text-slate-400 px-1.5 font-medium">Bet BO:</span>
            {[
              { label: 'Polos', val: '' },
              { label: '*1rb', val: '*1000' },
              { label: '*500', val: '*500' },
              { label: '*2rb', val: '*2000' },
              { label: '*1', val: '*1' }
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => setBetSuffix(b.val)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                  betSuffix === b.val
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Delimiter */}
          <div className="flex items-center space-x-1 bg-slate-900/80 border border-white/[0.08] p-0.5 rounded-lg ml-auto">
            {(['space', 'comma', 'newline'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDelimiter(d)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  delimiter === d
                    ? 'bg-white/[0.1] text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d === 'space' ? 'Spasi' : d === 'comma' ? 'Koma' : 'Enter'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 max-h-[420px] overflow-y-auto space-y-4">
          {mode === 'full' ? (
            <div>
              <textarea
                readOnly
                value={formattedFullText}
                rows={7}
                className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 font-mono text-sm text-purple-200 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed tracking-wider"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
                <span className="text-xs text-slate-500 font-mono">
                  Total {lines.length} Line Siap Pasang {betSuffix ? `(${betSuffix})` : ''}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyWap(lines, '2D')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 transition-all border border-amber-500/30 active:scale-95"
                    title="Salin format WAP siap pasang BO: 2D*1000*01,23,45#"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'wap-slip' ? 'Slip Tersalin!' : 'Slip WAP BO'}</span>
                  </button>
                  <button
                    onClick={() => handleCopy(formattedFullText, 'full')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-purple-600/20 active:scale-95"
                  >
                    {copiedKey === 'full' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Semua ({lines.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : mode === 'trimmer' ? (
            <div className="space-y-4">
              {/* Top 10 Bom */}
              <div className="bg-emerald-500/[0.04] border border-emerald-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Bomb className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300">
                      TOP 10 LINE BOM (4 DIGIT TERKUAT)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(top10Text, 'top10')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'top10' ? (
                      <Check className="w-3 h-3 text-emerald-200" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Salin Top 10</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-emerald-300 tracking-wider border border-white/[0.04]">
                  {top10Text}
                </div>
              </div>

              {/* Medium 15 */}
              <div className="bg-cyan-500/[0.04] border border-cyan-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-300">
                      15 LINE MEDIUM (PENDUKUNG)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(medium15Text, 'med15')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'med15' ? (
                      <Check className="w-3 h-3 text-emerald-200" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Salin 15 Line</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-cyan-300 tracking-wider border border-white/[0.04]">
                  {medium15Text}
                </div>
              </div>

              {/* Cadangan */}
              {trimmed.cadangan.length > 0 && (
                <div className="bg-slate-950/50 border border-white/[0.06] rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">
                      LINE CADANGAN ({trimmed.cadangan.length} Line)
                    </span>
                    <button
                      onClick={() => handleCopy(cadanganText, 'cad')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center space-x-1 transition-all"
                    >
                      {copiedKey === 'cad' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Salin Sisa</span>
                    </button>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-slate-400 tracking-wider border border-white/[0.04]">
                    {cadanganText}
                  </div>
                </div>
              )}
            </div>
          ) : mode === 'sniper' ? (
            <div className="space-y-4">
              {/* Super Sniper Shio */}
              {sniper?.superSniperShio && sniper.superSniperShio.length > 0 && (
                <div className="bg-emerald-500/[0.08] border border-emerald-500/30 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300">
                        🐴 SUPER SNIPER SHIO 2026 ({sniper.superSniperShio.length} LINE)
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(superSniperText, 'supersniper')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                    >
                      {copiedKey === 'supersniper' ? (
                        <Check className="w-3 h-3 text-emerald-200" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Salin Super Sniper</span>
                    </button>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-emerald-300 tracking-wider border border-emerald-500/20">
                    {superSniperText}
                  </div>
                </div>
              )}

              {/* Sniper BOM */}
              <div className="bg-amber-500/[0.05] border border-amber-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Bomb className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-300">
                      🎯 SNIPER BOM ({sniper?.sniperTop.length ?? 0} LINE)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(sniperTopText, 'snipertop')}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'snipertop' ? (
                      <Check className="w-3 h-3 text-amber-200" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Salin BOM</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-amber-300 tracking-wider border border-white/[0.04]">
                  {sniperTopText || 'Tidak ada baris irisan'}
                </div>
              </div>

              {/* Sekunder */}
              {sniper && sniper.sniperSecondary.length > 0 && (
                <div className="bg-cyan-500/[0.05] border border-cyan-500/25 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-cyan-300">
                      LINE SEKUNDER ({sniper.sniperSecondary.length} Line)
                    </span>
                    <button
                      onClick={() => handleCopy(sniperSecText, 'snipersec')}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                    >
                      {copiedKey === 'snipersec' ? (
                        <Check className="w-3 h-3 text-cyan-200" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Salin Sekunder</span>
                    </button>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-cyan-300 tracking-wider border border-white/[0.04]">
                    {sniperSecText}
                  </div>
                </div>
              )}
            </div>
          ) : mode === 'tarung' ? (
            <div className="space-y-4">
              {/* 3x3 Sniper (9 Line) */}
              <div className="bg-rose-500/[0.05] border border-rose-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Swords className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-semibold text-rose-300">
                      3×3 SNIPER NUKLIR (9 LINE)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(tarung3x3Text, 'tarung3x3')}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'tarung3x3' ? <Check className="w-3 h-3 text-rose-200" /> : <Copy className="w-3 h-3" />}
                    <span>Salin 9 Line</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-rose-300 tracking-wider border border-white/[0.04]">
                  {tarung3x3Text}
                </div>
              </div>

              {/* 4x4 Rekomendasi (16 Line) */}
              <div className="bg-amber-500/[0.05] border border-amber-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-300">
                      4×4 UTAMA REKOMENDASI (16 LINE)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(tarung4x4Text, 'tarung4x4')}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'tarung4x4' ? <Check className="w-3 h-3 text-amber-200" /> : <Copy className="w-3 h-3" />}
                    <span>Salin 16 Line</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-amber-300 tracking-wider border border-white/[0.04]">
                  {tarung4x4Text}
                </div>
              </div>

              {/* 5x5 Invest (25 Line) */}
              <div className="bg-purple-500/[0.05] border border-purple-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300">
                      5×5 INVESTASI SAFETY (25 LINE)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(tarung5x5Text, 'tarung5x5')}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                  >
                    {copiedKey === 'tarung5x5' ? <Check className="w-3 h-3 text-purple-200" /> : <Copy className="w-3 h-3" />}
                    <span>Salin 25 Line</span>
                  </button>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-xs text-purple-300 tracking-wider border border-white/[0.04]">
                  {tarung5x5Text}
                </div>
              </div>
            </div>
          ) : mode === 'wheeling' ? (
            /* WHEELING 3D / 4D VIEW */
            <div className="space-y-4">
              {/* Wheeling Subtab Selector */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-white/[0.08] text-xs">
                <button
                  onClick={() => setWheelSubTab('3d_smart')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    wheelSubTab === '3d_smart'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3D Hemat (15)
                </button>
                <button
                  onClick={() => setWheelSubTab('3d_full')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    wheelSubTab === '3d_full'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3D Lengkap (35)
                </button>
                <button
                  onClick={() => setWheelSubTab('4d_smart')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    wheelSubTab === '4d_smart'
                      ? 'bg-orange-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  4D Hemat (14)
                </button>
                <button
                  onClick={() => setWheelSubTab('4d_full')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    wheelSubTab === '4d_full'
                      ? 'bg-orange-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  4D Lengkap (35)
                </button>
              </div>

              {/* Active Subtab Card */}
              {wheelSubTab === '3d_smart' && (
                <div className="bg-amber-500/[0.06] border border-amber-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-amber-300">
                        🎡 Wheel 3D Covering Design (15 Line)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {wheeling.guarantee3D}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleCopyWap(wheeling.wheel3D, '3D')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 active:scale-95"
                        title="Salin format WAP siap pasang BO"
                      >
                        Slip WAP
                      </button>
                      <button
                        onClick={() => handleCopy(wheel3DText, 'wheel3d')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-amber-500/20 active:scale-95"
                      >
                        {copiedKey === 'wheel3d' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'wheel3d' ? 'Tersalin!' : 'Salin 15 Line'}</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    rows={4}
                    value={wheel3DText}
                    className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 font-mono text-xs text-amber-200 resize-none tracking-wider"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Modal Bersih (Disc 59%): ~Rp 6.150</span>
                    <span className="text-emerald-400 font-semibold">Hemat Rp 79.950 vs BBFS Lurus</span>
                  </div>
                </div>
              )}

              {wheelSubTab === '3d_full' && (
                <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-amber-200">
                        3D Full Set Boxed C(7, 3) (35 Line)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        100% dari seluruh kombinasi 3 digit unik BBFS 7
                      </p>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleCopyWap(wheeling.wheel3DFull, '3D')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 active:scale-95"
                        title="Salin format WAP siap pasang BO"
                      >
                        Slip WAP
                      </button>
                      <button
                        onClick={() => handleCopy(wheel3DFullText, 'wheel3dfull')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md"
                      >
                        {copiedKey === 'wheel3dfull' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Salin 35 Line</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    rows={5}
                    value={wheel3DFullText}
                    className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 font-mono text-xs text-amber-300 resize-none tracking-wider"
                  />
                </div>
              )}

              {wheelSubTab === '4d_smart' && (
                <div className="bg-orange-500/[0.06] border border-orange-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-orange-300">
                        🎡 Wheel 4D Covering Design C(7, 4, 3) (14 Line)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {wheeling.guarantee4D}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleCopyWap(wheeling.wheel4D, '4D')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-300 text-xs font-semibold border border-orange-500/30 active:scale-95"
                        title="Salin format WAP siap pasang BO"
                      >
                        Slip WAP
                      </button>
                      <button
                        onClick={() => handleCopy(wheel4DText, 'wheel4d')}
                        className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-orange-500/20 active:scale-95"
                      >
                        {copiedKey === 'wheel4d' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'wheel4d' ? 'Tersalin!' : 'Salin 14 Line'}</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    rows={4}
                    value={wheel4DText}
                    className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 font-mono text-xs text-orange-200 resize-none tracking-wider"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Modal Bersih (Disc 66%): ~Rp 4.760</span>
                    <span className="text-emerald-400 font-semibold">Hemat Rp 280.840 vs BBFS Lurus</span>
                  </div>
                </div>
              )}

              {wheelSubTab === '4d_full' && (
                <div className="bg-orange-500/[0.04] border border-orange-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-orange-200">
                        4D Full Set Boxed C(7, 4) (35 Line)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        100% dari seluruh variasi 4 digit tanpa duplikasi
                      </p>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleCopyWap(wheeling.wheel4DFull, '4D')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-300 text-xs font-semibold border border-orange-500/30 active:scale-95"
                        title="Salin format WAP siap pasang BO"
                      >
                        Slip WAP
                      </button>
                      <button
                        onClick={() => handleCopy(wheel4DFullText, 'wheel4dfull')}
                        className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md"
                      >
                        {copiedKey === 'wheel4dfull' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Salin 35 Line</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    rows={5}
                    value={wheel4DFullText}
                    className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 font-mono text-xs text-orange-300 resize-none tracking-wider"
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/[0.06] bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-400">
            {betSuffix ? (
              <span className="text-amber-300">Format BO aktif: {betSuffix}</span>
            ) : (
              <span>Format BO: Polos (Tanpa Nominal)</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
