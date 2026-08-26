import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { SpeechToTextProvider, VoiceContext } from "../providers";
import type { VoiceAudioInput } from "../contracts";

const FlashAsrResponseSchema = z.object({
  result: z.object({ text: z.string().min(1) }),
});

type DoubaoFlashAsrOptions = {
  apiKey: string;
  resourceId?: string;
  endpoint?: string;
  fetchImpl?: typeof fetch;
  requestIdFactory?: () => string;
};

export class DoubaoFlashAsrProvider implements SpeechToTextProvider {
  private readonly apiKey: string;
  private readonly resourceId: string;
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;
  private readonly requestIdFactory: () => string;

  constructor(options: DoubaoFlashAsrOptions) {
    this.apiKey = options.apiKey;
    this.resourceId = options.resourceId ?? "volc.bigasr.auc_turbo";
    this.endpoint =
      options.endpoint ??
      "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash";
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.requestIdFactory = options.requestIdFactory ?? randomUUID;
  }

  async transcribe(
    audio: VoiceAudioInput,
    context: VoiceContext,
  ): Promise<string> {
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.apiKey,
        "X-Api-Resource-Id": this.resourceId,
        "X-Api-Request-Id": this.requestIdFactory(),
        "X-Api-Sequence": "-1",
      },
      body: JSON.stringify({
        user: { uid: context.personaId },
        audio: { data: Buffer.from(audio.bytes).toString("base64") },
        request: { model_name: "bigmodel" },
      }),
    });
    if (!response.ok) {
      throw new Error(`Doubao ASR HTTP ${response.status}`);
    }
    const statusCode = response.headers.get("X-Api-Status-Code");
    if (statusCode !== "20000000") {
      const message = response.headers.get("X-Api-Message") ?? "unknown error";
      throw new Error(`Doubao ASR ${statusCode ?? "missing status"}: ${message}`);
    }
    return FlashAsrResponseSchema.parse(await response.json()).result.text;
  }
}
