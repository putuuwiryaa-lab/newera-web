import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Database, Cpu, Share2 } from 'lucide-react';

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
    </header>
  );
};
