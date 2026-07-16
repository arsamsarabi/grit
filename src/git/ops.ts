import { git } from "@/git/client.ts";
import { parseBranchList, parseLog, parsePorcelainStatus, type LogEntry, type RepoStatus } from "@/git/parsers.ts";

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

export async function createBranch(name: string, options: { cwd?: string; checkout?: boolean } = {}): Promise<void> {
  if (options.checkout !== false) {
    await git(["checkout", "-b", name], { cwd: options.cwd });
  } else {
    await git(["branch", name], { cwd: options.cwd });
  }
}

export async function checkoutBranch(name: string, cwd?: string): Promise<void> {
  await git(["checkout", name], { cwd });
}

export async function deleteBranch(name: string, options: { cwd?: string; force?: boolean } = {}): Promise<void> {
  await git(["branch", options.force ? "-D" : "-d", name], { cwd: options.cwd });
}

export async function commit(message: string, cwd?: string): Promise<void> {
  await git(["commit", "-m", message], { cwd });
}

export async function push(options: { cwd?: string; force?: boolean; setUpstream?: boolean } = {}): Promise<void> {
  const args = ["push"];
  if (options.force) args.push("--force-with-lease");
  if (options.setUpstream) args.push("-u", "origin", "HEAD");
  await git(args, { cwd: options.cwd });
}

export async function pull(options: { cwd?: string; rebase?: boolean; autostash?: boolean } = {}): Promise<void> {
  const args = ["pull"];
  if (options.rebase) args.push("--rebase");
  if (options.autostash) args.push("--autostash");
  await git(args, { cwd: options.cwd });
}

export async function fetch(
  options: { cwd?: string; all?: boolean; prune?: boolean; remote?: string } = {}
): Promise<void> {
  const args = ["fetch"];
  if (options.all) args.push("--all");
  if (options.prune) args.push("--prune");
  if (options.remote) args.push(options.remote);
  await git(args, { cwd: options.cwd });
}

export async function revertCommit(hash: string, options: { cwd?: string; noCommit?: boolean } = {}): Promise<void> {
  const args = ["revert", hash];
  if (options.noCommit) args.push("--no-commit");
  await git(args, { cwd: options.cwd });
}

export async function resetCommit(
  options: { cwd?: string; mode?: "soft" | "mixed" | "hard"; target?: string } = {}
): Promise<void> {
  const args = ["reset"];
  if (options.mode === "soft") args.push("--soft");
  else if (options.mode === "hard") args.push("--hard");
  else if (options.mode === "mixed") args.push("--mixed");
  if (options.target) args.push(options.target);
  else args.push("HEAD~1");
  await git(args, { cwd: options.cwd });
}

export async function getTags(cwd?: string): Promise<string[]> {
  const raw = await git(["tag", "--list"], { cwd });
  return raw
    .trim()
    .split("\n")
    .filter((t) => t);
}

export async function createTag(
  name: string,
  options: { cwd?: string; message?: string; annotated?: boolean } = {}
): Promise<void> {
  const args = ["tag"];
  if (options.annotated || options.message) {
    args.push("-a", name);
    if (options.message) args.push("-m", options.message);
  } else {
    args.push(name);
  }
  await git(args, { cwd: options.cwd });
}

export async function deleteTag(name: string, options: { cwd?: string; remote?: boolean } = {}): Promise<void> {
  await git(["tag", "-d", name], { cwd: options.cwd });
  if (options.remote) {
    await git(["push", "origin", `:refs/tags/${name}`], { cwd: options.cwd });
  }
}

export async function pushTags(options: { cwd?: string } = {}): Promise<void> {
  await git(["push", "--tags"], { cwd: options.cwd });
}

export async function getDiff(options: { cwd?: string; cached?: boolean; stat?: boolean } = {}): Promise<string> {
  const args = ["diff"];
  if (options.cached) args.push("--cached");
  if (options.stat) args.push("--stat");
  return await git(args, { cwd: options.cwd });
}
