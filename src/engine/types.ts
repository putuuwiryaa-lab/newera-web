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
}

