export type FileStatus = {
  path: string;
  index: string;
  worktree: string;
};

export type RepoStatus = {
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  staged: FileStatus[];
  unstaged: FileStatus[];
  untracked: FileStatus[];
  clean: boolean;
};

export function parsePorcelainStatus(
  porcelain: string,
  branchLine: string,
): Omit<RepoStatus, "branch"> & { branch: string } {
  const staged: FileStatus[] = [];
  const unstaged: FileStatus[] = [];
  const untracked: FileStatus[] = [];

  let upstream: string | null = null;
  let ahead = 0;
  let behind = 0;
  let branch = "HEAD";

  // ## main...origin/main [ahead 1, behind 2]
  const header = branchLine.match(/^##\s+(\S+?)(?:\.\.\.(\S+))?(?:\s+\[([^\]]+)\])?$/);
  if (header) {
    branch = header[1] === "HEAD" ? "HEAD" : header[1].replace(/\.\.\..*$/, "");
    // when detached: ## HEAD (no upstream)
    const name = header[1];
    if (name.includes("...")) {
      const [local, remote] = name.split("...");
      branch = local;
      upstream = remote;
    } else {
      branch = name === "HEAD" ? "HEAD" : name;
      upstream = header[2] ?? null;
    }
    const tracking = header[3];
    if (tracking) {
      const aheadMatch = tracking.match(/ahead (\d+)/);
      const behindMatch = tracking.match(/behind (\d+)/);
      if (aheadMatch) ahead = Number(aheadMatch[1]);
      if (behindMatch) behind = Number(behindMatch[1]);
    }
  }

  for (const line of porcelain.split("\n")) {
    if (!line || line.startsWith("##")) continue;
    const index = line[0] ?? " ";
    const worktree = line[1] ?? " ";
    const path = line.slice(3);
    if (!path) continue;

    const entry: FileStatus = { path, index, worktree };
    if (index === "?" && worktree === "?") {
      untracked.push(entry);
      continue;
    }
    if (index !== " " && index !== "?") {
      staged.push(entry);
    }
    if (worktree !== " " && worktree !== "?") {
      unstaged.push(entry);
    }
  }

  return {
    branch,
    upstream,
    ahead,
    behind,
    staged,
    unstaged,
    untracked,
    clean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0,
  };
}

export type LogEntry = {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  date: string;
};

export function parseLog(raw: string): LogEntry[] {
  if (!raw.trim()) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, shortHash, subject, author, date] = line.split("\t");
      return {
        hash: hash ?? "",
        shortHash: shortHash ?? "",
        subject: subject ?? "",
        author: author ?? "",
        date: date ?? "",
      };
    });
}

export function parseBranchList(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.replace(/^\*?\s+/, "").trim())
    .filter((name) => name && !name.includes("->"));
}
