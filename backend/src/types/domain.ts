export const scanStatuses = ["pending", "running", "completed", "failed"] as const;
export const scanStages = ["queued", "cloning", "discovering", "analyzing", "planning", "completed", "failed"] as const;
export const riskLevels = ["critical", "vulnerable", "partial", "hybrid", "safe", "unknown"] as const;
export const fileContexts = ["source-code", "configuration", "dependency-manifest", "documentation", "test", "example", "generated", "unknown"] as const;
export const efforts = ["low", "medium", "high"] as const;

export type ScanStatus = (typeof scanStatuses)[number];
export type ScanStage = (typeof scanStages)[number];
export type RiskLevel = (typeof riskLevels)[number];
export type FileContext = (typeof fileContexts)[number];
export type Effort = (typeof efforts)[number];

export type NormalizedFinding = {
  algorithm: string;
  category: string;
  riskLevel: RiskLevel;
  fileContext: FileContext;
  filePath?: string;
  line?: number;
  confidence: number;
  sourceTool: string;
  rawMetadata?: Record<string, unknown>;
};

export type MigrationRecommendationDraft = {
  priority: number;
  title: string;
  rationale: string;
  recommendedAction: string;
  effort: Effort;
};
