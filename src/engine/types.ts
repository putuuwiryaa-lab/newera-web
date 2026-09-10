import type { ShioInfo } from './shio';

export interface Market {
  id: string;
  name: string;
  history_data: string;
  order: number;
  updated_at?: string;
  latest_prediction?: any;
  last_audit?: any;
}

export interface PredictionResult {
  rankedDigits: number[];
  ai: {
    3: number[];
    4: number[];
    5: number[];
    6: number[];
  };
  bbfs: {
    6: number[];
    7: number[];
    8: number[];
    9: number[];
  };
  methodWeights: Record<string, number>;
  tierMethodWeights: Record<number, Record<string, number>>; // Bobot spesifik per tier (3, 4, 5, 6)
  bbfsTierWeights: Record<number, Record<string, number>>;   // Bobot spesifik 4 faktor per tier BBFS (6, 7, 8, 9)
  confidenceScore: number;
  convergenceStatus: 'TINGGI' | 'SEDANG' | 'RENDAH';
  deadDigits: number[]; // 2 Digit paling lemah
  paitoPrediction?: PaitoMacroPrediction;
  polaTarung?: PolaTarungPrediction;
  lastDraw: {
    full: string;
    as: number;
    kop: number;
    kepala: number;
    ekor: number;
  };
}

export interface AIStat {
  hitCount: number;
  actualRate: number;
  baselineRate: number;
  diff: number;
}

export interface BBFSStat {
  hitCount: number;
  lines: number;
  actualRate: number;
  baselineRate: number;
  diff: number;
  pnlNet: number;
}

export interface PaitoEvaluationStats {
  bijiHits: number;
  bijiRate: number;
  bijiBaseline: number;
  parityHits: number;
  parityRate: number;
  parityBaseline: number;
  magnitudeHits: number;
  magnitudeRate: number;
  magnitudeBaseline: number;
  shioHits?: number;
  shioRate?: number;
  shioBaseline?: number;
  jalurHits?: number;
  jalurRate?: number;
  jalurBaseline?: number;
  superSniperHits?: number;
  superSniperRate?: number;
  avgSuperSniperLines?: number;
  superSniperPnlNet?: number;
  sniperBomHits: number;
  sniperBomRate: number;
  avgSniperLines: number;
  sniperPnlNet: number;
}

export interface EvaluationMetrics {
  totalDraws: number;
  testDraws: number;
  twinCount: number;
  twinRate: number;
  aiStats: Record<number, AIStat>;
  bbfsStats: Record<number, BBFSStat>;
  paitoStats?: PaitoEvaluationStats;
  ai4Streak: {
    maxWin: number;
    maxLose: number;
    current: number;
  };
}

export interface HistoryItem {
  index: number;
  full: string;
  as: number;
  kop: number;
  kepala: number;
  ekor: number;
  isTwin: boolean;
  biji: number;
  besarKecil: 'Besar' | 'Kecil';
  ganjilGenap: string;
  shio?: ShioInfo;
  shioName?: string;
  shioNumber?: number;
  shioEmoji?: string;
  shioJalur?: 1 | 2 | 3;
}

export interface TierAuditStatus {
  size: number;
  name: string; // e.g. "AI-3", "BBFS-7"
  parameter?: string; // e.g. "Parameter AI-3 (Seleksi 3 Digit)"
  status: 'HIT' | 'LOSE';
  action: 'FREEZE' | 'CALIBRATED';
  tuningDirective?: string; // e.g. "⚡ KALIBRASI: Ambang seleksi dikoreksi", "🔒 FREEZE: Parameter dipertahankan"
  marginalNote?: string; // e.g. "Hit di Digit Rank 4", "Hit di Set BBFS-7"
}

export interface AITuningDetail {
  predictedTiers: Record<number, number[]>; // 3, 4, 5, 6
  tierAudits: Record<number, TierAuditStatus>; // 3, 4, 5, 6
  hitDigits: number[];
  statusAI4: 'HIT' | 'LOSE';
  rewardedMethods: string[];
  penalizedMethods: string[];
  calibratedWeights: Record<string, number>;
  tierMethodWeights?: Record<number, Record<string, number>>;
  recoveredFromLoss?: boolean;
  streak: number;
  recommendedTier: string;
  actionSummary: string;
}

