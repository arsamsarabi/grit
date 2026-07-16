import * as p from "@clack/prompts";

export type SpinnerOpts = {
  /** Shown when the task finishes successfully. */
  successMessage?: string;
};

function spinnerTitle(message: string): string {
  return message.replace(/\u2026/g, "...").replace(/\.+$/, "");
}

/**
 * Waiting UI for async work. Uses clack's spinner so failures stop the animation
 * before the caller prints the real error.
 */
export async function withSpinner<T>(message: string, fn: () => Promise<T>, opts: SpinnerOpts = {}): Promise<T> {
  const title = spinnerTitle(message);
  const s = p.spinner();
  s.start(title);
  try {
    const value = await fn();
    s.stop(opts.successMessage ?? `${title} done`);
    return value;
  } catch (err) {
    s.error();
    throw err;
  }
}
