import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { execa } from "execa";
import { renderBranchName } from "@/config/branch-template.ts";
import { commit, createBranch, getStatus, stageAll } from "@/git/ops.ts";

let repo: string;

beforeAll(async () => {
  repo = mkdtempSync(join(import.meta.dir, "..", "..", ".tmp-test-"));
  // Empty template skips sample hooks (fails under some sandbox policies)
  await execa("git", ["init", "--template=", "-b", "main"], { cwd: repo });
  await execa("git", ["config", "user.email", "grit@test.local"], { cwd: repo });
  await execa("git", ["config", "user.name", "Grit Test"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "# test\n");
  await execa("git", ["add", "."], { cwd: repo });
  await execa("git", ["commit", "-m", "chore: init"], { cwd: repo });
});

afterAll(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe("git ops integration", () => {
  test("create branch and commit", async () => {
    const name = renderBranchName("{type}/{ticket}-{slug}", {
      type: "feat",
      ticket: "GRIT-1",
      slug: "hello",
    });
    await createBranch(name, { cwd: repo });
    writeFileSync(join(repo, "hello.txt"), "hi\n");
    await stageAll(repo);
    await commit("feat: hello", repo);
    const status = await getStatus(repo);
    expect(status.branch).toBe(name);
    expect(status.clean).toBe(true);
  });
});
