import { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { MarketSelector } from './components/MarketSelector';
import { AIDashboard } from './components/AIDashboard';
import { BBFSDashboard } from './components/BBFSDashboard';
import { SmartCalibrationCard } from './components/SmartCalibrationCard';
import { TuningTimeline } from './components/TuningTimeline';
import { EvaluationPanel } from './components/EvaluationPanel';
import { HistoryPaitoTable } from './components/HistoryPaitoTable';
import { LineGeneratorModal } from './components/LineGeneratorModal';
import { SharePredictionModal } from './components/SharePredictionModal';
import { fetchAllMarkets, parseHistoryItems } from './services/marketService';
import { generatePrediction } from './engine/adaptiveEngine';
import { runWalkForwardEvaluation } from './engine/evaluator';
import { auditAndCalibrate, reconstructLast7DaysTuningLogs } from './engine/smartCalibrator';
import type { Market } from './engine/types';
import { Sparkles, TrendingUp, History, Sliders, Layers } from 'lucide-react';

export function App() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string>('SGP | Singapore');
  const [dataSource, setDataSource] = useState<'live' | 'cached'>('cached');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'bbfs' | 'tuning' | 'evaluation' | 'history'>('ai');
  const [tuningSubTab, setTuningSubTab] = useState<'ai' | 'bbfs'>('ai');

  // Generator modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    digits: number[];
    tierName: string;
    initialMode?: 'full' | 'trimmer';
  }>({
    isOpen: false,
    digits: [],
    tierName: '',
    initialMode: 'full'
  });

  // Share prediction modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Load markets
  const loadMarkets = async () => {
    setIsRefreshing(true);
    const result = await fetchAllMarkets();
    setMarkets(result.markets);
    setDataSource(result.source);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadMarkets();
  }, []);

  // Selected market
  const currentMarket = useMemo(() => {
    return markets.find((m) => m.id === selectedMarketId) || markets[0];
  }, [markets, selectedMarketId]);

  // Parse 4D numbers
  const currentResults4D = useMemo(() => {
    if (!currentMarket || !currentMarket.history_data) return [];
    return currentMarket.history_data
      .trim()
      .split(/\s+/)
      .filter((r) => r.length === 4 && /^\d{4}$/.test(r));
  }, [currentMarket]);

  // Audit & Kalibrasi Cerdas pada Result Terakhir
  const calibrationAudit = useMemo(() => {
    if (currentResults4D.length < 15) return null;
    return auditAndCalibrate(currentResults4D);
  }, [currentResults4D]);

  // Kalkulasi Prediksi Adaptif & Intelijen (Mempertahankan Bobot Menang / Freeze Tanpa Hitung Ulang dari Awal)
  const prediction = useMemo(() => {
    if (currentResults4D.length < 10) return null;
    return generatePrediction(currentResults4D, calibrationAudit);
  }, [currentResults4D, calibrationAudit]);

  // Rekonstruksi Riwayat Kalibrasi 7 Hari Terakhir
  const tuningLogs = useMemo(() => {
    if (currentResults4D.length < 15) return [];
    return reconstructLast7DaysTuningLogs(currentResults4D);
  }, [currentResults4D]);

  // Kalkulasi Evaluasi Otomatis (Backtesting)
  const evaluation = useMemo(() => {
    if (currentResults4D.length < 60) return null;
    return runWalkForwardEvaluation(currentResults4D, 50);
  }, [currentResults4D]);

  // Paito Items
  const historyItems = useMemo(() => {
    if (!currentMarket) return [];
    return parseHistoryItems(currentMarket.history_data);
  }, [currentMarket]);

  const handleOpenGenerator = (digits: number[], tierName: string, mode: 'full' | 'trimmer' = 'full') => {
    setModalState({
      isOpen: true,
      digits,
      tierName,
      initialMode: mode
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        marketCount={markets.length}
        dataSource={dataSource}
        onRefresh={loadMarkets}
        isRefreshing={isRefreshing}
        activeMarketName={currentMarket ? currentMarket.name : 'Memuat...'}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Selector Pasaran */}
        <MarketSelector
          markets={markets}
          selectedMarketId={selectedMarketId}
          onSelectMarket={(id) => setSelectedMarketId(id)}
        />

        {/* Unified Premium Tab Navigation */}
        <div className="bg-gray-900/80 p-1.5 rounded-2xl border border-gray-800/90 shadow-xl backdrop-blur-md">
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-950 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>🎯 Dashboard AI</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === 'ai' ? 'bg-gray-950/20 text-gray-900' : 'bg-gray-800 text-gray-400'}`}>
                1D
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bbfs')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'bbfs'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-300" />
              <span>⚡ Dashboard BBFS</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === 'bbfs' ? 'bg-black/30 text-purple-200' : 'bg-gray-800 text-gray-400'}`}>
                2D Set
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tuning')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'tuning'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Memori Tuning 7 Hari</span>
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'evaluation'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Evaluasi Backtest (450x)</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-md border border-gray-600 scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Paito Riwayat 2D</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tab Contents */}
        {activeTab === 'ai' && (
          <AIDashboard
            prediction={prediction}
            audit={calibrationAudit}
            evaluation={evaluation}
            marketName={currentMarket ? currentMarket.name : ''}
          />
        )}

        {activeTab === 'bbfs' && (
          <BBFSDashboard
            prediction={prediction}
            audit={calibrationAudit}
            evaluation={evaluation}
            marketName={currentMarket ? currentMarket.name : ''}
            onOpenGenerator={handleOpenGenerator}
          />
        )}

        {activeTab === 'tuning' && (
          <div className="space-y-6">
            {/* Tuning Mode Switcher Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-900 border border-gray-800 p-4 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    MEMORI KALIBRASI & LOG PENYETELAN
                  </h3>
                  <p className="text-xs text-gray-400">
                    Pilih domain yang ingin ditinjau: Peluang marginal AI atau densitas pasangan BBFS
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800">
                <button
                  onClick={() => setTuningSubTab('ai')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tuningSubTab === 'ai'
                      ? 'bg-cyan-500 text-gray-950 shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🎯 Tuning AI</span>
                </button>
                <button
                  onClick={() => setTuningSubTab('bbfs')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tuningSubTab === 'bbfs'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>⚡ Tuning BBFS</span>
                </button>
              </div>
            </div>

            <SmartCalibrationCard
              audit={calibrationAudit}
              marketName={currentMarket ? currentMarket.name : ''}
              mode={tuningSubTab}
            />
            <TuningTimeline
              logs={tuningLogs}
              marketName={currentMarket ? currentMarket.name : ''}
              initialMode={tuningSubTab}
            />
          </div>
        )}

        {activeTab === 'evaluation' && (
          <EvaluationPanel
            metrics={evaluation}
            marketName={currentMarket ? currentMarket.name : ''}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPaitoTable
            historyItems={historyItems}
            marketName={currentMarket ? currentMarket.name : ''}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-6 bg-gray-950/60 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            VORTEX 2D Dynamic & Adaptive Intelligence &bull; Auto-Tuning Closed Loop Pipeline &bull; Cloud Firestore Synced
          </p>
          <p className="font-mono text-[11px] text-gray-600">
            Confidence Convergence &bull; Twin Anomaly Index &bull; Multiplicative Weights Update
          </p>
        </div>
      </footer>

      {/* Line Generator & Smart Trimmer Modal */}
      <LineGeneratorModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        digits={modalState.digits}
        tierName={modalState.tierName}
        initialMode={modalState.initialMode}
      />

      {/* Multi-Market Share Prediction Modal */}
      <SharePredictionModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        markets={markets}
      />
    </div>
  );
}

export default App;
