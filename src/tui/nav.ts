export const BACK = "__back__" as const;
export type Back = typeof BACK;

export function isBack(value: unknown): value is Back {
  return value === BACK;
}

/** Append a filterable Back option (skipped when `back: false`). */
export function optionsWithBack<T extends string>(
  options: Array<{ value: T; label: string; hint?: string; disabled?: boolean }>,
  back = true
): Array<{ value: T | Back; label: string; hint?: string; disabled?: boolean }> {
  if (!back) return options;
  return [...options, { value: BACK, label: "← Back", hint: "previous step" }];
}
