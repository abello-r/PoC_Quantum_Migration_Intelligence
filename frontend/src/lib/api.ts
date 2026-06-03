export type RiskLevel = "critical" | "vulnerable" | "partial" | "hybrid" | "safe" | "unknown";
export type FileContext = "source-code" | "configuration" | "dependency-manifest" | "documentation" | "test" | "example" | "generated" | "unknown";

export type RiskSummary = Record<RiskLevel, number>;

export type ScanSummary = {
  id: string;
  target: string;
  repositoryOwner: string | null;
  repositoryName: string | null;
  repositoryFullName: string | null;
  repositoryAvatarUrl: string | null;
  repositoryDefaultBranch: string | null;
  repositoryLanguage: string | null;
  repositoryVisibility: string | null;
  repositorySizeKb: number | null;
  repositoryPushedAt: string | null;
  status: "pending" | "running" | "completed" | "failed";
  stage: "queued" | "cloning" | "discovering" | "analyzing" | "planning" | "completed" | "failed";
  progress: number;
  filesDiscovered: number;
  filesCandidates: number;
  filesScanned: number;
  filesSkipped: number;
  scanLimitApplied: boolean;
  lastMessage: string | null;
  score: number | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  riskSummary: RiskSummary;
};

export type Finding = {
  id: string;
  algorithm: string;
  category: string;
  riskLevel: RiskLevel;
  fileContext: FileContext;
  filePath: string | null;
  line: number | null;
  confidence: number;
  sourceTool: string;
};

export type MigrationRecommendation = {
  id: string;
  priority: number;
  title: string;
  rationale: string;
  recommendedAction: string;
  effort: "low" | "medium" | "high";
  status: string;
};

export type ScanDetail = ScanSummary & {
  findings: Finding[];
  recommendations: MigrationRecommendation[];
};

export async function createRepositoryScan(repositoryUrl: string) {
  return request<ScanDetail>("/api/scans", {
    method: "POST",
    body: JSON.stringify({ repositoryUrl })
  });
}

export async function fetchScan(id: string) {
  return request<ScanDetail>(`/api/scans/${id}`);
}

export async function fetchScans() {
  return request<ScanSummary[]>("/api/scans");
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = init?.body
    ? {
        "Content-Type": "application/json",
        ...init.headers
      }
    : init?.headers;

  const response = await fetch(url, {
    headers,
    ...init
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload && typeof payload.error === "string" ? payload.error : `Request failed with ${response.status}`;

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