export interface BBFSTuningDetail {
  predictedTiers: Record<number, number[]>; // 6, 7, 8, 9
  tierAudits: Record<number, TierAuditStatus>; // 6, 7, 8, 9
  deadDigits: number[];
  deadDigitsClean: boolean; // true if neither dead digit landed on Kepala or Ekor
  statusBBFS7: 'HIT' | 'LOSE';
  isTwin: boolean;
  twinProtected: boolean;
  trimmerZone: 'BOM_10' | 'MEDIUM_15' | 'CADANGAN' | 'MISSED';
  rewardedFactor: string;
  penalizedFactor: string;
  recommendedTier: string;
  actionSummary: string;
  tierFactorWeights?: Record<number, Record<string, number>>;
}

export interface PaitoTuningDetail {
  predictedTopBiji: number[];
  actualBiji: number;
  hitBiji: boolean;
  predictedParity: string;
  actualParity: string;
  hitParity: boolean;
  predictedMagnitude: string;
  actualMagnitude: string;
  hitMagnitude: boolean;
  predictedTopShios?: number[];
  actualShio?: number;
  hitShio?: boolean;
  predictedJalur?: 1 | 2 | 3;
  actualJalur?: 1 | 2 | 3;
  hitJalur?: boolean;
  sniperZone: 'BOM_SNIPER' | 'SEKUNDER' | 'CADANGAN' | 'MISSED';
  strikeCount: number;
}

export interface DayTuningLog {
  periodIndex: number;
  fullResult: string;
  target2D: string;
  isTwin: boolean;
  ai: AITuningDetail;
  bbfs: BBFSTuningDetail;
  paito?: PaitoTuningDetail;

  // Backward compatibility fields
  predictedAI4: number[];
  predictedBBFS7: number[];
  statusAI: 'HIT' | 'LOSE';
  statusBBFS: 'HIT' | 'LOSE';
  hitDigits: number[];
  rewardedMethod: string;
  penalizedMethod: string;
  recoveredFromPreviousLoss?: boolean;
}

export interface OverdueAlert {
  type: 'biji' | 'parity' | 'magnitude' | 'shio' | 'jalur';
  label: string;
  gap: number;
  alertLevel: 'NORMAL' | 'WASPADA' | 'EKSTREM';
}

export interface OverdueShioInfo {
  number: number;
  name: string;
  emoji: string;
  jalur: 1 | 2 | 3;
  gap: number;
  alertLevel: 'NORMAL' | 'WASPADA' | 'EKSTREM';
}

export interface PaitoMacroPrediction {
  topBiji: number[];
  bijiProbabilities: Record<number, number>;
  primaryParity: 'Genap-Genap' | 'Genap-Ganjil' | 'Ganjil-Genap' | 'Ganjil-Ganjil';
  parityProbabilities: Record<string, number>;
  primaryMagnitude: 'Besar' | 'Kecil';
  magnitudeProbabilities: Record<string, number>;
  // Shio 2026 (Tahun Kuda Api)
  topShios: number[]; // Nomor Shio 1..12 (Top 3)
  primaryJalur: 1 | 2 | 3;
  shioProbabilities: Record<number, number>;
  jalurProbabilities: Record<number, number>;
  overdueShios?: OverdueShioInfo[];
  overdueAlerts: OverdueAlert[];
  confidenceScore: number;
  movement?: MovementDynamics;
}

// ==========================================
// KINETIC MOVEMENT & POLA PERGERAKAN TYPES
// ==========================================

