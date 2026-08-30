import { z } from "zod";
import { ParseResultSchema } from "../domain/contracts";

export const VoiceModeSchema = z.enum(["fixture", "live_ai"]);

export const VoiceAudioInputSchema = z.object({
  bytes: z
    .custom<Uint8Array<ArrayBufferLike>>(
      (value) => value instanceof Uint8Array,
      "audio must be binary data",
    )
    .refine((value) => value.byteLength > 0, "audio must not be empty")
    .refine(
      (value) => value.byteLength <= 10 * 1024 * 1024,
      "audio must not exceed 10 MB",
    ),
  contentType: z.string().startsWith("audio/"),
});

export const VoiceTurnRequestSchema = z.object({
  sessionId: z.string().min(1),
  personaId: z.string().min(1),
  audio: VoiceAudioInputSchema,
});

export const VoiceInterpretationSchema = z.object({
  parseResult: ParseResultSchema,
  replyText: z.string().min(1).max(180),
});

export const SynthesizedAudioSchema = z.object({
  bytes: z
    .custom<Uint8Array<ArrayBufferLike>>(
      (value) => value instanceof Uint8Array,
      "synthesized audio must be binary data",
    )
    .refine((value) => value.byteLength > 0, "synthesized audio is empty"),
  contentType: z.string().startsWith("audio/"),
});

export const VoiceTurnResponseSchema = z.object({
  turnId: z.string().min(1),
  sessionId: z.string().min(1),
  personaId: z.string().min(1),
  mode: VoiceModeSchema,
  transcript: z.string().min(1),
  replyText: z.string().min(1),
  parseResult: ParseResultSchema,
  audio: z.object({
    contentType: z.string().startsWith("audio/"),
    base64: z.string().min(1),
  }),
  createdAt: z.string().datetime(),
});

export type VoiceMode = z.infer<typeof VoiceModeSchema>;
export type VoiceAudioInput = z.infer<typeof VoiceAudioInputSchema>;
export type VoiceTurnRequest = z.infer<typeof VoiceTurnRequestSchema>;
export type VoiceInterpretation = z.infer<typeof VoiceInterpretationSchema>;
export type SynthesizedAudio = z.infer<typeof SynthesizedAudioSchema>;
export type VoiceTurnResponse = z.infer<typeof VoiceTurnResponseSchema>;
