import * as p from "@clack/prompts";

export type SpinnerOpts = {
  /** Final message on success (default: strip trailing … from start message). */
  successMessage?: string;
  /** Final message on failure before rethrow. */
  errorMessage?: string;
  /** Show elapsed time (default true) — clearer during long git hooks. */
  timer?: boolean;
};

/** Run work under a clack spinner (stderr + timer so hooks don't wipe it). */
export async function withSpinner<T>(message: string, fn: () => Promise<T>, opts: SpinnerOpts = {}): Promise<T> {
  const s = p.spinner({
    indicator: opts.timer === false ? "dots" : "timer",
    // Keep off stdout so git/husky/lint-staged TTY noise fights the spinner less.
    output: process.stderr,
  });
  s.start(message);
  try {
    const result = await fn();
    s.stop(opts.successMessage ?? doneLabel(message));
    return result;
  } catch (err) {
    s.error(opts.errorMessage ?? "Failed");
    throw err;
  }
}

function doneLabel(message: string): string {
  return (
    message
      .replace(/\u2026$/, "")
      .replace(/\.\.\.$/, "")
      .trim() || "Done"
  );
}