export interface MovementMagnitudeDetail {
  rhythm: 'ZIG_ZAG' | 'STREAK_REVERSAL' | 'TREND_FOLLOW';
  rhythmLabel: string;
  flipRate: number; // 0.0 - 1.0
  currentStreak: number;
  currentStreakState: 'Besar' | 'Kecil';
  historicalMaxStreak: number;
  velocitySlope: number; // pergerakan nilai 2D (+ naik, - turun)
  prediction: 'Besar' | 'Kecil';
  confidence: number;
  rationale: string;
}

export interface MovementParityDetail {
  kepalaPolarity: 'Genap' | 'Ganjil';
  kepalaOscillation: 'FLIP' | 'STICKY';
  ekorPolarity: 'Genap' | 'Ganjil';
  ekorOscillation: 'FLIP' | 'STICKY';
  trajectoryFlow: string; // e.g. "Ganjil-Genap -> Genap-Ganjil -> Ganjil-Ganjil"
  primaryParity: 'Genap-Genap' | 'Genap-Ganjil' | 'Ganjil-Genap' | 'Ganjil-Ganjil';
  confidence: number;
  rationale: string;
}

export interface MovementJalurDetail {
  orbitDirection: 'PUTARAN_MAJU' | 'PUTARAN_MUNDUR' | 'PANTULAN' | 'BERTAHAN';
  orbitLabel: string;
  lastTransitions: [1 | 2 | 3, 1 | 2 | 3][];
  predictedJalur: 1 | 2 | 3;
  predictedShios: number[];
  shioStepRhythm: 'TRIAD_HARMONIC' | 'CIONG_OPPOSITE' | 'STEP_CREEP' | 'STABLE';
  confidence: number;
  rationale: string;
}

export interface MovementBijiDetail {
  dominantStepDelta: number; // e.g. +2, +3, etc.
  stepLabel: string;
  isMirrorReflection: boolean;
  targetBiji: number[];
  confidence: number;
  rationale: string;
}

export interface MovementHistoryPoint {
  period: number;
  full: string;
  comb2D: string;
  kepala: number;
  ekor: number;
  magnitude: 'Besar' | 'Kecil';
  parity: string;
  biji: number;
  jalur: 1 | 2 | 3;
  shioNumber: number;
  shioName: string;
}

export interface MovementDynamics {
  magnitude: MovementMagnitudeDetail;
  parity: MovementParityDetail;
  jalur: MovementJalurDetail;
  biji: MovementBijiDetail;
  last5Draws: MovementHistoryPoint[];
}

// ==========================================
// POLA TARUNG 2D (KEPALA VS EKOR) TYPES
// ==========================================

export interface PolaTarungPrediction {
  rankedKepala: number[]; // 0-9
  rankedEkor: number[];   // 0-9
  kepalaScores: Record<number, number>;
  ekorScores: Record<number, number>;
  kepalaDirection: 'NAIK' | 'TURUN' | 'STABIL';
  ekorDirection: 'NAIK' | 'TURUN' | 'STABIL';
  tarung3x3: string[]; // 9 lines
  tarung4x4: string[]; // 16 lines
  tarung5x5: string[]; // 25 lines
}

// ==========================================
// HEATMAP & STATISTIK 2D TYPES
// ==========================================

export interface HeatmapCellData {
  comb2D: string;
  kepala: number;
  ekor: number;
  count: number;
  lastSeenGap: number;
  biji: number;
  parity: string;
  magnitude: 'Besar' | 'Kecil';
  shioNumber: number;
  shioName: string;
  shioEmoji: string;
  isTwin: boolean;
}

export interface PositionalDigitStat {
  digit: number;
  count: number;
  rate: number;
  lastSeenGap: number;
  status: 'HOT' | 'WARM' | 'COLD';
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface Heatmap2DStats {
  lookback: number;
  totalDraws: number;
  maxCount: number;
  cells: Record<string, HeatmapCellData>; // "00".."99"
  kepalaStats: Record<number, PositionalDigitStat>; // 0..9
  ekorStats: Record<number, PositionalDigitStat>;   // 0..9
  kineticTrace: {
    step: number; // 1 to 5
    comb2D: string;
    kepala: number;
    ekor: number;
  }[];
}

