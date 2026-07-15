import * as p from "@clack/prompts";

/** Run work under a clack spinner. */
export async function withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T> {
  const s = p.spinner();
  s.start(message);
  try {
    const result = await fn();
    s.stop(message);
    return result;
  } catch (err) {
    s.stop(message);
    throw err;
  }
}
