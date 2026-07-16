import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { which } from "bun";
import { execa } from "execa";
import { ALIAS_CANDIDATES } from "@/config/defaults.ts";

export const SHELL_MARKER_BEGIN = "# >>> grit alias >>>";
export const SHELL_MARKER_END = "# <<< grit alias <<<";

export type AliasProbe = {
  name: string;
  free: boolean;
  ownerHint: string | null;
};

export async function probeAlias(name: string): Promise<AliasProbe> {
  const path = which(name);
  if (!path) {
    return { name, free: true, ownerHint: null };
  }
  try {
    const result = await execa(name, ["--version"], {
      reject: false,
      timeout: 3000,
    });
    const out = `${result.stdout}\n${result.stderr}`.trim();
    return { name, free: false, ownerHint: out.split("\n")[0] || path };
  } catch {
    return { name, free: false, ownerHint: path };
  }
}

export async function probeAliasCandidates(): Promise<AliasProbe[]> {
  const results: AliasProbe[] = [];
  for (const name of ALIAS_CANDIDATES) {
    results.push(await probeAlias(name));
  }
  return results;
}

export function detectShellRc(): string | null {
  const shell = process.env.SHELL ?? "";
  const home = homedir();
  if (shell.includes("zsh")) return join(home, ".zshrc");
  if (shell.includes("bash")) {
    const bashrc = join(home, ".bashrc");
    const bashProfile = join(home, ".bash_profile");
    if (existsSync(bashrc)) return bashrc;
    return bashProfile;
  }
  if (shell.includes("fish")) return join(home, ".config", "fish", "config.fish");
  // fallback
  const zshrc = join(home, ".zshrc");
  if (existsSync(zshrc)) return zshrc;
  return null;
}

export function buildAliasBlock(alias: string, binaryPath: string, fish = false): string {
  if (fish) {
    return [SHELL_MARKER_BEGIN, `alias ${alias}='${binaryPath}'`, SHELL_MARKER_END].join("\n");
  }
  return [SHELL_MARKER_BEGIN, `alias ${alias}='${binaryPath}'`, SHELL_MARKER_END].join("\n");
}

export function upsertAliasInRc(rcPath: string, alias: string, binaryPath: string): void {
  const fish = rcPath.endsWith("config.fish");
  const block = buildAliasBlock(alias, binaryPath, fish);
  let content = existsSync(rcPath) ? readFileSync(rcPath, "utf8") : "";

  if (content.includes(SHELL_MARKER_BEGIN) && content.includes(SHELL_MARKER_END)) {
    const re = new RegExp(`${escapeRegExp(SHELL_MARKER_BEGIN)}[\\s\\S]*?${escapeRegExp(SHELL_MARKER_END)}`, "m");
    content = content.replace(re, block);
  } else {
    content = `${content.trimEnd()}\n\n${block}\n`;
  }

  writeFileSync(rcPath, content, "utf8");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resolveBinaryPathForAlias(opts: { argv1?: string; arsamsGritOnPath?: string | null }): string {
  const { argv1: script, arsamsGritOnPath: installed } = opts;
  // Homebrew/npm: alias the stable shim, not a versioned Cellar/libexec path.
  if (installed && script?.includes("/libexec/src/index.ts")) {
    return installed;
  }
  if (script?.endsWith(".ts")) return `bun ${script}`;
  return installed ?? "arsams-grit";
}

export function resolveBinaryPath(): string {
  return resolveBinaryPathForAlias({
    argv1: process.argv[1],
    arsamsGritOnPath: which("arsams-grit"),
  });
}
