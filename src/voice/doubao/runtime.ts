import { z } from "zod";
import { VoiceTurnService } from "../voice-turn-service";
import { DoubaoArkLanguageModelProvider } from "./ark-language-model-provider";
import { DoubaoFlashAsrProvider } from "./flash-asr-provider";
import { DoubaoSeedTtsProvider } from "./seed-tts-provider";

export const DoubaoVoiceEnvironmentSchema = z.object({
  VOICE_MODE: z.literal("live_ai"),
  DOUBAO_ARK_API_KEY: z.string().min(1),
  DOUBAO_ARK_MODEL: z.string().min(1),
  DOUBAO_SPEECH_API_KEY: z.string().min(1),
  DOUBAO_ASR_RESOURCE_ID: z.string().min(1).default("volc.bigasr.auc_turbo"),
  DOUBAO_TTS_RESOURCE_ID: z.string().min(1).default("seed-tts-2.0"),
  DOUBAO_TTS_SPEAKER: z.string().min(1),
  DOUBAO_TTS_STYLE: z.string().min(1).optional(),
});

export const createDoubaoVoiceTurnService = (
  environment: NodeJS.ProcessEnv,
): VoiceTurnService => {
  const config = DoubaoVoiceEnvironmentSchema.parse(environment);
  return new VoiceTurnService({
    mode: "live_ai",
    providers: {
      speechToText: new DoubaoFlashAsrProvider({
        apiKey: config.DOUBAO_SPEECH_API_KEY,
        resourceId: config.DOUBAO_ASR_RESOURCE_ID,
      }),
      languageModel: new DoubaoArkLanguageModelProvider({
        apiKey: config.DOUBAO_ARK_API_KEY,
        model: config.DOUBAO_ARK_MODEL,
      }),
      textToSpeech: new DoubaoSeedTtsProvider({
        apiKey: config.DOUBAO_SPEECH_API_KEY,
        resourceId: config.DOUBAO_TTS_RESOURCE_ID,
        speaker: config.DOUBAO_TTS_SPEAKER,
        styleInstruction: config.DOUBAO_TTS_STYLE,
      }),
    },
  });
};
