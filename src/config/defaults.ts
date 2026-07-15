import type { GritConfig } from "./schema.ts";
import { gritConfigSchema } from "./schema.ts";

export const defaultConfig: GritConfig = gritConfigSchema.parse({});

export const DEFAULT_EMOJI_MAP: Record<string, string> = {
  feat: "✨",
  fix: "🐛",
  docs: "📝",
  chore: "🔧",
  refactor: "♻️",
  test: "✅",
  ci: "👷",
};

export const ALIAS_CANDIDATES = ["grit", "g", "gg"] as const;
