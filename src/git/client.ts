import { execa } from "execa";

export class GitError extends Error {
  constructor(
    message: string,
    readonly exitCode?: number,
    readonly stderr?: string
  ) {
    super(message);
    this.name = "GitError";
  }
}

export type GitOptions = {
  cwd?: string;
  stdin?: string;
};

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return Buffer.from(value).toString("utf8");
  return "";
}

export async function git(args: string[], options: GitOptions = {}): Promise<string> {
  const result = await execa("git", args, {
    cwd: options.cwd ?? process.cwd(),
    reject: false,
    input: options.stdin,
  });
  if (result.failed) {
    throw new GitError(
      `git ${args.join(" ")} failed: ${asText(result.stderr) || asText(result.stdout)}`,
      result.exitCode,
      asText(result.stderr)
    );
  }
  return asText(result.stdout).trimEnd();
}

export async function gitOk(args: string[], options: GitOptions = {}): Promise<boolean> {
  try {
    await git(args, options);
    return true;
  } catch {
    return false;
  }
}

export async function assertGitRepo(cwd: string = process.cwd()): Promise<void> {
  const ok = await gitOk(["rev-parse", "--is-inside-work-tree"], { cwd });
  if (!ok) {
    throw new GitError("Not a git repository. Run grit inside a repository.");
  }
}

export async function currentBranch(cwd?: string): Promise<string> {
  return git(["branch", "--show-current"], { cwd });
}

export async function defaultBranchGuess(cwd?: string): Promise<string> {
  try {
    const sym = await git(["symbolic-ref", "refs/remotes/origin/HEAD"], { cwd });
    const parts = sym.split("/");
    return parts[parts.length - 1] || "main";
  } catch {
    if (await gitOk(["show-ref", "--verify", "--quiet", "refs/heads/main"], { cwd })) {
      return "main";
    }
    if (await gitOk(["show-ref", "--verify", "--quiet", "refs/heads/master"], { cwd })) {
      return "master";
    }
    return "main";
  }
}
