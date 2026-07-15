import * as p from "@clack/prompts";

export type SpinnerOpts = {
  /** Shown when the task finishes successfully. */
  successMessage?: string;
};

/**
 * Waiting UI for async work.
 * - `log.step` stays in the scrollback (survives hook spam)
 * - `tasks` animates on stdout like the rest of the TUI
 */
export async function withSpinner<T>(message: string, fn: () => Promise<T>, opts: SpinnerOpts = {}): Promise<T> {
  const title = message.replace(/\u2026/g, "...").replace(/\.+$/, "");
  p.log.step(title);

  let value!: T;
  await p.tasks([
    {
      title,
      task: async () => {
        value = await fn();
        return opts.successMessage ?? `${title} done`;
      },
    },
  ]);
  return value;
}
