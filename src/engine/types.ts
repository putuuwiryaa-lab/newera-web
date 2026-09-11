import type { ShioInfo } from './shio';

export interface Market {
  id: string;
  name: string;
  history_data: string;
  history_days?: string | string[];
  order: number;
  updated_at?: string;
  next_prediction?: any;
  latest_prediction?: any; // legacy compatibility
  last_audit?: any;
}

export interface PredictionResult {
  rankedDigits: number[];
  tierRankedDigits?: Record<number, number[]>;
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
  tierMethodWeights: Record<number, Record<string, number>>;
  bbfsTierWeights: Record<number, Record<string, number>>;
  confidenceScore: number;
  convergenceStatus: 'TINGGI' | 'SEDANG' | 'RENDAH';
  deadDigits: number[];
  paitoPrediction?: PaitoMacroPrediction;
  polaTarung?: PolaTarungPrediction;
  paitoBBFS7?: PaitoBBFS7Result;
  wheeling7?: WheelingResult;
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
  superSniperActiveDraws?: number;
  superSniperParticipationRate?: number;
  avgSuperSniperLines?: number;
  superSniperPnlNet?: number;
  sniperBomHits: number;
  sniperBomRate: number;
  sniperActiveDraws: number;
  sniperParticipationRate: number;
  avgSniperLines: number;
  sniperPnlNet: number;
  bbfs7PaitoProHits?: number;
  bbfs7PaitoProRate?: number;
  bbfs7PaitoProPnl?: number;
  nuklir6Hits?: number;
  nuklir6Rate?: number;
  nuklir6Pnl?: number;
  bom12Hits?: number;
  bom12Rate?: number;
  bom12Pnl?: number;
  tarung4x4Hits?: number;
  tarung4x4Rate?: number;
  tarung4x4Pnl?: number;
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
  day?: string;
}

export interface TierAuditStatus {
  size: number;
  name: string;
  parameter?: string;
  status: 'HIT' | 'LOSE';
  action: 'FREEZE' | 'CALIBRATED';
  tuningDirective?: string;
  marginalNote?: string;
}

export interface AITuningDetail {
  predictedTiers: Record<number, number[]>;
  tierAudits: Record<number, TierAuditStatus>;
  hitDigits: number[];
  statusAI4: 'HIT' | 'LOSE';
  rewardedMethods: string[];
  penalizedMethods: string[];
  calibratedWeights: Record<string, number>;
  calibratedTierWeights?: Record<number, Record<string, number>>;
  tierMethodWeights?: Record<number, Record<string, number>>;
  recoveredFromLoss?: boolean;
  streak: number;
  recommendedTier: string;
  actionSummary: string;
}

export interface BBFSTuningDetail {
  predictedTiers: Record<number, number[]>;
  tierAudits: Record<number, TierAuditStatus>;
  deadDigits: number[];
  deadDigitsClean: boolean;
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
  topShios: number[];
  primaryJalur: 1 | 2 | 3;
  shioProbabilities: Record<number, number>;
  jalurProbabilities: Record<number, number>;
  overdueShios?: OverdueShioInfo[];
  overdueAlerts: OverdueAlert[];
  confidenceScore: number;
  movement?: MovementDynamics;
}

export interface MovementMagnitudeDetail {
  rhythm: 'ZIG_ZAG' | 'STREAK_REVERSAL' | 'TREND_FOLLOW';
  rhythmLabel: string;
  flipRate: number;
  currentStreak: number;
  currentStreakState: 'Besar' | 'Kecil';
  historicalMaxStreak: number;
  velocitySlope: number;
  prediction: 'Besar' | 'Kecil';
  confidence: number;
  rationale: string;
}

export interface MovementParityDetail {
  kepalaPolarity: 'Genap' | 'Ganjil';
  kepalaOscillation: 'FLIP' | 'STICKY';
  ekorPolarity: 'Genap' | 'Ganjil';
  ekorOscillation: 'FLIP' | 'STICKY';
  trajectoryFlow: string;
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
  dominantStepDelta: number;
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

export interface PolaTarungPrediction {
  rankedKepala: number[];
  rankedEkor: number[];
  kepalaScores: Record<number, number>;
  ekorScores: Record<number, number>;
  kepalaDirection: 'NAIK' | 'TURUN' | 'STABIL';
  ekorDirection: 'NAIK' | 'TURUN' | 'STABIL';
  tarung3x3: string[];
  tarung4x4: string[];
  tarung5x5: string[];
}

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
  cells: Record<string, HeatmapCellData>;
  kepalaStats: Record<number, PositionalDigitStat>;
  ekorStats: Record<number, PositionalDigitStat>;
  kineticTrace: {
    step: number;
    comb2D: string;
    kepala: number;
    ekor: number;
  }[];
}

export interface DeadDigitDetail {
  digit: number;
  safetyScore: number;
  status: 'AMAN' | 'WASPADA' | 'NETRAL';
  reason: string;
  gap: number;
}

export interface PaitoBBFS7Result {
  digits: number[];
  ranked7: number[];
  nuklir6: string[];
  bom12: string[];
  invest20: string[];
  full42: string[];
  twin7: string[];
  triadKumat: DeadDigitDetail[];
  spectrumBalance: {
    besarCount: number;
    kecilCount: number;
    genapCount: number;
    ganjilCount: number;
    entropyScore: number;
    isBalanced: boolean;
  };
  synthesisDetails: {
    bijiContribution: Record<number, number>;
    parityContribution: Record<number, number>;
    shioContribution: Record<number, number>;
    heatmapContribution: Record<number, number>;
  };
}

export interface WheelingResult {
  wheel3D: string[];
  wheel3DFull: string[];
  wheel4D: string[];
  wheel4DFull: string[];
  guarantee3D: string;
  guarantee4D: string;
}
