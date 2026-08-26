import { z } from "zod";
import type { TextToSpeechProvider, VoiceContext } from "../providers";

const TtsEventSchema = z.object({
  code: z.number(),
  message: z.string().optional(),
  data: z.string().nullable().optional(),
});

type DoubaoSeedTtsOptions = {
  apiKey: string;
  speaker: string;
  resourceId?: string;
  endpoint?: string;
  styleInstruction?: string;
  fetchImpl?: typeof fetch;
};

export class DoubaoSeedTtsProvider implements TextToSpeechProvider {
  private readonly apiKey: string;
  private readonly speaker: string;
  private readonly resourceId: string;
  private readonly endpoint: string;
  private readonly styleInstruction?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: DoubaoSeedTtsOptions) {
    this.apiKey = options.apiKey;
    this.speaker = options.speaker;
    this.resourceId = options.resourceId ?? "seed-tts-2.0";
    this.endpoint =
      options.endpoint ??
      "https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse";
    this.styleInstruction = options.styleInstruction;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async synthesize(text: string, context: VoiceContext) {
    const additions = {
      section_id: context.sessionId,
      ...(this.styleInstruction
        ? { context_texts: [this.styleInstruction] }
        : {}),
    };
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "X-Api-Key": this.apiKey,
        "X-Api-Resource-Id": this.resourceId,
      },
      body: JSON.stringify({
        user: { uid: context.personaId },
        req_params: {
          text,
          speaker: this.speaker,
          audio_params: { format: "mp3", sample_rate: 24_000 },
          additions: JSON.stringify(additions),
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`Doubao TTS HTTP ${response.status}`);
    }

    const frames: Buffer[] = [];
    for (const line of (await response.text()).split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;
      const event = TtsEventSchema.parse(JSON.parse(line.slice(5).trim()));
      if (event.code === 0 && event.data) {
        frames.push(Buffer.from(event.data, "base64"));
      } else if (event.code !== 0 && event.code !== 20_000_000) {
        throw new Error(`Doubao TTS ${event.code}: ${event.message ?? "unknown error"}`);
      }
    }
    if (frames.length === 0) {
      throw new Error("Doubao TTS returned no audio frames");
    }
    return {
      bytes: Buffer.concat(frames),
      contentType: "audio/mpeg",
    };
  }
}
