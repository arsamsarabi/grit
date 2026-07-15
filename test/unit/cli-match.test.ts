import { describe, expect, test } from "bun:test";
import { createProgram } from "@/cli/program.ts";

describe("cli command matching", () => {
  test("matches branch <action> with flags", () => {
    const cli = createProgram();
    cli.parse(
      [
        "node",
        "arsams-grit",
        "branch",
        "new",
        "--type",
        "feat",
        "--ticket",
        "GRIT-1",
        "--slug",
        "local-test",
      ],
      { run: false },
    );
    expect(cli.matchedCommand?.name).toBe("branch");
    expect(cli.args).toEqual(["new"]);
  });

  test("matches stash list", () => {
    const cli = createProgram();
    cli.parse(["node", "arsams-grit", "stash", "list"], { run: false });
    expect(cli.matchedCommand?.name).toBe("stash");
    expect(cli.args).toEqual(["list"]);
  });
});
