import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Market } from '../engine/types';
import { generatePrediction } from '../engine/adaptiveEngine';
import {
  Share2,
  Copy,
  Check,
  X,
  Search,
  CheckSquare,
  Square,
  MessageCircle,
  Send,
  Sparkles
} from 'lucide-react';

interface SharePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  markets: Market[];
}

export type PredictionType =
  | 'ai3'
  | 'ai4'
  | 'ai5'
  | 'ai6'
  | 'bbfs6'
  | 'bbfs7'
  | 'bbfs8'
  | 'bbfs9'
  | 'dead';

export type LetterCaseMode = 'uppercase' | 'lowercase' | 'original';

// Pemetaan singkatan nama pasar populer
const MARKET_SHORT_CODES: Record<string, string> = {
  'SGP | Singapore': 'SGP',
  'Hongkong Pools': 'HK',
  'Hongkong Lotto': 'HK-LOTTO',
  'Sydneypools': 'SDY',
  'Sydney Lotto': 'SD-LOTTO',
  'Bullseye': 'BULLSEYE',
  'Chinapools': 'CHINA',
  'Toto Macau 00': 'TM-00',
  'Toto Macau 13': 'TM-13',
  'Toto Macau 16': 'TM-16',
  'Toto Macau 19': 'TM-19',
  'Toto Macau 22': 'TM-22',
  'Toto Macau 23': 'TM-23',
  'North Carolina Day': 'NC-DAY',
  'North Carolina Evening': 'NC-EVE',
  'California': 'CALIFORNIA',
  'Magnum Cambodia': 'CAMBODIA',
  'Taiwan': 'TAIWAN',
  'Japan': 'JAPAN',
  'Pcso': 'PCSO',
  'Florida Midday': 'FL-MID',
  'Florida Evening': 'FL-EVE',
  'New York Midday': 'NY-MID',
  'New York Evening': 'NY-EVE',
  'Kentucky Midday': 'KY-MID',
  'Kentucky Evening': 'KY-EVE',
  'Oregon 04:00 Wib': 'OREGON-04',
  'Oregon 07:00 Wib': 'OREGON-07',
  'Oregon 10:00 Wib': 'OREGON-10',
  'Oregon 13:00 Wib': 'OREGON-13',
  'Morocco Quatro 18:00 Wib': 'MOROCCO-18',
  'Morocco Quatro 21:00 Wib': 'MOROCCO-21',
  'Morocco Quatro 23:59 Wib': 'MOROCCO-23',
  'Morocco Quatro 03:00 Wib': 'MOROCCO-03',
};

const POPULAR_MARKET_IDS = [
  'SGP | Singapore',
  'Hongkong Pools',
  'Sydneypools',
  'Bullseye',
  'Chinapools'
];

