export type GitHubRepositoryMetadata = {
  owner: string;
  name: string;
  fullName: string;
  avatarUrl: string;
  defaultBranch: string;
  language: string | null;
  visibility: string;
  sizeKb: number;
  pushedAt: Date | null;
};

type GitHubRepositoryResponse = {
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  default_branch: string;
  language: string | null;
  private: boolean;
  visibility?: string;
  size: number;
  pushed_at: string | null;
};

export function parseGitHubRepositoryUrl(repositoryUrl: string) {
  const url = new URL(repositoryUrl);
  const [owner, repositoryName] = url.pathname.replace(/^\/+|\/+$/g, "").split("/");

  if (url.hostname !== "github.com" || !owner || !repositoryName) {
    throw new Error("Only GitHub repository URLs are supported.");
  }

  return {
    owner,
    repositoryName: repositoryName.replace(/\.git$/, "")
  };
}

export async function fetchGitHubRepositoryMetadata(repositoryUrl: string): Promise<GitHubRepositoryMetadata> {
  const { owner, repositoryName } = parseGitHubRepositoryUrl(repositoryUrl);
  const response = await fetch(`https://api.github.com/repos/${owner}/${repositoryName}`, {
    headers: buildGitHubHeaders()
  });

  if (!response.ok) {
    throw new Error(await formatGitHubMetadataError(response));
  }

  const payload = (await response.json()) as GitHubRepositoryResponse;

  return {
    owner: payload.owner.login,
    name: payload.name,
    fullName: payload.full_name,
    avatarUrl: payload.owner.avatar_url,
    defaultBranch: payload.default_branch,
    language: payload.language,
    visibility: payload.visibility ?? (payload.private ? "private" : "public"),
    sizeKb: payload.size,
    pushedAt: payload.pushed_at ? new Date(payload.pushed_at) : null
  };
}

function buildGitHubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "qmi-poc-scanner",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function formatGitHubMetadataError(response: Response) {
  if (response.status === 404) {
    return "Repository not found or not publicly accessible.";
  }

  if (response.status === 403) {
    return "GitHub API rate limit reached. Try again later or configure a server-side GITHUB_TOKEN.";
  }

  const payload = await response.json().catch(() => null);
  const detail = payload && typeof payload.message === "string" ? ` ${payload.message}` : "";

  return `GitHub repository metadata request failed.${detail}`;
}
