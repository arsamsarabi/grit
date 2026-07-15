import { describe, expect, test } from "bun:test";
import { BACK } from "@/tui/nav.ts";
import { DEFAULT_PICK_PLACEHOLDER, pickArgs } from "@/tui/pick.ts";

describe("pickArgs", () => {
  test("defaults placeholder to Type to filter…", () => {
    const args = pickArgs({
      message: "Choose",
      options: [{ value: "a", label: "A" }],
      back: false,
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
      back: false,
    });
    expect(args.placeholder).toBe("Search…");
  });

  test("includes Back option by default", () => {
    const args = pickArgs({
      message: "Choose",
      options: [{ value: "a", label: "A" }],
    });
    expect(args.options.some((o) => o.value === BACK)).toBe(true);
  });
});
