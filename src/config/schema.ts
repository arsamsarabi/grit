import { z } from "zod";

export const emojiMapSchema = z.record(z.string(), z.string());

const DEFAULT_EMOJI_MAP = {
  feat: "✨",
  fix: "🐛",
  docs: "📝",
  chore: "🔧",
  refactor: "♻️",
  test: "✅",
  ci: "👷",
};

const branchSchema = z.object({
  template: z.string().default("{type}/{ticket}-{slug}"),
  types: z.array(z.string()).default(["fix", "feat", "docs", "chore", "refactor"]),
  ticketPattern: z.string().default("[A-Z]+-[0-9]+"),
});

const commitSchema = z.object({
  emoji: z
    .object({
      enabled: z.boolean().default(false),
      map: emojiMapSchema.default(DEFAULT_EMOJI_MAP),
    })
    .default({
      enabled: false,
      map: DEFAULT_EMOJI_MAP,
    }),
  types: z.array(z.string()).default(["fix", "feat", "docs", "chore", "refactor", "test", "ci"]),
});

const rebaseSchema = z.object({
  defaultUpstream: z.string().default("origin/main"),
  confirmForcePush: z.boolean().default(true),
});

const githubSchema = z.object({
  prTemplate: z.boolean().default(true),
});

export const gritConfigSchema = z.object({
  alias: z.string().default("grit"),
  editor: z.string().optional(),
  branch: branchSchema.default({
    template: "{type}/{ticket}-{slug}",
    types: ["fix", "feat", "docs", "chore", "refactor"],
    ticketPattern: "[A-Z]+-[0-9]+",
  }),
  commit: commitSchema.default({
    emoji: { enabled: false, map: DEFAULT_EMOJI_MAP },
    types: ["fix", "feat", "docs", "chore", "refactor", "test", "ci"],
  }),
  rebase: rebaseSchema.default({
    defaultUpstream: "origin/main",
    confirmForcePush: true,
  }),
  github: githubSchema.default({
    prTemplate: true,
  }),
});

export type GritConfig = z.infer<typeof gritConfigSchema>;
export type GritConfigInput = z.input<typeof gritConfigSchema>;
