#!/usr/bin/env bun
/**
 * Cross-compile standalone grit binaries for npm + Homebrew distribution.
 *
 * Usage:
 *   bun run build:binaries
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

const TARGETS = [
  { target: "bun-darwin-arm64", outfile: "arsams-grit-darwin-arm64" },
  { target: "bun-darwin-x64", outfile: "arsams-grit-darwin-x64" },
  { target: "bun-linux-arm64", outfile: "arsams-grit-linux-arm64" },
  { target: "bun-linux-x64", outfile: "arsams-grit-linux-x64" },
] as const;

mkdirSync(DIST, { recursive: true });

for (const { target, outfile } of TARGETS) {
  const outpath = join(DIST, outfile);
  console.log(`Building ${outfile} (${target})…`);
  const result = await $`bun build --compile --target=${target} --outfile=${outpath} src/index.ts`.cwd(ROOT);
  if (result.exitCode !== 0) {
    process.exit(result.exitCode ?? 1);
  }
}

console.log("Done.");
