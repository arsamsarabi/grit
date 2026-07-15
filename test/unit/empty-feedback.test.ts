import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execa } from "execa";
import { getLog } from "../../src/git/ops.ts";

describe("empty log feedback", () => {
  test("getLog returns [] for unborn repo (caller can sayEmpty)", async () => {
    const repo = mkdtempSync(join(import.meta.dir, "..", "..", ".tmp-test-"));
    await execa("git", ["init", "--template=", "-b", "main"], { cwd: repo });
    const entries = await getLog(repo, 5);
    expect(entries).toEqual([]);
    rmSync(repo, { recursive: true, force: true });
  });
});
