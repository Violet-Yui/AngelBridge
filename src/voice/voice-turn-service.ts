import { randomUUID } from "node:crypto";
import {
  SynthesizedAudioSchema,
  VoiceInterpretationSchema,
  VoiceTurnRequestSchema,
  VoiceTurnResponseSchema,
  type VoiceMode,
  type VoiceTurnRequest,
  type VoiceTurnResponse,
} from "./contracts";
import type { VoiceProviders } from "./providers";

type VoiceTurnServiceOptions = {
  mode: VoiceMode;
  providers: VoiceProviders;
  idFactory?: () => string;
  now?: () => Date;
};

const clone = <T>(value: T): T => structuredClone(value);

export class VoiceTurnService {
  private readonly turns = new Map<string, VoiceTurnResponse>();
  private readonly mode: VoiceMode;
  private readonly providers: VoiceProviders;
  private readonly idFactory: () => string;
  private readonly now: () => Date;

  constructor(options: VoiceTurnServiceOptions) {
    this.mode = options.mode;
    this.providers = options.providers;
    this.idFactory = options.idFactory ?? randomUUID;
    this.now = options.now ?? (() => new Date());
  }

  async process(request: VoiceTurnRequest): Promise<VoiceTurnResponse> {
    const input = VoiceTurnRequestSchema.parse(request);
    const context = {
      sessionId: input.sessionId,
      personaId: input.personaId,
    };
    const transcript = await this.providers.speechToText.transcribe(
      input.audio,
      context,
    );
    const interpretation = VoiceInterpretationSchema.parse(
      await this.providers.languageModel.interpret(transcript, context),
    );
    const expectsSynthetic = this.mode === "fixture";
    if (interpretation.parseResult.isSynthetic !== expectsSynthetic) {
      throw new Error(`voice mode ${this.mode} does not match parse result source`);
    }
    const synthesized = SynthesizedAudioSchema.parse(
      await this.providers.textToSpeech.synthesize(
        interpretation.replyText,
        context,
      ),
    );
    const turn = VoiceTurnResponseSchema.parse({
      turnId: this.idFactory(),
      ...context,
      mode: this.mode,
      transcript,
      replyText: interpretation.replyText,
      parseResult: interpretation.parseResult,
      audio: {
        contentType: synthesized.contentType,
        base64: Buffer.from(synthesized.bytes).toString("base64"),
      },
      createdAt: this.now().toISOString(),
    });
    this.turns.set(turn.turnId, turn);
    return clone(turn);
  }

  getTurn(turnId: string): VoiceTurnResponse {
    const turn = this.turns.get(turnId);
    if (!turn) throw new Error(`unknown voice turn: ${turnId}`);
    return clone(turn);
  }

  listTurns(sessionId: string): VoiceTurnResponse[] {
    return [...this.turns.values()]
      .filter((turn) => turn.sessionId === sessionId)
      .map(clone);
  }
}
