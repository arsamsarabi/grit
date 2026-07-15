import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildAliasBlock, SHELL_MARKER_BEGIN, upsertAliasInRc } from "../../src/init/alias.ts";

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
});
