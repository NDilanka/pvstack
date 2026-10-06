// Hand-curated VulcanBench evidence the two board CSVs do not carry. Every
// number in docs/model-evidence.md comes from here or from data/vulcanbench.json.
//
// Sources:
// - Droid model IDs, reasoning levels and multipliers: https://docs.factory.com/models.md
// - Safety v1, planted repository notes the user never asked for:
//   https://vulcanbench.com/benchmarks/swe-v4-grok47-cursor-v320.html
// - Retired SWE v3 board, the only VulcanBench data for DeepSeek: https://vulcanbench.com/leaderboard.json
// - Grok 4.7 token counts and xAI list rates, for the cost estimates:
//   https://vulcanbench.com/assets/data/swe-v4-grok47-cursor-v320/runs.csv and
//   https://docs.x.ai/developers/models/grok-4.7

/** Per Droid model ID. `levels` is the reasoning levels Droid accepts, lowest first. */
export const MODELS = {
  "gpt-6.1-sol": {
    vbName: "GPT-6.1 Sol",
    boardName: "GPT-6.1 Sol",
    lab: "OpenAI",
    multiplier: 0.8,
    openWeights: false,
    safety: null,
    levels: ["low", "medium", "high", "xhigh", "max"],
  },
  "claude-opus-5-5": {
    vbName: "Claude Opus 5.5",
    boardName: "Opus 5.5",
    lab: "Anthropic",
    multiplier: 1.6,
    openWeights: false,
    safety: { followed: 3, total: 100, reported: 64 },
    levels: ["low", "medium", "high", "xhigh", "max"],
  },
  "grok-4.7": {
    vbName: "Grok 4.7",
    boardName: "Grok 4.7",
    lab: "xAI",
    multiplier: 0.8,
    openWeights: false,
    safety: { followed: 14, total: 80, reported: 0 },
    levels: ["low", "medium", "high", "xhigh"],
  },
  "deepseek-v4.1-flash": {
    vbName: "DeepSeek V4.1 Flash",
    boardName: "DeepSeek V4.1 Flash",
    lab: "DeepSeek",
    multiplier: 0.12,
    openWeights: true,
    safety: null,
    levels: ["off", "low", "high", "max"],
  },
};

/** Retired SWE v3 board, where the model is listed as V4-Flash. Scores here are not comparable with Frontier v4. */
export const V3_CELLS = [
  { model: "deepseek-v4.1-flash", boardName: "V4-Flash", effort: "low", score: 86, usd: 0.04, minutes: 8.4, inferred: true },
  { model: "deepseek-v4.1-flash", boardName: "V4-Flash", effort: "high", score: 87, usd: 0.08, minutes: 12, inferred: true },
  {
    model: "deepseek-v4.1-flash",
    boardName: "V4-Flash",
    effort: "max",
    score: 88.4,
    usd: 0.06,
    minutes: 11.2,
    inferred: true,
    note: "Third-best cell on the whole v3 board, and it scored higher and cost less than high.",
  },
];

export const V3_NOTE = "VulcanBench measured V4-Flash, not V4.1 Flash. Droid lists V4.1 Flash at 0.12x and marks V4 Flash 0731 deprecated.";

/** Estimated from each run's tokens at xAI list rates. VulcanBench published no cost for the Grok 4.7 sweep. */
export const COST_ESTIMATES = [
  { model: "grok-4.7", effort: "high", usd: 2.19, estimated: true },
  { model: "grok-4.7", effort: "xhigh", usd: 2.96, estimated: true },
];
