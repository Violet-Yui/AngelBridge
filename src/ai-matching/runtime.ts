import { z } from "zod";
import { DoubaoArkMatchAssessmentProvider } from "./doubao-ark-provider";
import { FixtureAiMatchAssessmentProvider } from "./fixture-provider";
import type { AiMatchAssessmentProvider } from "./provider";

export const AiMatchModeSchema = z.enum(["fixture", "live_ai"]);

export const LiveAiMatchEnvironmentSchema = z.object({
  AI_MODE: z.literal("live_ai"),
  AI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().min(1),
  AI_BASE_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url().optional(),
  ),
});

export const createAiMatchAssessmentProvider = (
  environment: NodeJS.ProcessEnv,
): AiMatchAssessmentProvider => {
  const mode = AiMatchModeSchema.parse(environment.AI_MODE ?? "fixture");
  if (mode === "fixture") {
    return new FixtureAiMatchAssessmentProvider();
  }

  const config = LiveAiMatchEnvironmentSchema.parse(environment);
  return new DoubaoArkMatchAssessmentProvider({
    apiKey: config.AI_API_KEY,
    model: config.AI_MODEL,
    endpoint: config.AI_BASE_URL,
  });
};
