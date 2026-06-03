import type { NormalizedFinding } from "../types/domain.js";
import type { ScanStage } from "../types/domain.js";

export type ScanCoverage = {
  filesDiscovered: number;
  filesCandidates: number;
  filesScanned: number;
  filesSkipped: number;
  scanLimitApplied: boolean;
};

export type ScanProgress = Partial<ScanCoverage> & {
  stage: ScanStage;
  progress: number;
  message: string;
};

export type ScannerContext = {
  onProgress?: (progress: ScanProgress) => Promise<void> | void;
};

export type ScannerResult = {
  target: string;
  findings: NormalizedFinding[];
  coverage: ScanCoverage;
};

export interface ScannerAdapter {
  scan(repositoryUrl: string, context?: ScannerContext): Promise<ScannerResult>;
}
