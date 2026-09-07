import React, { useState, useEffect } from 'react';
import { generate2DLines, formatLines, generateSmartTrim } from '../engine/generator';
import { X, Copy, Check, ToggleLeft, ToggleRight, Bomb, Shield, Sparkles } from 'lucide-react';

interface LineGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  digits: number[];
  tierName: string;
  initialMode?: 'full' | 'trimmer';
}

export const LineGeneratorModal: React.FC<LineGeneratorModalProps> = ({
  isOpen,
  onClose,
  digits,
  tierName,
  initialMode = 'full'
}) => {
  const [mode, setMode] = useState<'full' | 'trimmer'>(initialMode);
  const [includeTwins, setIncludeTwins] = useState(false);
  const [delimiter, setDelimiter] = useState<'space' | 'comma' | 'newline'>('space');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const lines = generate2DLines(digits, includeTwins);
  const formattedFullText = formatLines(lines, delimiter);

  // Smart Trimmer
  const trimmed = generateSmartTrim(digits);
  const top10Text = formatLines(trimmed.top10, delimiter);
  const medium15Text = formatLines(trimmed.medium15, delimiter);
  const cadanganText = formatLines(trimmed.cadangan, delimiter);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <span className="text-purple-400 font-mono">[{tierName}]</span>
              <span>Generator & Pemangkas Line 2D</span>
            </h3>
            <p className="text-xs text-gray-400">
              Digit Terpilih: <strong className="font-mono text-emerald-400">{digits.join(', ')}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tab */}
        <div className="flex border-b border-gray-800 bg-gray-950/60 p-1">
          <button
            onClick={() => setMode('full')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'full'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kombinasi Penuh ({lines.length} Line)</span>
          </button>

          <button
            onClick={() => setMode('trimmer')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'trimmer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bomb className="w-3.5 h-3.5 text-amber-300" />
            <span>Pemangkas Cerdas (Top 10 Bom & Medium)</span>
          </button>
        </div>

        {/* Controls */}
        <div className="p-3 bg-gray-950/40 border-b border-gray-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          {mode === 'full' && (
            <button
              onClick={() => setIncludeTwins(!includeTwins)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                includeTwins
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {includeTwins ? (
                <ToggleRight className="w-4 h-4 text-purple-400" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              <span>+Twin ({digits.length} line)</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-gray-900 border border-gray-800 p-0.5 rounded-lg ml-auto">
            {(['space', 'comma', 'newline'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDelimiter(d)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  delimiter === d
                    ? 'bg-gray-800 text-white font-bold'
                    : 'text-gray-400 hover:text-gray-200'
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
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 font-mono text-sm text-purple-200 focus:outline-none resize-none leading-relaxed tracking-wider"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 font-mono">
                  Total {lines.length} Line Siap Pasang
                </span>
                <button
                  onClick={() => handleCopy(formattedFullText, 'full')}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-purple-600/20"
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
          ) : (
            <div className="space-y-4">
              {/* Top 10 Bom */}
              <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Bomb className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">
                      TOP 10 LINE BOM (4 DIGIT TERKUAT)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(top10Text, 'top10')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center space-x-1"
                  >
                    {copiedKey === 'top10' ? (
                      <Check className="w-3 h-3 text-emerald-200" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Salin Top 10</span>
                  </button>
                </div>
                <div className="bg-gray-950 p-2.5 rounded-lg font-mono text-xs text-emerald-300 tracking-wider">
                  {top10Text}
                </div>
              </div>

              {/* Medium 15 */}
              <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300">
                      15 LINE MEDIUM (PENDUKUNG)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(medium15Text, 'med15')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center space-x-1"
                  >
                    {copiedKey === 'med15' ? (
                      <Check className="w-3 h-3 text-emerald-200" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Salin 15 Line</span>
                  </button>
                </div>
                <div className="bg-gray-950 p-2.5 rounded-lg font-mono text-xs text-cyan-300 tracking-wider">
                  {medium15Text}
                </div>
              </div>

              {/* Cadangan */}
              {trimmed.cadangan.length > 0 && (
                <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400">
                      LINE CADANGAN ({trimmed.cadangan.length} Line)
                    </span>
                    <button
                      onClick={() => handleCopy(cadanganText, 'cad')}
                      className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] flex items-center space-x-1"
                    >
                      {copiedKey === 'cad' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Salin Cadangan</span>
                    </button>
                  </div>
                  <div className="bg-gray-950 p-2.5 rounded-lg font-mono text-xs text-gray-400 tracking-wider">
                    {cadanganText}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 bg-gray-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