export const SharePredictionModal: React.FC<SharePredictionModalProps> = ({
  isOpen,
  onClose,
  markets
}) => {
  const [predType, setPredType] = useState<PredictionType>('ai4');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Default pilih pasar populer yang ada
    const initial = new Set<string>();
    markets.forEach((m) => {
      if (POPULAR_MARKET_IDS.includes(m.id)) {
        initial.add(m.id);
      }
    });
    if (initial.size === 0 && markets.length > 0) {
      initial.add(markets[0].id);
    }
    return initial;
  });

  const [delimiter, setDelimiter] = useState<string>('#');
  const [layout, setLayout] = useState<'inline' | 'list'>('inline');
  const [letterCase, setLetterCase] = useState<LetterCaseMode>('lowercase');
  const [nameFormat, setNameFormat] = useState<'official' | 'short'>('official');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const hasInitialized = useRef(false);

  // Sync default selection when markets load
  useEffect(() => {
    if (markets.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      const initial = new Set<string>();
      markets.forEach((m) => {
        if (POPULAR_MARKET_IDS.includes(m.id)) {
          initial.add(m.id);
        }
      });
      if (initial.size === 0) {
        initial.add(markets[0].id);
      }
      setSelectedIds(initial);
    }
  }, [markets]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter pasar berdasarkan pencarian
  const filteredMarkets = useMemo(() => {
    if (!searchQuery.trim()) return markets;
    const q = searchQuery.toLowerCase();
    return markets.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (MARKET_SHORT_CODES[m.name] || '').toLowerCase().includes(q)
    );
  }, [markets, searchQuery]);

  // Pre-generate / cache kalkulasi prediksi hanya untuk pasar yang dipilih / aktif
  const predictionsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof generatePrediction>>();
    if (!isOpen) return map; // Jangan kalkulasi berat jika modal tertutup

    markets.forEach((m) => {
      if (!selectedIds.has(m.id)) return;
      const historyStr = m.history_data || '';
      const history4D = historyStr
        .trim()
        .split(/\s+/)
        .filter((r) => r.length === 4 && /^\d{4}$/.test(r));
      if (history4D.length >= 10) {
        try {
          map.set(m.id, generatePrediction(history4D));
        } catch (err) {
          console.error('Failed to generate prediction for', m.name, err);
        }
      }
    });
    return map;
  }, [markets, selectedIds, isOpen]);

  // Ekstrak digit sesuai jenis prediksi
  const getDigitsForType = (
    pred: ReturnType<typeof generatePrediction>,
    type: PredictionType
  ): string => {
    if (!pred) return '';
    switch (type) {
      case 'ai3':
        return pred.ai[3].join('');
      case 'ai4':
        return pred.ai[4].join('');
      case 'ai5':
        return pred.ai[5].join('');
      case 'ai6':
        return pred.ai[6].join('');
      case 'bbfs6':
        return pred.bbfs[6].join('');
      case 'bbfs7':
        return pred.bbfs[7].join('');
      case 'bbfs8':
        return pred.bbfs[8].join('');
      case 'bbfs9':
        return pred.bbfs[9].join('');
      case 'dead':
        return pred.deadDigits.join('');
      default:
        return pred.ai[4].join('');
    }
  };

  // Format label jenis prediksi
  const getPredTypeLabel = (type: PredictionType, lower: boolean): string => {
    let label = '';
    switch (type) {
      case 'ai3':
        label = 'ai 3';
        break;
      case 'ai4':
        label = 'ai 4';
        break;
      case 'ai5':
        label = 'ai 5';
        break;
      case 'ai6':
        label = 'ai 6';
        break;
      case 'bbfs6':
        label = 'bbfs 6';
        break;
      case 'bbfs7':
        label = 'bbfs 7';
        break;
      case 'bbfs8':
        label = 'bbfs 8';
        break;
      case 'bbfs9':
        label = 'bbfs 9';
        break;
      case 'dead':
        label = 'angka mati';
        break;
    }
    return lower ? label.toLowerCase() : label.toUpperCase();
  };

  // Buat output teks prediksi
  const generatedText = useMemo(() => {
    const selectedList = markets.filter((m) => selectedIds.has(m.id));
    if (selectedList.length === 0) {
      return '(Pilih minimal satu pasaran di bawah)';
    }

    const isUpper = letterCase === 'uppercase';
    const isLower = letterCase === 'lowercase';
    const typePrefix = getPredTypeLabel(predType, !isUpper);

    const items = selectedList.map((m) => {
      let code =
        nameFormat === 'official'
          ? m.name
          : MARKET_SHORT_CODES[m.name] || m.name.replace(/\s+POOLS$/i, '').trim();

      if (isLower) {
        code = code.toLowerCase();
      } else if (isUpper) {
        code = code.toUpperCase();
      }

      const pred = predictionsMap.get(m.id);
      const digits = getDigitsForType(pred || null, predType) || '----';
      return `${code} ${delimiter} ${digits}`;
    });

    if (layout === 'inline') {
      return `${typePrefix} ${items.join(' ')}`;
    } else {
      const banner = isUpper
        ? `🔥 PREDIKSI ${typePrefix.toUpperCase()} VORTEX 2D 🔥`
        : isLower
        ? `🔥 prediksi ${typePrefix.toLowerCase()} vortex 2d 🔥`
        : `🔥 Prediksi ${typePrefix} Vortex 2D 🔥`;
      return `${banner}\n` + items.join('\n');
    }
  }, [markets, selectedIds, predType, delimiter, layout, letterCase, nameFormat, predictionsMap]);

  const toggleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(new Set(markets.map((m) => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const selectPopular = () => {
    const next = new Set<string>();
    markets.forEach((m) => {
      if (POPULAR_MARKET_IDS.includes(m.id)) next.add(m.id);
    });
    setSelectedIds(next);
  };

  const toggleMarket = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedText)}`;
    window.open(url, '_blank');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(generatedText)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                Bagikan Prediksi Multi-Pasaran
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih format & pasaran untuk ekspor instan ke WhatsApp atau Telegram
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* 1. Pilih Jenis Prediksi */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>1. Format Prediksi:</span>
              <span className="text-[11px] text-cyan-400 font-mono font-medium">
                Aktif: {predType.toUpperCase()}
              </span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'ai3', label: 'AI 3' },
                { id: 'ai4', label: 'AI 4 (Utama)', star: true },
                { id: 'ai5', label: 'AI 5' },
                { id: 'ai6', label: 'AI 6' },
                { id: 'bbfs6', label: 'BBFS 6' },
                { id: 'bbfs7', label: 'BBFS 7 (Best)', star: true },
                { id: 'bbfs8', label: 'BBFS 8' },
                { id: 'bbfs9', label: 'BBFS 9' },
                { id: 'dead', label: 'Angka Mati' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPredType(item.id as PredictionType)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center relative ${
                    predType === item.id
                      ? 'bg-cyan-500 text-slate-950 font-semibold border-cyan-400 shadow-sm'
                      : 'bg-slate-950/70 border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20'
                  }`}
                >
                  {item.label}
                  {item.star && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Format Teks & Separator */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/[0.06] space-y-3">
            <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Kustomisasi Format Output:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Layout Mode */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Tata Letak:</span>
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-white/[0.08]">
                  <button
                    onClick={() => setLayout('inline')}
                    className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${
                      layout === 'inline'
                        ? 'bg-white/[0.1] text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Inline (1 Baris)
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${
                      layout === 'list'
                        ? 'bg-white/[0.1] text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    List (Per Baris)
                  </button>
                </div>
              </div>

              {/* Format Nama Pasaran */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Format Nama:</span>
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-white/[0.08]">
                  <button
                    onClick={() => setNameFormat('official')}
                    className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${
                      nameFormat === 'official'
                        ? 'bg-white/[0.1] text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Nama Asli
                  </button>
                  <button
                    onClick={() => setNameFormat('short')}
                    className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${
                      nameFormat === 'short'
                        ? 'bg-white/[0.1] text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kode Singkat
                  </button>
                </div>
              </div>

              {/* Separator / Delimiter */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Pemisah Angka:</span>
                <div className="flex space-x-1.5">
                  {['#', ':', '-', '='].map((sep) => (
                    <button
                      key={sep}
                      onClick={() => setDelimiter(sep)}
                      className={`flex-1 py-1 font-mono font-medium text-xs rounded-lg border transition-colors ${
                        delimiter === sep
                          ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 font-semibold'
                          : 'bg-slate-900/80 border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      {sep}
                    </button>
                  ))}
                </div>
              </div>

              {/* Huruf Kecil vs Besar vs Asli */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Format Huruf:</span>
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-white/[0.08]">
                  <button
                    onClick={() => setLetterCase('lowercase')}
                    className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${
                      letterCase === 'lowercase'
                        ? 'bg-white/[0.1] text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    kecil
                  </button>
                  <button
                    onClick={() => setLetterCase('uppercase')}
                    className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${
                      letterCase === 'uppercase'
                        ? 'bg-white/[0.1] text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    KAPITAL
                  </button>
                  <button
                    onClick={() => setLetterCase('original')}
                    className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${
                      letterCase === 'original'
                        ? 'bg-white/[0.1] text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Asli
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Tandai Pasaran */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <span>3. Tandai Pasaran:</span>
                <span className="text-xs font-mono font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  {selectedIds.size} terpilih
                </span>
              </label>

              {/* Tombol Cepat */}
              <div className="flex items-center space-x-1.5 text-[11px]">
                <button
                  onClick={selectPopular}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-white/[0.06]"
                >
                  Top 5 Populer
                </button>
                <button
                  onClick={() => toggleSelectAll(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-white/[0.06]"
                >
                  Semua ({markets.length})
                </button>
                <button
                  onClick={() => toggleSelectAll(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-rose-300 transition-colors border border-white/[0.06]"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Input Filter Pasaran */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pasaran (misal: SGP, HK, BULLSEYE, dll)..."
                className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>

            {/* Grid Checkbox Pasaran */}
            <div className="max-h-56 overflow-y-auto p-2 rounded-xl bg-slate-950/80 border border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredMarkets.map((m) => {
                const isSelected = selectedIds.has(m.id);
                const shortCode =
                  MARKET_SHORT_CODES[m.name] || m.name.replace(/\s+POOLS$/i, '').trim();

                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMarket(m.id)}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-cyan-500/[0.08] border-cyan-500/30 text-cyan-200 font-medium'
                        : 'bg-slate-900/60 border-white/[0.06] text-slate-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <span className="truncate text-xs text-slate-200">
                        {m.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 ml-2 px-1.5 py-0.5 bg-slate-800/80 rounded shrink-0 border border-white/[0.06]">
                        {shortCode}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Live Output Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hasil Format Prediksi:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {generatedText.length} karakter
              </span>
            </div>

            <div className="relative">
              <textarea
                readOnly
                rows={layout === 'inline' ? 3 : 6}
                value={generatedText}
                className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 text-xs font-mono font-medium text-emerald-400 leading-relaxed focus:outline-none resize-none selection:bg-emerald-500/30 selection:text-white shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.06] bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            Siap disalin atau langsung diteruskan ke WhatsApp & Telegram
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-1.5 transition-colors"
              title="Kirim ke WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleShareTelegram}
              className="px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-medium flex items-center space-x-1.5 transition-colors"
              title="Kirim ke Telegram"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Telegram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
