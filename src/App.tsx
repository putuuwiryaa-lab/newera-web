import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { SingleMarketShareModal } from './components/SingleMarketShareModal';
import { Toast, type ToastMessage } from './components/Toast';
import { fetchAllMarkets, parseHistoryItems } from './services/marketService';
import { generatePrediction } from './engine/adaptiveEngine';
import { runWalkForwardEvaluation } from './engine/evaluator';
import { auditAndCalibrate, reconstructLast7DaysTuningLogs } from './engine/smartCalibrator';
import { calibrationAuditFromServer, mergeServerPrediction } from './engine/serverState';
import type { Market } from './engine/types';
import { Sparkles, TrendingUp, History, Sliders, Layers, Compass } from 'lucide-react';

export function App() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string>('SGP | Singapore');
  const [dataSource, setDataSource] = useState<'live' | 'cached'>('cached');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'bbfs' | 'tuning' | 'evaluation' | 'history'>('ai');
  const [tuningSubTab, setTuningSubTab] = useState<'ai' | 'bbfs' | 'paito'>('ai');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ id: Date.now().toString(), message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2200);
  }, []);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    digits: number[];
    tierName: string;
    initialMode?: 'full' | 'trimmer' | 'sniper' | 'tarung' | 'wheeling';
  }>({
    isOpen: false,
    digits: [],
    tierName: '',
    initialMode: 'full'
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSingleShareOpen, setIsSingleShareOpen] = useState(false);

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

  const currentMarket = useMemo(() => {
    return markets.find((m) => m.id === selectedMarketId) || markets[0];
  }, [markets, selectedMarketId]);

  const currentResults4D = useMemo(() => {
    if (!currentMarket || !currentMarket.history_data) return [];
    return currentMarket.history_data
      .trim()
      .split(/\s+/)
      .filter((r) => r.length === 4 && /^\d{4}$/.test(r));
  }, [currentMarket]);

  // Untuk source live, hanya last_audit production yang boleh tampil sebagai audit aktif.
  // Rekonstruksi lokal dipakai saat cached/offline, bukan untuk memalsukan audit live yang belum ada.
  const calibrationAudit = useMemo(() => {
    if (currentResults4D.length < 15) return null;
    const persisted = calibrationAuditFromServer(
      currentMarket?.last_audit,
      currentMarket?.next_prediction,
      currentResults4D
    );
    if (persisted) return persisted;
    return dataSource === 'cached' ? auditAndCalibrate(currentResults4D) : null;
  }, [currentResults4D, currentMarket, dataSource]);

  // Kalkulasi lokal menyediakan detail paito/heatmap, lalu tier AI/BBFS dan
  // bobot production dioverlay dari next_prediction Firestore jika tersedia.
  const prediction = useMemo(() => {
    if (currentResults4D.length < 10) return null;
    const localPrediction = generatePrediction(currentResults4D, calibrationAudit);
    return mergeServerPrediction(localPrediction, currentMarket?.next_prediction, currentResults4D);
  }, [currentResults4D, calibrationAudit, currentMarket]);

  const tuningLogs = useMemo(() => {
    if (currentResults4D.length < 15) return [];
    return reconstructLast7DaysTuningLogs(currentResults4D);
  }, [currentResults4D]);

  const evaluation = useMemo(() => {
    if (currentResults4D.length < 60) return null;
    return runWalkForwardEvaluation(currentResults4D, 50);
  }, [currentResults4D]);

  const historyItems = useMemo(() => {
    if (!currentMarket) return [];
    return parseHistoryItems(currentMarket.history_data, currentMarket.history_days, currentMarket.name);
  }, [currentMarket]);

  const handleOpenGenerator = (
    digits: number[],
    tierName: string,
    mode: 'full' | 'trimmer' | 'sniper' | 'tarung' | 'wheeling' = 'full'
  ) => {
    setModalState({
      isOpen: true,
      digits,
      tierName,
      initialMode: mode
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === '1') {
        setActiveTab('ai');
        showToast('Tab: Prediksi AI', 'info');
      } else if (e.key === '2') {
        setActiveTab('bbfs');
        showToast('Tab: BBFS 2D', 'info');
      } else if (e.key === '3') {
        setActiveTab('tuning');
        showToast('Tab: Log Tuning', 'info');
      } else if (e.key === '4') {
        setActiveTab('evaluation');
        showToast('Tab: Evaluasi Akurasi', 'info');
      } else if (e.key === '5') {
        setActiveTab('history');
        showToast('Tab: Paito 2D', 'info');
      } else if (e.key === 'g' || e.key === 'G') {
        if (prediction?.bbfs?.[7]) {
          handleOpenGenerator(prediction.bbfs[7], 'BBFS-7', 'trimmer');
          showToast('Buka Generator BBFS-7', 'info');
        }
      } else if (e.key === 's' || e.key === 'S') {
        setIsShareModalOpen(true);
      } else if (e.key === 'w' || e.key === 'W') {
        setIsSingleShareOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prediction, showToast]);

  const handleTabChange = (tab: 'ai' | 'bbfs' | 'tuning' | 'evaluation' | 'history') => {
    if (navigator.vibrate) navigator.vibrate(10);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col font-sans">
      <Toast toast={toast} />

      <Navbar
        marketCount={markets.length}
        dataSource={dataSource}
        onRefresh={loadMarkets}
        isRefreshing={isRefreshing}
        activeMarketName={currentMarket ? currentMarket.name : 'Memuat...'}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 pb-24 sm:pb-8">
        <MarketSelector
          markets={markets}
          selectedMarketId={selectedMarketId}
          onSelectMarket={(id) => setSelectedMarketId(id)}
          onOpenSingleShare={() => setIsSingleShareOpen(true)}
        />

        <div className="hidden sm:flex items-center justify-between p-1.5 rounded-2xl bg-slate-900/80 border border-white/[0.08] shadow-lg backdrop-blur-md">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handleTabChange('ai')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'ai'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Prediksi AI</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'ai' ? 'bg-slate-950/25 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                1D
              </span>
            </button>

            <button
              onClick={() => handleTabChange('bbfs')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'bbfs'
                  ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>BBFS 2D</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'bbfs' ? 'bg-slate-950/25 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                Set
              </span>
            </button>

            <button
              onClick={() => handleTabChange('tuning')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'tuning'
                  ? 'bg-slate-800 text-cyan-300 font-semibold border border-white/[0.1] shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Log Tuning</span>
            </button>

            <button
              onClick={() => handleTabChange('evaluation')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'evaluation'
                  ? 'bg-slate-800 text-amber-300 font-semibold border border-white/[0.1] shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Evaluasi Akurasi</span>
            </button>

            <button
              onClick={() => handleTabChange('history')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-slate-100 font-semibold border border-white/[0.1] shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Paito 2D</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center space-x-2 pr-3 text-[11px] text-slate-500 font-mono">
            <span>Pintasan: [1-5] Tab &bull; [G] Generator &bull; [W] Share WA &bull; [S] Multi-Share &bull; [/] Cari</span>
          </div>
        </div>

        {activeTab === 'ai' && (
          <AIDashboard
            prediction={prediction}
            audit={calibrationAudit}
            evaluation={evaluation}
            marketName={currentMarket ? currentMarket.name : ''}
            onOpenSingleShare={() => setIsSingleShareOpen(true)}
            onToast={showToast}
          />
        )}

        {activeTab === 'bbfs' && (
          <BBFSDashboard
            prediction={prediction}
            audit={calibrationAudit}
            evaluation={evaluation}
            marketName={currentMarket ? currentMarket.name : ''}
            onOpenGenerator={handleOpenGenerator}
            onOpenSingleShare={() => setIsSingleShareOpen(true)}
            onToast={showToast}
          />
        )}

        {activeTab === 'tuning' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 border border-white/[0.08] p-4 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Audit Production & Rekonstruksi Walk-Forward
                  </h3>
                  <p className="text-xs text-slate-400">
                    Audit aktif berasal dari Firestore; timeline 7 periode di bawah adalah rekonstruksi walk-forward
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
                <button
                  onClick={() => setTuningSubTab('paito')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tuningSubTab === 'paito'
                      ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Audit Paito</span>
                </button>
              </div>
            </div>

            {tuningSubTab !== 'paito' && (
              <SmartCalibrationCard
                audit={calibrationAudit}
                marketName={currentMarket ? currentMarket.name : ''}
                mode={tuningSubTab}
              />
            )}
            <TuningTimeline
              logs={tuningLogs}
              marketName={currentMarket ? currentMarket.name : ''}
              mode={tuningSubTab}
              onModeChange={setTuningSubTab}
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
            paitoPrediction={prediction?.paitoPrediction}
            prediction={prediction}
            onToast={(msg) => showToast(msg, 'info')}
          />
        )}
      </main>

      <nav className="fixed bottom-3 inset-x-3 sm:hidden z-40 bg-slate-950/90 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/80 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => handleTabChange('ai')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'ai'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">AI</span>
        </button>

        <button
          onClick={() => handleTabChange('bbfs')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'bbfs'
              ? 'text-purple-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">BBFS</span>
        </button>

        <button
          onClick={() => handleTabChange('tuning')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'tuning'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Tuning</span>
        </button>

        <button
          onClick={() => handleTabChange('evaluation')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'evaluation'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Akurasi</span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'text-white font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Paito</span>
        </button>
      </nav>

      <footer className="border-t border-white/[0.06] py-6 bg-slate-950/60 mt-12 text-center text-xs text-slate-500 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            VORTEX 2D Dynamic & Adaptive Intelligence &bull; Auto-Tuning Closed Loop Pipeline &bull; Cloud Firestore Synced
          </p>
          <p className="font-mono text-[11px] text-slate-600">
            Confidence Convergence &bull; Twin Anomaly Index &bull; Multiplicative Weights Update
          </p>
        </div>
      </footer>

      <LineGeneratorModal
        key={`modal-${modalState.tierName}-${modalState.initialMode}-${modalState.isOpen ? 'open' : 'closed'}`}
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        digits={modalState.digits}
        tierName={modalState.tierName}
        initialMode={modalState.initialMode}
        paitoPrediction={prediction?.paitoPrediction}
        polaTarung={prediction?.polaTarung}
      />

      <SharePredictionModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        markets={markets}
      />

      <SingleMarketShareModal
        isOpen={isSingleShareOpen}
        onClose={() => setIsSingleShareOpen(false)}
        market={currentMarket}
        prediction={prediction}
      />
    </div>
  );
}

export default App;
