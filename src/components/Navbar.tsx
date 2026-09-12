import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Database, Cpu, Share2, Download, Smartphone, X } from 'lucide-react';

interface NavbarProps {
  marketCount: number;
  dataSource: 'live' | 'cached';
  onRefresh: () => void;
  isRefreshing: boolean;
  activeMarketName: string;
  onOpenShare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  marketCount,
  dataSource,
  onRefresh,
  isRefreshing,
  activeMarketName,
  onOpenShare
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  });
  const [showIosModal, setShowIosModal] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosModal(true);
      } else {
        alert(
          'Untuk menginstall VORTEX 2D, buka menu browser (titik 3 di kanan atas) lalu pilih "Install Aplikasi" atau "Tambahkan ke Layar Utama".'
        );
      }
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <header className="sticky top-0 z-40 bg-[#070A13]/85 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/[0.12] flex items-center justify-center shadow-sm">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white font-sans">
                VORTEX <span className="text-emerald-400 font-mono font-extrabold">2D</span>
              </span>
              <span className="hidden sm:inline text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Dynamic AI Ensemble & Quantitative 2D Engine
            </p>
          </div>
        </div>

        {/* Status Center / Clock */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-white/[0.08]">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Aktif: <strong className="text-slate-200 font-medium">{activeMarketName}</strong></span>
            <span className="text-slate-700">|</span>
            <span className="font-mono text-emerald-400 font-medium tabular-nums">{timeStr}</span>
          </div>

          {/* Mobile active market pill */}
          <div className="hidden sm:flex lg:hidden items-center space-x-1.5 text-[11px] text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate max-w-[120px] font-medium text-slate-200">{activeMarketName}</span>
          </div>

          {/* Data Source Badge */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              dataSource === 'live'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
            }`}
            title={dataSource === 'live' ? 'Terhubung langsung ke Cloud Firestore' : 'Dataset cached/offline; freshness production belum terverifikasi'}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>{dataSource === 'live' ? 'Live DB' : 'Cached'}</span>
            <span className="font-mono text-[10px] opacity-80">({marketCount})</span>
          </div>

          {/* PWA Install Button */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-medium border border-white/[0.1] transition-all active:scale-95"
              title="Pasang aplikasi VORTEX 2D di layar HP / Desktop"
            >
              <Download className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Share Prediction Button */}
          <button
            onClick={onOpenShare}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all active:scale-95 shadow-sm shadow-emerald-500/20"
            title="Menu Bagikan Prediksi Multi-Pasaran"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all disabled:opacity-50 active:scale-95"
            title="Sinkronisasi ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* iOS Safari PWA Instruction Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/[0.12] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white text-sm">Install di iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2.5">
              <p>Untuk menginstall aplikasi VORTEX 2D di Safari iOS:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-200 bg-slate-950/80 p-3 rounded-xl border border-white/[0.08]">
                <li>
                  Tekan tombol <strong className="text-cyan-400">Bagikan (Share)</strong> di menu bawah Safari.
                </li>
                <li>
                  Pilih <strong className="text-emerald-400">"Tambahkan ke Layar Utama"</strong>.
                </li>
                <li>
                  Tekan <strong className="text-white">"Tambah"</strong> di pojok kanan atas.
                </li>
              </ol>
            </div>
            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-semibold shadow-sm"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

