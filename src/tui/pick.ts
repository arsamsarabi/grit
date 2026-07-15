import * as p from "@clack/prompts";
import type { Option } from "@clack/prompts";

export const DEFAULT_PICK_PLACEHOLDER = "Type to filter…";

export type PickInput<T> = {
  message: string;
  options: Option<T>[];
  placeholder?: string;
  initialValue?: T;
};

/** Build autocomplete args (testable without a TTY). */
export function pickArgs<T>(opts: PickInput<T>) {
  return {
    message: opts.message,
    options: opts.options,
    placeholder: opts.placeholder ?? DEFAULT_PICK_PLACEHOLDER,
    ...(opts.initialValue !== undefined ? { initialValue: opts.initialValue } : {}),
  };
}

/** Type-to-filter single choice (clack autocomplete). */
export async function pick<T>(opts: PickInput<T>): Promise<T | symbol> {
  return p.autocomplete(pickArgs(opts));
}
