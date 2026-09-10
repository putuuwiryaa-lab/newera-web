import React, { useState, useMemo, useEffect } from 'react';
import type { Market } from '../engine/types';
import { generatePrediction } from '../engine/adaptiveEngine';
import { generateSniperTrim, generateSmartTrim } from '../engine/generator';
import { getShioByNumber } from '../engine/shio';
import { parseHistoryItems } from '../services/marketService';
import {
  X,
  Copy,
  Check,
  MessageCircle,
  Send,
  Sparkles,
  Target,
  Zap,
  CheckSquare,
  Square,
  FileText
} from 'lucide-react';

interface SingleMarketShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market | null;
  prediction: ReturnType<typeof generatePrediction> | null;
}

export type WhatsAppFormatStyle = 'vip' | 'ringkas' | 'bom_only';

export const SingleMarketShareModal: React.FC<SingleMarketShareModalProps> = ({
  isOpen,
  onClose,
  market,
  prediction
}) => {
  const [formatStyle, setFormatStyle] = useState<WhatsAppFormatStyle>('vip');
  const [includeTwins, setIncludeTwins] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Toggle bagian
  const [showAiBbfs, setShowAiBbfs] = useState<boolean>(true);
  const [showShio, setShowShio] = useState<boolean>(true);
  const [showPaito, setShowPaito] = useState<boolean>(true);
  const [showTarung, setShowTarung] = useState<boolean>(true);
  const [showMovement, setShowMovement] = useState<boolean>(true);
  const [showBom, setShowBom] = useState<boolean>(true);
  const [showFooter, setShowFooter] = useState<boolean>(true);

  // Close with escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Ekstrak data kalkulasi
  const calculatedData = useMemo(() => {
    if (!market || !prediction) return null;

    const bbfs7 = prediction.paitoBBFS7?.digits || prediction.bbfs?.[7] || [];
    const ai4 = prediction.ai?.[4] || [];
    const ai3 = prediction.ai?.[3] || [];
    const deadDigits = (prediction.paitoBBFS7?.triadKumat && prediction.paitoBBFS7.triadKumat.length > 0)
      ? prediction.paitoBBFS7.triadKumat.map((t) => t.digit)
      : (prediction.deadDigits || []);
    const paito = prediction.paitoPrediction;

    // Top AI 1 Digit: digit peringkat #1 skor tertinggi
    const topAi1 = ai4[0] !== undefined ? ai4[0] : (ai3[0] !== undefined ? ai3[0] : 0);

    // Sniper & Super Sniper
    const sniperResult = paito
      ? generateSniperTrim(bbfs7, paito, includeTwins)
      : { sniperTop: [], sniperSecondary: [], superSniperShio: [], cadangan: [] };

    // Smart Trim Top 10
    const smartTrim = generateSmartTrim(bbfs7);

    // Shio names & emojis
    const topShioItems = (paito?.topShios || []).map((sNo) => getShioByNumber(sNo));

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const jalurRomawi = (j: number) => (j === 1 ? 'I' : j === 2 ? 'II' : 'III');
    const jalurNamaShio = (j: number) => {
      if (j === 1) return 'Shio: Kuda, Kelinci, Tikus, Ayam';
      if (j === 2) return 'Shio: Ular, Harimau, Babi, Monyet';
      return 'Shio: Naga, Kerbau, Anjing, Kambing';
    };
    const primaryJalurNumber = paito ? paito.primaryJalur : 1;
    const primaryJalurText = `JALUR ${jalurRomawi(primaryJalurNumber)} (${jalurNamaShio(primaryJalurNumber)})`;

    // Peluang Kembar (Twin Gap & Bet Twin or No)
    const historyItems = parseHistoryItems(market.history_data, market.history_days, market.name);
    let twinGap = 0;
    for (let i = historyItems.length - 1; i >= 0; i--) {
      if (historyItems[i].isTwin) break;
      twinGap++;
    }
    const shouldBetTwin = twinGap >= 14;
    const twinStatusFull = shouldBetTwin
      ? `BET TWIN (Waspada Gap ${twinGap} Draw - Siapkan Cadangan)`
      : `NO TWIN (Aman Tanpa Kembar)`;
    const twinStatusShort = shouldBetTwin
      ? `BET TWIN (Waspada Gap ${twinGap} Draw)`
      : `NO TWIN (Aman)`;

    // Pola Paritas: Sederhana tanpa kpl/ekr, langsung Genap vs Ganjil (BB)
    const formatParity = (p: string) => {
      if (p === 'Genap-Ganjil') return 'GENAP vs GANJIL (BB)';
      if (p === 'Ganjil-Genap') return 'GANJIL vs GENAP (BB)';
      if (p === 'Genap-Genap') return 'GENAP vs GENAP (Mono Genap)';
      if (p === 'Ganjil-Ganjil') return 'GANJIL vs GANJIL (Mono Ganjil)';
      return `${p} (BB)`;
    };
    const parityFormatted = formatParity(paito?.primaryParity || 'Genap-Ganjil');

    // Variasi Line 2D Tanpa Tumpang Tindih (Non-overlapping)
    // 1. BOM Nuklir (2 Line Paling Maut dari Super Nuklir Paito Pro)
    const bomNuklir: string[] = [];
    const nuklirCandidates = prediction.paitoBBFS7?.nuklir6 || sniperResult.superSniperShio || [];
    for (const l of nuklirCandidates) {
      if (!bomNuklir.includes(l)) bomNuklir.push(l);
      if (bomNuklir.length >= 2) break;
    }
    if (bomNuklir.length < 2) {
      for (const l of (sniperResult.sniperTop || [])) {
        if (!bomNuklir.includes(l)) bomNuklir.push(l);
        if (bomNuklir.length >= 2) break;
      }
    }

    // 2. BOM Sniper (4 Line Variasi Biji/Paito/BOM12)
    const bomSniper: string[] = [];
    const sniperPool = [
      ...(prediction.paitoBBFS7?.bom12 || []),
      ...(sniperResult.sniperTop || []),
      ...(sniperResult.sniperSecondary || []),
      ...(smartTrim.top10 || [])
    ];
    for (const l of sniperPool) {
      if (!bomNuklir.includes(l) && !bomSniper.includes(l)) {
        bomSniper.push(l);
        if (bomSniper.length >= 4) break;
      }
    }

    // 3. Cadangan / Invest (10 Line Pengaman)
    const invest10: string[] = [];
    const investPool = [
      ...(smartTrim.top10 || []),
      ...(smartTrim.medium15 || []),
      ...(sniperResult.cadangan || []),
      ...(smartTrim.cadangan || [])
    ];
    for (const l of investPool) {
      if (!bomNuklir.includes(l) && !bomSniper.includes(l) && !invest10.includes(l)) {
        invest10.push(l);
        if (invest10.length >= 10) break;
      }
    }

    const polaTarung = prediction.polaTarung;
    const movement = prediction.paitoPrediction?.movement;

    const tarungKepalaStr = polaTarung ? polaTarung.rankedKepala.slice(0, 4).join(', ') : '';
    const tarungEkorStr = polaTarung ? polaTarung.rankedEkor.slice(0, 4).join(', ') : '';
    const tarung4x4Str = polaTarung ? polaTarung.tarung4x4.join(' ') : '';
    const tarung3x3Str = polaTarung ? polaTarung.tarung3x3.join(' ') : '';

    const movementMagnitude = movement
      ? `${movement.magnitude.rhythmLabel} ➔ Proyeksi ${movement.magnitude.prediction.toUpperCase()}`
      : '';
    const movementParity = movement
      ? `K:${movement.parity.kepalaOscillation} • E:${movement.parity.ekorOscillation} ➔ ${movement.parity.primaryParity}`
      : '';
    const movementJalur = movement
      ? `${movement.jalur.orbitLabel} (Jalur ${movement.jalur.predictedJalur})`
      : '';
    const movementBiji = movement
      ? `${movement.biji.stepLabel} ➔ Target [ ${movement.biji.targetBiji.join(', ')} ]`
      : '';

    return {
      marketName: market.name,
      dateStr,
      confidenceScore: prediction.confidenceScore,
      convergenceStatus: prediction.convergenceStatus,
      topAi1,
      ai4Str: ai4.join(' - '),
      bbfs7Str: bbfs7.join(' '),
      deadDigitsStr: deadDigits.join(', '),
      twinStatusFull,
      twinStatusShort,
      topShioItems,
      primaryJalurText,
      topBijiStr: paito ? paito.topBiji.join(', ') : '',
      parityFormatted,
      primaryMagnitude: paito?.primaryMagnitude || 'Besar',
      tarungKepalaStr,
      tarungEkorStr,
      tarung4x4Str,
      tarung3x3Str,
      movementMagnitude,
      movementParity,
      movementJalur,
      movementBiji,
      bomNuklirStr: bomNuklir.join(' • '),
      bomSniperStr: bomSniper.join(' • '),
      invest10Str: invest10.join(' • ')
    };
  }, [market, prediction, includeTwins]);

  // Generator Teks WhatsApp
  const shareText = useMemo(() => {
    if (!calculatedData) return '';

    const d = calculatedData;
    const shioText = d.topShioItems
      .map((s) => `${s.emoji} ${s.name} (${String(s.no).padStart(2, '0')})`)
      .join(' • ');
    const shioShortText = d.topShioItems
      .map((s) => `${s.emoji} ${s.name}`)
      .join(' • ');

    if (formatStyle === 'vip') {
      // 1. FORMAT VIP RESMI
      const lines: string[] = [];
      lines.push('╔══════════════════════════════════════╗');
      lines.push(`  🔥 PREDIKSI RESMI ${d.marketName.toUpperCase()} 🔥`);
      lines.push(`  🗓️ ${d.dateStr}`);
      lines.push(`  ⚡ TINGKAT AKURASI : ${d.confidenceScore}% (${d.convergenceStatus})`);
      lines.push('╚══════════════════════════════════════╝');
      lines.push('');

      if (showAiBbfs) {
        lines.push('🎯 ANGKA MAIN & BBFS:');
        lines.push(`  ▸ Top AI 1 Digit : [ ${d.topAi1} ] ★ (Colok Bebas / Tunggal)`);
        lines.push(`  ▸ AI Main (2D)   : ${d.ai4Str}`);
        lines.push(`  ▸ BBFS Racikan   : ${d.bbfs7Str} (7 Digit)`);
        if (d.deadDigitsStr) {
          lines.push(`  ▸ Angka Mati 2D  : [ ${d.deadDigitsStr} ] (Peluang Keluar < 1%)`);
        }
        lines.push(`  ▸ Status Twin    : ${d.twinStatusFull}`);
        lines.push('');
      }

      if (showShio && d.topShioItems.length > 0) {
        lines.push('🐴 SHIO 2026 (TAHUN KUDA API):');
        lines.push(`  ▸ Top 3 Shio : ${shioText}`);
        lines.push(`  ▸ Jalur Kuat : ${d.primaryJalurText}`);
        lines.push('');
      }

      if (showPaito && d.topBijiStr) {
        lines.push('📊 SPESIFIKASI PAITO 2D:');
        lines.push(`  ▸ Karakter 2D  : ${d.primaryMagnitude.toUpperCase()} (Rentang ${d.primaryMagnitude === 'Besar' ? '50 s/d 99' : '00 s/d 49'})`);
        lines.push(`  ▸ Pola Paritas : ${d.parityFormatted}`);
        lines.push(`  ▸ Top Biji 2D  : Biji [ ${d.topBijiStr} ]`);
        lines.push('');
      }

      if (showMovement && d.movementMagnitude) {
        lines.push('🚀 DINAMIKA POLA PERGERAKAN (KINETIC):');
        lines.push(`  ▸ Ritme B/K      : ${d.movementMagnitude}`);
        lines.push(`  ▸ Aliran Paritas : ${d.movementParity}`);
        lines.push(`  ▸ Orbit Siklis   : ${d.movementJalur}`);
        lines.push(`  ▸ Langkah Biji   : ${d.movementBiji}`);
        lines.push('');
      }

      if (showTarung && d.tarungKepalaStr) {
        lines.push('⚔️ POLA TARUNG 2D (KEPALA VS EKOR NO BB):');
        lines.push(`  ▸ Kepala Kuat    : [ ${d.tarungKepalaStr} ]`);
        lines.push(`  ▸ Ekor Kuat      : [ ${d.tarungEkorStr} ]`);
        lines.push(`  ▸ 4x4 Utama      : ${d.tarung4x4Str} (16 Line Rekomendasi)`);
        lines.push(`  ▸ 3x3 BOM        : ${d.tarung3x3Str} (9 Line Super Hemat 78%)`);
        lines.push('');
      }

      if (showBom) {
        lines.push('💣 LINE 2D BERVARIASI (SIAP PASANG):');
        if (d.bomNuklirStr) {
          lines.push('  🔥 BOM NUKLIR (2 Line Paling Maut) :');
          lines.push(`     👉 ${d.bomNuklirStr}`);
          lines.push('');
        }
        if (d.bomSniperStr) {
          lines.push('  🎯 BOM SNIPER (4 Line Variasi Biji) :');
          lines.push(`     👉 ${d.bomSniperStr}`);
          lines.push('');
        }
        if (d.invest10Str) {
          lines.push('  🛡️ CADANGAN / INVEST (10 Line Pengaman) :');
          lines.push(`     👉 ${d.invest10Str}`);
          lines.push('');
        }
      }

      if (showFooter) {
        lines.push('══════════════════════════════════════');
        lines.push('⚠️ Utamakan Prediksi Sendiri (UPS)');
        lines.push('🚀 Salam JP Paus Beruntun | VORTEX 2D');
      }

      return lines.join('\n');
    } else if (formatStyle === 'ringkas') {
      // 2. FORMAT RINGKAS (Fast Bet)
      const lines: string[] = [];
      lines.push(`🔥 PREDIKSI ${d.marketName.toUpperCase()} 🔥`);
      lines.push(`🗓️ ${d.dateStr} | Tingkat Akurasi: ${d.confidenceScore}%`);
      lines.push('');
      if (showAiBbfs) {
        lines.push(`🎯 AI 1D (Tunggal) : [ ${d.topAi1} ] ★`);
        lines.push(`🎯 AI Main (2D)    : ${d.ai4Str}`);
        lines.push(`🛡️ BBFS 7 Digit    : ${d.bbfs7Str}`);
        if (d.deadDigitsStr) {
          lines.push(`⛔ Angka Mati      : [ ${d.deadDigitsStr} ]`);
        }
        lines.push(`👥 Rekomendasi Twin: ${d.twinStatusShort}`);
      }
      if (showShio && d.topShioItems.length > 0) {
        lines.push(`🐴 Shio  : ${shioShortText}`);
        lines.push(`🛣️ Jalur : ${d.primaryJalurText}`);
      }
      if (showPaito && d.topBijiStr) {
        lines.push(`📊 Paito : ${d.primaryMagnitude.toUpperCase()} (${d.primaryMagnitude === 'Besar' ? '50-99' : '00-49'}) • ${d.parityFormatted} • Biji [ ${d.topBijiStr} ]`);
      }
      if (showMovement && d.movementMagnitude) {
        lines.push(`🚀 Gerak : ${d.movementMagnitude} • Orbit ${d.movementJalur}`);
      }
      if (showTarung && d.tarungKepalaStr) {
        lines.push(`⚔️ Tarung: K:[${d.tarungKepalaStr}] * E:[${d.tarungEkorStr}] ➔ 16L: ${d.tarung4x4Str}`);
      }
      if (showBom) {
        lines.push('');
        lines.push('💣 LINE JADI 2D (ANTI-TUMPANG TINDIH):');
        if (d.bomNuklirStr) lines.push(`💥 BOM NUKLIR  : ${d.bomNuklirStr}`);
        if (d.bomSniperStr) lines.push(`🎯 BOM SNIPER  : ${d.bomSniperStr}`);
        if (d.invest10Str) lines.push(`🛡️ INVEST (10) : ${d.invest10Str}`);
      }
      if (showFooter) {
        lines.push('');
        lines.push('⚠️ UPS | VORTEX 2D');
      }
      return lines.join('\n');
    } else {
      // 3. FORMAT KHUSUS BOM SNIPER
      const lines: string[] = [];
      lines.push(`🎯 LINE BOM 2D ${d.marketName.toUpperCase()} 🎯`);
      lines.push(`🗓️ ${d.dateStr} | Tingkat Akurasi: ${d.confidenceScore}%`);
      lines.push('');
      if (d.bomNuklirStr) {
        lines.push(`🔥 BOM NUKLIR (2 Line) : ${d.bomNuklirStr}`);
      }
      if (d.bomSniperStr) {
        lines.push(`🎯 BOM SNIPER (4 Line) : ${d.bomSniperStr}`);
      }
      if (showTarung && d.tarung3x3Str) {
        lines.push(`⚔️ TARUNG 3x3 BOM (9 Line) : ${d.tarung3x3Str}`);
      }
      if (d.invest10Str) {
        lines.push(`🛡️ INVEST 2D (10 Line) : ${d.invest10Str}`);
      }
      lines.push('');
      lines.push(`🎯 AI Tunggal : [ ${d.topAi1} ] | AI 2D: ${d.ai4Str}`);
      lines.push(`🛡️ BBFS 7D    : ${d.bbfs7Str}`);
      if (showTarung && d.tarungKepalaStr) {
        lines.push(`⚔️ Pola Tarung: K:[${d.tarungKepalaStr}] vs E:[${d.tarungEkorStr}]`);
      }
      if (d.topShioItems.length > 0) {
        lines.push(`🐴 Top Shio   : ${shioShortText}`);
      }
      lines.push(`👥 Status Twin: ${d.twinStatusShort}`);
      if (showFooter) {
        lines.push('');
        lines.push('⚠️ UPS | Gaspol JP Paus! 🚀');
      }
      return lines.join('\n');
    }
  }, [calculatedData, formatStyle, showAiBbfs, showShio, showPaito, showTarung, showMovement, showBom, showFooter]);

  if (!isOpen || !market || !prediction) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleOpenTelegram = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?text=${encoded}`, '_blank');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel bg-slate-900/95 border border-white/[0.12] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base tracking-tight">
                  Bagikan Prediksi Khusus: {market.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25">
                  WA Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Format lengkap berakurasi tinggi (AI, BBFS, Shio 2026, Paito Makro & BOM)
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

        {/* Format Selector Tabs */}
        <div className="p-3 bg-slate-950/50 border-b border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Pilih Gaya Format:
            </span>
            <button
              onClick={() => setIncludeTwins(!includeTwins)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center space-x-1.5 transition-colors ${
                includeTwins
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-900 text-slate-400 border-white/[0.08] hover:text-white'
              }`}
            >
              <span>+Angka Kembar (Twin)</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFormatStyle('vip')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                formatStyle === 'vip'
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/80 text-slate-400 border-white/[0.08] hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>VIP Lengkap</span>
            </button>

            <button
              onClick={() => setFormatStyle('ringkas')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                formatStyle === 'ringkas'
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 border-white/[0.08] hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ringkas</span>
            </button>

            <button
              onClick={() => setFormatStyle('bom_only')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                formatStyle === 'bom_only'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/80 text-slate-400 border-white/[0.08] hover:text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Khusus BOM</span>
            </button>
          </div>

          {/* Section Filter Toggles */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <span className="text-slate-500 mr-1">Sertakan:</span>
            {[
              { label: 'AI & BBFS', state: showAiBbfs, set: setShowAiBbfs },
              { label: '🐴 Shio 2026', state: showShio, set: setShowShio },
              { label: '📊 Paito Makro', state: showPaito, set: setShowPaito },
              { label: '⚔️ Pola Tarung', state: showTarung, set: setShowTarung },
              { label: '🚀 Pola Gerak', state: showMovement, set: setShowMovement },
              { label: '💣 Line BOM', state: showBom, set: setShowBom },
              { label: 'Footer UPS', state: showFooter, set: setShowFooter }
            ].map((sec, idx) => (
              <button
                key={idx}
                onClick={() => sec.set(!sec.state)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-md transition-colors ${
                  sec.state
                    ? 'bg-white/[0.1] text-emerald-300 font-medium'
                    : 'bg-slate-900/80 text-slate-500 line-through'
                }`}
              >
                {sec.state ? (
                  <CheckSquare className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Square className="w-3 h-3 text-slate-600" />
                )}
                <span>{sec.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Textarea */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Pratinjau Pesan WhatsApp / Telegram:</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {shareText.length} Karakter
            </span>
          </div>

          <textarea
            readOnly
            value={shareText}
            rows={14}
            className="w-full bg-slate-950/90 border border-white/[0.1] rounded-xl p-3.5 font-mono text-xs text-emerald-300/90 focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed tracking-wide selection:bg-emerald-500/30"
          />
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {/* WhatsApp Direct */}
            <button
              onClick={handleOpenWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 shadow-md shadow-emerald-600/25"
            >
              <MessageCircle className="w-4 h-4 text-emerald-200" />
              <span>Buka di WhatsApp</span>
            </button>

            {/* Telegram Direct */}
            <button
              onClick={handleOpenTelegram}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 shadow-md shadow-cyan-600/25"
            >
              <Send className="w-4 h-4 text-cyan-200" />
              <span>Telegram</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md active:scale-95 ${
                copied
                  ? 'bg-emerald-400 text-slate-950 shadow-emerald-400/30'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-950" />
                  <span>1-Klik Salin Teks WA</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
