import { describe, expect, test } from "bun:test";
import { extractTicket, renderBranchName, slugify } from "../../src/config/branch-template.ts";
import { formatCommitMessage } from "../../src/config/commit-message.ts";
import { gritConfigSchema } from "../../src/config/schema.ts";
import { parseLog, parsePorcelainStatus } from "../../src/git/parsers.ts";

describe("branch template", () => {
  test("renders type/ticket-slug", () => {
    expect(
      renderBranchName("{type}/{ticket}-{slug}", {
        type: "feat",
        ticket: "TRF-123",
        slug: "Add Login",
      }),
    ).toBe("feat/TRF-123-add-login");
  });

  test("omits empty ticket cleanly", () => {
    expect(
      renderBranchName("{type}/{ticket}-{slug}", {
        type: "fix",
        slug: "typo",
      }),
    ).toBe("fix/typo");
  });

  test("slugify", () => {
    expect(slugify(" Hello World! ")).toBe("hello-world");
  });

  test("extractTicket", () => {
    expect(extractTicket("feat/TRF-99-foo", "[A-Z]+-[0-9]+")).toBe("TRF-99");
  });
});

describe("commit message", () => {
  test("formats conventional commit", () => {
    expect(formatCommitMessage({ type: "feat", scope: "ui", summary: "add button" })).toBe(
      "feat(ui): add button",
    );
  });

  test("prepends emoji when enabled", () => {
    expect(
      formatCommitMessage({
        type: "feat",
        summary: "add button",
        emojiEnabled: true,
        emojiMap: { feat: "✨" },
      }),
    ).toBe("✨ feat: add button");
  });

  test("includes body", () => {
    expect(
      formatCommitMessage({
        type: "fix",
        summary: "bug",
        body: "details here",
      }),
    ).toBe("fix: bug\n\ndetails here");
  });
});

describe("config schema", () => {
  test("parses empty object to defaults", () => {
    const cfg = gritConfigSchema.parse({});
    expect(cfg.alias).toBe("grit");
    expect(cfg.branch.template).toContain("{type}");
    expect(cfg.commit.emoji.enabled).toBe(false);
  });
});

describe("parsers", () => {
  test("parsePorcelainStatus", () => {
    const raw = [
      "## main...origin/main [ahead 1, behind 2]",
      "M  staged.txt",
      " M dirty.txt",
      "?? new.txt",
    ].join("\n");
    const status = parsePorcelainStatus(raw, raw.split("\n")[0]);
    expect(status.branch).toBe("main");
    expect(status.upstream).toBe("origin/main");
    expect(status.ahead).toBe(1);
    expect(status.behind).toBe(2);
    expect(status.staged.map((f) => f.path)).toEqual(["staged.txt"]);
    expect(status.unstaged.map((f) => f.path)).toEqual(["dirty.txt"]);
    expect(status.untracked.map((f) => f.path)).toEqual(["new.txt"]);
    expect(status.clean).toBe(false);
  });

  test("parseLog", () => {
    const entries = parseLog("abc\tdef\tsubject\tAda\t2026-01-01");
    expect(entries).toHaveLength(1);
    expect(entries[0].shortHash).toBe("def");
    expect(entries[0].subject).toBe("subject");
  });
});
