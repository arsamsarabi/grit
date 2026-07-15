import { describe, expect, test } from "bun:test";
import { DEFAULT_PICK_PLACEHOLDER, pickArgs } from "../../src/tui/pick.ts";

describe("pickArgs", () => {
  test("defaults placeholder to Type to filter…", () => {
    const args = pickArgs({
      message: "Choose",
      options: [{ value: "a", label: "A" }],
    });
    expect(args.placeholder).toBe(DEFAULT_PICK_PLACEHOLDER);
    expect(args.placeholder).toBe("Type to filter…");
    expect(args.message).toBe("Choose");
  });

  test("allows placeholder override", () => {
    const args = pickArgs({
      message: "Choose",
      options: [{ value: "a", label: "A" }],
      placeholder: "Search…",
    });
    expect(args.placeholder).toBe("Search…");
  });
});
