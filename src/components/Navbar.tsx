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
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneCheck);

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
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-200 to-emerald-400 bg-clip-text text-transparent">
                VORTEX <span className="text-emerald-400 font-mono">2D</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                DYNAMIC AI
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">
              Dynamic & Adaptive Intelligence & Walk-Forward Evaluator
            </p>
          </div>
        </div>

        {/* Status Center / Clock */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-400 bg-gray-900/90 px-3 py-1.5 rounded-xl border border-gray-800 shadow-inner">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Aktif: <strong className="text-white font-medium">{activeMarketName}</strong></span>
            <span className="text-gray-700">|</span>
            <span className="font-mono text-emerald-400 font-bold">{timeStr}</span>
          </div>

          {/* Mobile active market pill */}
          <div className="flex lg:hidden items-center space-x-1.5 text-[11px] text-gray-300 bg-gray-900/80 px-2.5 py-1 rounded-xl border border-gray-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate max-w-[110px] font-bold text-white">{activeMarketName}</span>
          </div>

          {/* Data Source Badge */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
              dataSource === 'live'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
            title={dataSource === 'live' ? 'Terhubung langsung ke Cloud Firestore' : 'Menggunakan dataset 64 pasaran'}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>{dataSource === 'live' ? 'Live DB' : 'Synced'}</span>
            <span className="font-mono text-[10px] opacity-75">({marketCount})</span>
          </div>

          {/* PWA Install Button */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95 border border-cyan-400/30 animate-pulse hover:animate-none"
              title="Pasang aplikasi VORTEX 2D di layar HP / Desktop"
            >
              <Download className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          {/* Share Prediction Button */}
          <button
            onClick={onOpenShare}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-extrabold transition-all shadow-md shadow-emerald-500/20 active:scale-95 border border-emerald-400/30"
            title="Menu Bagikan Prediksi Multi-Pasaran"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share Prediksi</span>
            <span className="sm:hidden">Share</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-sm"
            title="Sinkronisasi ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* iOS Safari PWA Instruction Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Install di iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-300 space-y-2.5">
              <p>Untuk menginstall aplikasi VORTEX 2D di Safari iOS:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-200 bg-gray-950/60 p-3 rounded-xl border border-gray-800/80">
                <li>
                  Tekan tombol <strong className="text-cyan-400">Bagikan (Share / ⎙)</strong> di menu bawah Safari.
                </li>
                <li>
                  Gulir ke bawah lalu pilih menu <strong className="text-emerald-400">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                </li>
                <li>
                  Tekan <strong className="text-white">"Tambah" (Add)</strong> di pojok kanan atas.
                </li>
              </ol>
              <p className="text-[11px] text-gray-400">
                Aplikasi VORTEX 2D akan langsung muncul sebagai ikon di beranda HP Anda dan dapat dibuka fullscreen tanpa bar browser!
              </p>
            </div>
            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

