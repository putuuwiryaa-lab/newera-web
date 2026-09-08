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
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col font-sans">
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
        <div className="bg-slate-900/80 p-1.5 rounded-xl border border-white/[0.08] shadow-lg backdrop-blur-md">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                activeTab === 'ai'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Prediksi AI</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === 'ai' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                1D
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bbfs')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                activeTab === 'bbfs'
                  ? 'bg-purple-600 text-white font-semibold shadow-sm shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>BBFS 2D</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === 'bbfs' ? 'bg-black/30 text-purple-200 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                Set
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tuning')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                activeTab === 'tuning'
                  ? 'bg-slate-800 text-cyan-300 font-semibold border border-white/[0.1] shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Log Tuning (7 Hari)</span>
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                activeTab === 'evaluation'
                  ? 'bg-slate-800 text-amber-300 font-semibold border border-white/[0.1] shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Evaluasi Akurasi</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-slate-100 font-semibold border border-white/[0.1] shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Paito 2D</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 border border-white/[0.08] p-4 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Memori Kalibrasi & Log Penyetelan
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih domain: Peluang marginal Angka Ikut (AI) atau densitas pasangan BBFS
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setTuningSubTab('ai')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tuningSubTab === 'ai'
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tuning AI</span>
                </button>
                <button
                  onClick={() => setTuningSubTab('bbfs')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tuningSubTab === 'bbfs'
                      ? 'bg-purple-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tuning BBFS</span>
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
      <footer className="border-t border-white/[0.06] py-6 bg-slate-950/60 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            VORTEX 2D Dynamic & Adaptive Intelligence &bull; Auto-Tuning Closed Loop Pipeline &bull; Cloud Firestore Synced
          </p>
          <p className="font-mono text-[11px] text-slate-600">
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
