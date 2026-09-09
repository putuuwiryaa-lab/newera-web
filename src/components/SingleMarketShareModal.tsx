import React, { useState, useMemo, useEffect } from 'react';
import type { Market } from '../engine/types';
import { generatePrediction } from '../engine/adaptiveEngine';
import { generateSniperTrim, generateSmartTrim } from '../engine/generator';
import { getShioByNumber } from '../engine/shio';
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

    const bbfs7 = prediction.bbfs?.[7] || [];
    const ai4 = prediction.ai?.[4] || [];
    const ai3 = prediction.ai?.[3] || [];
    const deadDigits = prediction.deadDigits || [];
    const paito = prediction.paitoPrediction;

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

    return {
      marketName: market.name,
      dateStr,
      confidenceScore: prediction.confidenceScore,
      convergenceStatus: prediction.convergenceStatus,
      ai4Str: ai4.join(' - '),
      ai3Str: ai3.join(' - '),
      bbfs7Str: bbfs7.join(' '),
      deadDigitsStr: deadDigits.join(', '),
      topShioItems,
      primaryJalur: paito ? jalurRomawi(paito.primaryJalur) : 'I',
      topBijiStr: paito ? paito.topBiji.join(', ') : '',
      primaryParity: paito?.primaryParity || 'Genap-Ganjil',
      primaryMagnitude: paito?.primaryMagnitude || 'Besar',
      superSniperLines: (sniperResult.superSniperShio || []).join(' • ') || (sniperResult.superSniperShio || []).join(' '),
      sniperLines: sniperResult.sniperTop.join(' • ') || sniperResult.sniperTop.join(' '),
      top10Lines: smartTrim.top10.join(' ')
    };
  }, [market, prediction, includeTwins]);

  // Generator Teks WhatsApp
  const shareText = useMemo(() => {
    if (!calculatedData) return '';

    const d = calculatedData;

    if (formatStyle === 'vip') {
      // 1. FORMAT VIP LENGKAP
      const lines: string[] = [];
      lines.push('╔═══════════════════════════════════╗');
      lines.push(`  🔥 PREDIKSI RESMI ${d.marketName.toUpperCase()} 🔥`);
      lines.push(`  🗓️ ${d.dateStr}`);
      lines.push(`  ⚡ AI KEYAKINAN : ${d.confidenceScore}% (${d.convergenceStatus})`);
      lines.push('╚═══════════════════════════════════╝');
      lines.push('');

      if (showAiBbfs) {
        lines.push('🎯 ANGKA MAIN & BBFS:');
        lines.push(`  ▸ AI Utama (4D)  : ${d.ai4Str}`);
        lines.push(`  ▸ AI Ketat (3D)  : ${d.ai3Str}`);
        lines.push(`  ▸ BBFS 7 Digit   : ${d.bbfs7Str}`);
        if (d.deadDigitsStr) {
          lines.push(`  ▸ Angka Mati 2D  : [${d.deadDigitsStr}] (OFF 99%)`);
        }
        lines.push('');
      }

      if (showShio && d.topShioItems.length > 0) {
        const shioText = d.topShioItems
          .map((s) => `${s.emoji} ${s.name} (${String(s.no).padStart(2, '0')})`)
          .join(' • ');
        lines.push('🐴 SHIO 2026 (TAHUN KUDA API):');
        lines.push(`  ▸ Top Shio   : ${shioText}`);
        lines.push(`  ▸ Jalur Kuat : Jalur ${d.primaryJalur} (Prioritas Utama)`);
        lines.push('');
      }

      if (showPaito && d.topBijiStr) {
        lines.push('📊 ANALISIS PAITO MAKRO:');
        lines.push(`  ▸ Top 3 Biji 2D : [${d.topBijiStr}]`);
        lines.push(`  ▸ Pola Paritas  : ${d.primaryParity}`);
        lines.push(`  ▸ Kategori 2D   : ${d.primaryMagnitude} (≥50 Besar / <50 Kecil)`);
        lines.push('');
      }

      if (showBom) {
        lines.push('💣 LINE BOM 2D AKURASI TINGGI:');
        if (d.superSniperLines) {
          lines.push(`  🔥 SUPER SNIPER (4 Lapis) : ${d.superSniperLines}`);
        }
        if (d.sniperLines) {
          lines.push(`  🎯 BOM SNIPER PAITO       : ${d.sniperLines}`);
        }
        if (d.top10Lines) {
          lines.push(`  💣 TOP 10 LINE BBFS       : ${d.top10Lines}`);
        }
        lines.push('');
      }

      if (showFooter) {
        lines.push('═════════════════════════════════════');
        lines.push('⚠️ Tetap Utamakan Prediksi Sendiri (UPS)');
        lines.push('🚀 Salam JP Paus Beruntun | VORTEX 2D');
      }

      return lines.join('\n');
    } else if (formatStyle === 'ringkas') {
      // 2. FORMAT RINGKAS
      const lines: string[] = [];
      lines.push(`🔥 PREDIKSI ${d.marketName.toUpperCase()} 🔥`);
      lines.push(`🗓️ ${d.dateStr} | Keyakinan AI: ${d.confidenceScore}%`);
      lines.push('');
      if (showAiBbfs) {
        lines.push(`🎯 AI 4D: ${d.ai4Str}`);
        lines.push(`🛡️ BBFS 7D: ${d.bbfs7Str}`);
      }
      if (showShio && d.topShioItems.length > 0) {
        const shioText = d.topShioItems.map((s) => `${s.emoji} ${s.name}`).join(', ');
        lines.push(`🐴 Shio: ${shioText} (Jalur ${d.primaryJalur})`);
      }
      if (showPaito && d.topBijiStr) {
        lines.push(`📊 Paito: Biji [${d.topBijiStr}] • ${d.primaryParity} • ${d.primaryMagnitude}`);
      }
      if (showBom) {
        if (d.superSniperLines) lines.push(`🔥 SUPER BOM : ${d.superSniperLines}`);
        if (d.sniperLines) lines.push(`🎯 SNIPER    : ${d.sniperLines}`);
        if (d.top10Lines) lines.push(`💣 TOP 10   : ${d.top10Lines}`);
      }
      if (d.deadDigitsStr) {
        lines.push(`⛔ Angka Mati: [${d.deadDigitsStr}]`);
      }
      if (showFooter) {
        lines.push('');
        lines.push('⚠️ UPS! Salam JP Paus 🚀');
      }
      return lines.join('\n');
    } else {
      // 3. FORMAT KHUSUS BOM SNIPER
      const lines: string[] = [];
      lines.push(`🎯 BOM 2D ${d.marketName.toUpperCase()} 🎯`);
      lines.push(`🗓️ ${d.dateStr} | AI Score: ${d.confidenceScore}%`);
      lines.push('');
      if (d.superSniperLines) {
        lines.push(`🔥 SUPER SNIPER (Shio+Pola): ${d.superSniperLines}`);
      }
      if (d.sniperLines) {
        lines.push(`🎯 BOM SNIPER (Biji+Pola) : ${d.sniperLines}`);
      }
      if (d.top10Lines) {
        lines.push(`💣 TOP 10 LINE BBFS       : ${d.top10Lines}`);
      }
      lines.push('');
      lines.push(`🎯 AI Utama: ${d.ai4Str}`);
      lines.push(`🛡️ BBFS-7  : ${d.bbfs7Str}`);
      if (d.topShioItems.length > 0) {
        lines.push(`🐴 Top Shio: ${d.topShioItems.map((s) => `${s.emoji} ${s.name}`).join(' • ')}`);
      }
      if (showFooter) {
        lines.push('');
        lines.push('⚠️ UPS | Gaspol JP Paus! 🚀');
      }
      return lines.join('\n');
    }
  }, [calculatedData, formatStyle, showAiBbfs, showShio, showPaito, showBom, showFooter]);

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
