import type { Finding } from "./api";

export function getRepositoryFilePath(filePath: string | null | undefined) {
  if (!filePath) {
    return null;
  }

  const normalizedPath = filePath.replace(/^file:\/\//, "").replace(/\\/g, "/").replace(/^\.\/+/, "");
  const cryptoScanTempMatch = normalizedPath.match(/(?:^|\/)tmp\/cryptoscan-[^/]+\/(.+)$/);
  const repositoryPath = cryptoScanTempMatch?.[1] ?? normalizedPath;
  const cleanPath = repositoryPath.replace(/^\/+/, "");

  if (!cleanPath || cleanPath.startsWith("tmp/") || cleanPath.includes("/../") || cleanPath.startsWith("../")) {
    return null;
  }

  return cleanPath;
}

export function buildGitHubLocationUrl(repositoryUrl: string | null, defaultBranch: string | null, finding: Finding) {
  const filePath = getRepositoryFilePath(finding.filePath);

  if (!repositoryUrl || !filePath || !repositoryUrl.startsWith("https://github.com/")) {
    return null;
  }

  const cleanRepositoryUrl = repositoryUrl.replace(/\.git$/, "").replace(/\/$/, "");
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  const lineSuffix = finding.line ? `#L${finding.line}` : "";

  return `${cleanRepositoryUrl}/blob/${defaultBranch ?? "HEAD"}/${encodedPath}${lineSuffix}`;
}

export function formatFindingLocation(finding: Finding, unknownLocation: string) {
  const filePath = getRepositoryFilePath(finding.filePath);

  if (!filePath) {
    return unknownLocation;
  }

  return `${filePath}${finding.line ? `:${finding.line}` : ""}`;
}

export function formatCategory(category: string) {
  return category.replace(/-/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}
