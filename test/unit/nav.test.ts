import { describe, expect, test } from "bun:test";
import { BACK, isBack, optionsWithBack } from "@/tui/nav.ts";
import { DEFAULT_PICK_PLACEHOLDER, pickArgs } from "@/tui/pick.ts";

describe("nav", () => {
  test("optionsWithBack appends ← Back by default", () => {
    const opts = optionsWithBack([{ value: "a", label: "A" }]);
    expect(opts.at(-1)?.value).toBe(BACK);
    expect(opts.at(-1)?.label).toBe("← Back");
    expect(isBack(BACK)).toBe(true);
  });

  test("optionsWithBack can disable Back", () => {
    const opts = optionsWithBack([{ value: "a", label: "A" }], false);
    expect(opts).toHaveLength(1);
  });
});

describe("pickArgs", () => {
  test("defaults placeholder and includes Back", () => {
    const args = pickArgs({
      message: "Choose",
      options: [{ value: "a", label: "A" }],
    });
    expect(args.placeholder).toBe(DEFAULT_PICK_PLACEHOLDER);
    expect(args.options.at(-1)?.value).toBe(BACK);
  });

  test("back: false skips Back option", () => {
    const args = pickArgs({
      message: "Choose",
      options: [{ value: "a", label: "A" }],
      back: false,
    });
    expect(args.options).toHaveLength(1);
  });
});
