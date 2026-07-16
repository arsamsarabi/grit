import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { buildAliasBlock, resolveBinaryPathForAlias, SHELL_MARKER_BEGIN, upsertAliasInRc } from "@/init/alias.ts";

describe("alias shell RC", () => {
  test("upsert is idempotent", () => {
    const dir = mkdtempSync(join(tmpdir(), "grit-alias-"));
    const rc = join(dir, ".zshrc");
    writeFileSync(rc, "# existing\n");
    upsertAliasInRc(rc, "grit", "bun /path/to/index.ts");
    upsertAliasInRc(rc, "g", "bun /path/to/index.ts");
    const content = readFileSync(rc, "utf8");
    const begins = content.split(SHELL_MARKER_BEGIN).length - 1;
    expect(begins).toBe(1);
    expect(content).toContain("alias g=");
    expect(content).not.toContain("alias grit=");
    rmSync(dir, { recursive: true, force: true });
  });

  test("buildAliasBlock", () => {
    const block = buildAliasBlock("grit", "arsams-grit");
    expect(block).toContain(SHELL_MARKER_BEGIN);
    expect(block).toContain("alias grit='arsams-grit'");
  });

  test("resolveBinaryPathForAlias uses stable shim for Homebrew libexec", () => {
    expect(
      resolveBinaryPathForAlias({
        argv1: "/opt/homebrew/Cellar/grit/0.2.1/libexec/src/index.ts",
        arsamsGritOnPath: "/opt/homebrew/bin/arsams-grit",
      })
    ).toBe("/opt/homebrew/bin/arsams-grit");
  });

  test("resolveBinaryPathForAlias keeps bun script for local dev", () => {
    expect(
      resolveBinaryPathForAlias({
        argv1: "/Users/dev/grit/src/index.ts",
        arsamsGritOnPath: "/opt/homebrew/bin/arsams-grit",
      })
    ).toBe("bun /Users/dev/grit/src/index.ts");
  });
});
