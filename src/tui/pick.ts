import * as p from "@clack/prompts";
import type { Option } from "@clack/prompts";
import { BACK, optionsWithBack, type Back } from "@/tui/nav.ts";

export const DEFAULT_PICK_PLACEHOLDER = "Type to filter…";

export type PickInput<T> = {
  message: string;
  options: Option<T>[];
  placeholder?: string;
  initialValue?: T;
  /** When true (default), append ← Back. Main menu sets false. */
  back?: boolean;
};

/** Build autocomplete args (testable without a TTY). */
export function pickArgs<T extends string>(opts: PickInput<T>) {
  const back = opts.back !== false;
  const options = optionsWithBack(
    opts.options as Array<{ value: T; label: string; hint?: string; disabled?: boolean }>,
    back
  );
  return {
    message: opts.message,
    options,
    placeholder: opts.placeholder ?? DEFAULT_PICK_PLACEHOLDER,
    ...(opts.initialValue !== undefined ? { initialValue: opts.initialValue } : {}),
  };
}

/**
 * Type-to-filter choice. Returns `BACK` if user picks ← Back or cancels (Esc),
 * unless `back: false` (then cancel is a clack cancel symbol for the caller to exit).
 */
export async function pick<T extends string>(opts: PickInput<T>): Promise<T | Back | symbol> {
  const back = opts.back !== false;
  const args = pickArgs(opts);
  const result = await p.autocomplete({
    ...args,
    options: args.options as Option<T | Back>[],
  });
  if (p.isCancel(result)) {
    return back ? BACK : result;
  }
  return result as T | Back;
}
