import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Market } from '../engine/types';
import { generatePrediction } from '../engine/adaptiveEngine';
import { mergeServerPrediction } from '../engine/serverState';
import { generateSniperTrim } from '../engine/generator';
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
  | 'dead'
  | 'super_sniper'
  | 'sniper'
  | 'shio'
  | 'paito'
  | 'tarung'
  | 'tarung_lines'
  | 'movement';

export type LetterCaseMode = 'uppercase' | 'lowercase' | 'original';

const MARKET_SHORT_CODES: Record<string, string> = {
  'SGP | Singapore': 'SGP',
  'Hongkong Pools': 'HK',
  'Hongkong Lotto': 'HK-LOTTO',
  'Sydneypools': 'SDY',
  'Sydney Lotto': 'SD-LOTTO',
  'Bullseye': 'BULLSEYE',
  'Chinapools': 'CHINA',
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
  'Mongolia': 'MONGOLIA',
  'New Mexico Day': 'NM-DAY',
  'New Mexico Eve': 'NM-EVE',
  'Nusantara Pools': 'NUSANTARA',
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
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const initial: string[] = [];
    POPULAR_MARKET_IDS.forEach((id) => {
      if (markets.some((m) => m.id === id)) initial.push(id);
    });
    if (initial.length === 0 && markets.length > 0) initial.push(markets[0].id);
    return initial;
  });

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const [delimiter, setDelimiter] = useState<string>('#');
  const [layout, setLayout] = useState<'inline' | 'list'>('inline');
  const [letterCase, setLetterCase] = useState<LetterCaseMode>('lowercase');
  const [nameFormat, setNameFormat] = useState<'official' | 'short'>('official');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (markets.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      const initial = POPULAR_MARKET_IDS.filter((id) => markets.some((m) => m.id === id));
      setSelectedIds(initial.length > 0 ? initial : [markets[0].id]);
    }
  }, [markets]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredMarkets = useMemo(() => {
    if (!searchQuery.trim()) return markets;
    const q = searchQuery.toLowerCase();
    return markets.filter(
      (m) => m.name.toLowerCase().includes(q) || (MARKET_SHORT_CODES[m.name] || '').toLowerCase().includes(q)
    );
  }, [markets, searchQuery]);

  // Penting: tier AI/BBFS production dioverlay dari Firestore next_prediction.
  // Kalkulasi lokal hanya mengisi detail paito/movement dan fallback legacy.
  const predictionsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof generatePrediction>>();
    if (!isOpen) return map;

    markets.forEach((m) => {
      if (!selectedSet.has(m.id)) return;
      const history4D = (m.history_data || '')
        .trim()
        .split(/\s+/)
        .filter((r) => r.length === 4 && /^\d{4}$/.test(r));
      if (history4D.length >= 10) {
        try {
          const local = generatePrediction(history4D);
          map.set(m.id, mergeServerPrediction(local, m.next_prediction));
        } catch (err) {
          console.error('Failed to generate prediction for', m.name, err);
        }
      }
    });
    return map;
  }, [markets, selectedSet, isOpen]);

  const getDigitsForType = (
    pred: ReturnType<typeof generatePrediction>,
    type: PredictionType
  ): string => {
    if (!pred) return '';
    switch (type) {
      case 'ai3': return pred.ai[3].join('');
      case 'ai4': return pred.ai[4].join('');
      case 'ai5': return pred.ai[5].join('');
      case 'ai6': return pred.ai[6].join('');
      case 'bbfs6': return pred.bbfs[6].join('');
      case 'bbfs7': return pred.bbfs[7].join('');
      case 'bbfs8': return pred.bbfs[8].join('');
      case 'bbfs9': return pred.bbfs[9].join('');
      case 'dead': return pred.deadDigits.join('');
      case 'super_sniper': {
        if (!pred.paitoPrediction || !pred.bbfs[7]) return '----';
        const sn = generateSniperTrim(pred.bbfs[7], pred.paitoPrediction, false);
        return sn.superSniperShio && sn.superSniperShio.length > 0 ? sn.superSniperShio.join(' ') : '----';
      }
      case 'sniper': {
        if (!pred.paitoPrediction || !pred.bbfs[7]) return '----';
        const sn = generateSniperTrim(pred.bbfs[7], pred.paitoPrediction, false);
        return sn.sniperTop.length > 0 ? sn.sniperTop.join(' ') : '----';
      }
      case 'shio': {
        if (!pred.paitoPrediction?.topShios) return '----';
        const p = pred.paitoPrediction;
        return `Shio:[${p.topShios.join(',')}] (Jalur ${p.primaryJalur})`;
      }
      case 'paito': {
        if (!pred.paitoPrediction) return '----';
        const p = pred.paitoPrediction;
        return `Biji:[${p.topBiji.join(',')}] ${p.primaryParity} (${p.primaryMagnitude})`;
      }
      case 'tarung': {
        if (!pred.polaTarung) return '----';
        return `K:[${pred.polaTarung.rankedKepala.slice(0, 4).join(',')}]*E:[${pred.polaTarung.rankedEkor.slice(0, 4).join(',')}]`;
      }
      case 'tarung_lines': {
        if (!pred.polaTarung?.tarung4x4.length) return '----';
        return pred.polaTarung.tarung4x4.join(' ');
      }
      case 'movement': {
        if (!pred.paitoPrediction?.movement) return '----';
        const mv = pred.paitoPrediction.movement;
        return `${mv.magnitude.prediction.toUpperCase()} (${mv.magnitude.rhythm}) | ${mv.parity.primaryParity} | J${mv.jalur.predictedJalur} | B${mv.biji.targetBiji[0]}`;
      }
      default: return pred.ai[4].join('');
    }
  };

  const getPredTypeLabel = (type: PredictionType, lower: boolean): string => {
    const labels: Record<PredictionType, string> = {
      ai3: 'ai 3', ai4: 'ai 4', ai5: 'ai 5', ai6: 'ai 6',
      bbfs6: 'bbfs 6', bbfs7: 'bbfs 7', bbfs8: 'bbfs 8', bbfs9: 'bbfs 9',
      dead: 'angka mati', super_sniper: 'super sniper 2d', sniper: 'bom sniper 2d',
      shio: 'shio 2026', paito: 'paito makro 2d', tarung: 'pola tarung 2d (k*e)',
      tarung_lines: 'tarung 4x4 (16 line no bb)', movement: 'dinamika gerak kinetik'
    };
    return lower ? labels[type].toLowerCase() : labels[type].toUpperCase();
  };

  const generatedText = useMemo(() => {
    const marketMap = new Map<string, Market>(markets.map((m) => [m.id, m]));
    const selectedList = selectedIds.map((id) => marketMap.get(id)).filter((m): m is Market => Boolean(m));
    if (selectedList.length === 0) return '(Pilih minimal satu pasaran di bawah)';

    const isUpper = letterCase === 'uppercase';
    const isLower = letterCase === 'lowercase';
    const typePrefix = getPredTypeLabel(predType, !isUpper);
    const items = selectedList.map((m) => {
      let code = nameFormat === 'official'
        ? m.name
        : MARKET_SHORT_CODES[m.name] || m.name.replace(/\s+POOLS$/i, '').trim();
      if (isLower) code = code.toLowerCase();
      else if (isUpper) code = code.toUpperCase();
      const digits = getDigitsForType(predictionsMap.get(m.id) || null, predType) || '----';
      return `${code} ${delimiter} ${digits}`;
    });

    if (layout === 'inline') return `${typePrefix} ${items.join(' ')}`;
    const banner = isUpper
      ? `🔥 PREDIKSI ${typePrefix.toUpperCase()} VORTEX 2D 🔥`
      : isLower
        ? `🔥 prediksi ${typePrefix.toLowerCase()} vortex 2d 🔥`
        : `🔥 Prediksi ${typePrefix} Vortex 2D 🔥`;
    return `${banner}\n${items.join('\n')}`;
  }, [markets, selectedIds, predType, delimiter, layout, letterCase, nameFormat, predictionsMap]);

  const toggleSelectAll = (select: boolean) => {
    if (select) {
      const existing = new Set(selectedIds);
      setSelectedIds([...selectedIds, ...markets.filter((m) => !existing.has(m.id)).map((m) => m.id)]);
    } else setSelectedIds([]);
  };

  const selectPopular = () => {
    setSelectedIds(POPULAR_MARKET_IDS.filter((id) => markets.some((m) => m.id === id)));
  };

  const toggleMarket = (id: string) => {
    setSelectedIds(selectedSet.has(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(generatedText)}`, '_blank');
  };

  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(generatedText)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div onClick={(e) => e.stopPropagation()} className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0"><Share2 className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold text-white text-base">Bagikan Prediksi Multi-Pasaran</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pilih format & pasaran untuk ekspor instan ke WhatsApp atau Telegram</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>1. Format Prediksi:</span>
              <span className="text-[11px] text-cyan-400 font-mono font-medium">Aktif: {predType.toUpperCase()}</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
              {[
                { id: 'ai3', label: 'AI 3' }, { id: 'ai4', label: 'AI 4 (Utama)', star: true },
                { id: 'ai5', label: 'AI 5' }, { id: 'ai6', label: 'AI 6' },
                { id: 'bbfs6', label: 'BBFS 6' }, { id: 'bbfs7', label: 'BBFS 7 (Best)', star: true },
                { id: 'bbfs8', label: 'BBFS 8' }, { id: 'bbfs9', label: 'BBFS 9' },
                { id: 'dead', label: 'Angka Mati' }, { id: 'super_sniper', label: '🐴 Super (Shio)', star: true },
                { id: 'sniper', label: '🎯 Sniper BOM', star: true }, { id: 'tarung', label: '⚔️ Tarung (K*E)', star: true },
                { id: 'tarung_lines', label: '⚔️ Tarung 16L', star: true }, { id: 'movement', label: '🚀 Pola Gerak' },
                { id: 'shio', label: '🐴 Shio 2026' }, { id: 'paito', label: 'Paito Makro' }
              ].map((item) => (
                <button key={item.id} onClick={() => setPredType(item.id as PredictionType)} className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center relative ${predType === item.id ? 'bg-cyan-500 text-slate-950 font-semibold border-cyan-400 shadow-sm' : 'bg-slate-950/70 border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20'}`}>
                  {item.label}{item.star && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/[0.06] space-y-3">
            <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">2. Kustomisasi Format Output:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Tata Letak:</span>
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-white/[0.08]">
                  <button onClick={() => setLayout('inline')} className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${layout === 'inline' ? 'bg-white/[0.1] text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}>Inline (1 Baris)</button>
                  <button onClick={() => setLayout('list')} className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${layout === 'list' ? 'bg-white/[0.1] text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}>List (Per Baris)</button>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Format Nama:</span>
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-white/[0.08]">
                  <button onClick={() => setNameFormat('official')} className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${nameFormat === 'official' ? 'bg-white/[0.1] text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}>Nama Asli</button>
                  <button onClick={() => setNameFormat('short')} className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${nameFormat === 'short' ? 'bg-white/[0.1] text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}>Kode Singkat</button>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Pemisah Angka:</span>
                <div className="flex space-x-1.5">
                  {['#', ':', '-', '='].map((sep) => <button key={sep} onClick={() => setDelimiter(sep)} className={`flex-1 py-1 font-mono font-medium text-xs rounded-lg border transition-colors ${delimiter === sep ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 font-semibold' : 'bg-slate-900/80 border-white/[0.08] text-slate-400 hover:text-white'}`}>{sep}</button>)}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Format Huruf:</span>
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-white/[0.08]">
                  <button onClick={() => setLetterCase('lowercase')} className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${letterCase === 'lowercase' ? 'bg-white/[0.1] text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}>kecil</button>
                  <button onClick={() => setLetterCase('uppercase')} className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${letterCase === 'uppercase' ? 'bg-white/[0.1] text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}>KAPITAL</button>
                  <button onClick={() => setLetterCase('original')} className={`flex-1 py-1 rounded font-medium text-[11px] transition-colors ${letterCase === 'original' ? 'bg-white/[0.1] text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}>Asli</button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <span>3. Tandai Pasaran:</span>
                <span className="text-xs font-mono font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">{selectedIds.length} terpilih</span>
                <span className="text-[10px] text-cyan-300/70 font-normal normal-case hidden sm:inline">(Urutan salin sesuai urutan centang)</span>
              </label>
              <div className="flex items-center space-x-1.5 text-[11px]">
                <button onClick={selectPopular} className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-white/[0.06]">Top 5 Populer</button>
                <button onClick={() => toggleSelectAll(true)} className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-white/[0.06]">Semua ({markets.length})</button>
                <button onClick={() => toggleSelectAll(false)} className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-rose-300 transition-colors border border-white/[0.06]">Kosongkan</button>
              </div>
            </div>

            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari pasaran (misal: SGP, HK, BULLSEYE, dll)..." className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
            </div>

            <div className="max-h-56 overflow-y-auto p-2 rounded-xl bg-slate-950/80 border border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredMarkets.map((m) => {
                const isSelected = selectedSet.has(m.id);
                const orderIndex = isSelected ? selectedIds.indexOf(m.id) : -1;
                const shortCode = MARKET_SHORT_CODES[m.name] || m.name.replace(/\s+POOLS$/i, '').trim();
                return (
                  <button key={m.id} onClick={() => toggleMarket(m.id)} className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg border text-left text-xs transition-all ${isSelected ? 'bg-cyan-500/[0.08] border-cyan-500/30 text-cyan-200 font-medium' : 'bg-slate-900/60 border-white/[0.06] text-slate-300 hover:border-white/20 hover:text-white'}`}>
                    {isSelected ? <div className="flex items-center space-x-1.5 shrink-0"><CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" /><span className="min-w-4 h-4 px-1 rounded bg-cyan-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">{orderIndex + 1}</span></div> : <Square className="w-4 h-4 text-slate-600 shrink-0" />}
                    <div className="flex-1 min-w-0 flex items-center justify-between"><span className="truncate text-xs text-slate-200">{m.name}</span><span className="text-[10px] font-mono text-slate-400 ml-2 px-1.5 py-0.5 bg-slate-800/80 rounded shrink-0 border border-white/[0.06]">{shortCode}</span></div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /><span>Hasil Format Prediksi:</span></span>
              <span className="text-[10px] text-slate-500 font-mono">{generatedText.length} karakter</span>
            </div>
            <textarea readOnly rows={layout === 'inline' ? 3 : 6} value={generatedText} className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 text-xs font-mono font-medium text-emerald-400 leading-relaxed focus:outline-none resize-none selection:bg-emerald-500/30 selection:text-white shadow-inner" />
          </div>
        </div>

        <div className="p-4 border-t border-white/[0.06] bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">Siap disalin atau langsung diteruskan ke WhatsApp & Telegram</div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button onClick={handleCopy} className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95">
              {isCopied ? <><Check className="w-4 h-4 text-slate-950" /><span>Tersalin!</span></> : <><Copy className="w-4 h-4" /><span>Salin Teks</span></>}
            </button>
            <button onClick={handleShareWhatsApp} className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-1.5 transition-colors" title="Kirim ke WhatsApp"><MessageCircle className="w-4 h-4" /><span className="hidden sm:inline">WhatsApp</span></button>
            <button onClick={handleShareTelegram} className="px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-medium flex items-center space-x-1.5 transition-colors" title="Kirim ke Telegram"><Send className="w-4 h-4" /><span className="hidden sm:inline">Telegram</span></button>
          </div>
        </div>
      </div>
    </div>
  );
};
