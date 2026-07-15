import { git } from "@/git/client.ts";
import {
  type LogEntry,
  parseBranchList,
  parseLog,
  parsePorcelainStatus,
  type RepoStatus,
} from "@/git/parsers.ts";

export async function getStatus(cwd?: string): Promise<RepoStatus> {
  const raw = await git(["status", "--porcelain=v1", "--branch"], { cwd });
  const lines = raw.split("\n");
  const branchLine = lines.find((l) => l.startsWith("##")) ?? "## HEAD";
  return parsePorcelainStatus(raw, branchLine);
}

export async function getBranches(cwd?: string, all = false): Promise<string[]> {
  const args = ["branch", "--list", "--format=%(refname:short)"];
  if (all) args.splice(1, 0, "-a");
  const raw = await git(args, { cwd });
  return parseBranchList(raw);
}

export async function getLog(cwd?: string, count = 20): Promise<LogEntry[]> {
  try {
    const raw = await git(["log", `-n`, String(count), "--pretty=format:%H\t%h\t%s\t%an\t%cs"], {
      cwd,
    });
    return parseLog(raw);
  } catch {
    return [];
  }
}

export async function lastCommit(cwd?: string): Promise<LogEntry | null> {
  const entries = await getLog(cwd, 1);
  return entries[0] ?? null;
}

export async function hasStagedChanges(cwd?: string): Promise<boolean> {
  const status = await getStatus(cwd);
  return status.staged.length > 0;
}

export async function stageAll(cwd?: string): Promise<void> {
  await git(["add", "-A"], { cwd });
}

export async function createBranch(
  name: string,
  options: { cwd?: string; checkout?: boolean } = {},
): Promise<void> {
  if (options.checkout !== false) {
    await git(["checkout", "-b", name], { cwd: options.cwd });
  } else {
    await git(["branch", name], { cwd: options.cwd });
  }
}

export async function checkoutBranch(name: string, cwd?: string): Promise<void> {
  await git(["checkout", name], { cwd });
}

export async function deleteBranch(
  name: string,
  options: { cwd?: string; force?: boolean } = {},
): Promise<void> {
  await git(["branch", options.force ? "-D" : "-d", name], { cwd: options.cwd });
}

export async function commit(message: string, cwd?: string): Promise<void> {
  await git(["commit", "-m", message], { cwd });
}

export async function push(
  options: { cwd?: string; force?: boolean; setUpstream?: boolean } = {},
): Promise<void> {
  const args = ["push"];
  if (options.force) args.push("--force-with-lease");
  if (options.setUpstream) args.push("-u", "origin", "HEAD");
  await git(args, { cwd: options.cwd });
}
