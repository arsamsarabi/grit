import { which } from "bun";
import { execa, type Options } from "execa";

export class GhError extends Error {
  constructor(
    message: string,
    readonly exitCode?: number,
  ) {
    super(message);
    this.name = "GhError";
  }
}

export async function isGhAvailable(): Promise<boolean> {
  return Boolean(which("gh"));
}

export async function gh(args: string[], options: { cwd?: string } = {}): Promise<string> {
  if (!(await isGhAvailable())) {
    throw new GhError("GitHub CLI (gh) is not installed. See https://cli.github.com");
  }
  const execOptions: Options = {
    cwd: options.cwd ?? process.cwd(),
    reject: false,
  };
  const result = await execa("gh", args, execOptions);
  if (result.failed) {
    const err =
      typeof result.stderr === "string"
        ? result.stderr
        : typeof result.stdout === "string"
          ? result.stdout
          : "unknown error";
    throw new GhError(`gh ${args.join(" ")} failed: ${err}`, result.exitCode);
  }
  return typeof result.stdout === "string" ? result.stdout.trimEnd() : "";
}

export async function ghAuthOk(cwd?: string): Promise<boolean> {
  try {
    await gh(["auth", "status"], { cwd });
    return true;
  } catch {
    return false;
  }
}

export type PrView = {
  number: number;
  title: string;
  url: string;
  state: string;
  statusCheckRollup?: Array<{ state: string }>;
};

export async function getPrForBranch(cwd?: string): Promise<PrView | null> {
  try {
    const raw = await gh(["pr", "view", "--json", "number,title,url,state,statusCheckRollup"], {
      cwd,
    });
    return JSON.parse(raw) as PrView;
  } catch {
    return null;
  }
}

export async function createPr(options: {
  title: string;
  body: string;
  draft?: boolean;
  cwd?: string;
}): Promise<string> {
  const args = ["pr", "create", "--title", options.title, "--body", options.body];
  if (options.draft) args.push("--draft");
  return gh(args, { cwd: options.cwd });
}

export async function createRelease(options: {
  tag: string;
  title: string;
  notes: string;
  cwd?: string;
}): Promise<string> {
  return gh(
    ["release", "create", options.tag, "--title", options.title, "--notes", options.notes],
    { cwd: options.cwd },
  );
}
