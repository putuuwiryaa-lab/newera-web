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

export interface EvaluationMetrics {
  totalDraws: number;
  testDraws: number;
  twinCount: number;
  twinRate: number;
  aiStats: Record<number, AIStat>;
  bbfsStats: Record<number, BBFSStat>;
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

export interface DayTuningLog {
  periodIndex: number;
  fullResult: string;
  target2D: string;
  isTwin: boolean;
  ai: AITuningDetail;
  bbfs: BBFSTuningDetail;

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
