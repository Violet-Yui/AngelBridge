import { describe, expect, it } from "vitest";
import parseResultFixture from "../fixtures/parse-result.json";
import { ParseResultSchema } from "../src/domain/contracts";
import {
  FixtureLanguageModelProvider,
  FixtureSpeechToTextProvider,
  FixtureTextToSpeechProvider,
} from "../src/voice/fixture-providers";
import { VoiceTurnService } from "../src/voice/voice-turn-service";

const parseResult = ParseResultSchema.parse(parseResultFixture);

const createService = () =>
  new VoiceTurnService({
    mode: "fixture",
    providers: {
      speechToText: new FixtureSpeechToTextProvider(parseResult.sourceText),
      languageModel: new FixtureLanguageModelProvider(
        parseResult,
        "主人，我整理出一项能力和一项需求，要保存到价值卡片吗？",
      ),
      textToSpeech: new FixtureTextToSpeechProvider(),
    },
    idFactory: (() => {
      let sequence = 0;
      return () => `turn-${++sequence}`;
    })(),
    now: () => new Date("2026-08-26T13:00:00.000Z"),
  });

describe("fixture voice turn", () => {
  it("runs speech recognition, interpretation and speech synthesis as one turn", async () => {
    const service = createService();
    const result = await service.process({
      sessionId: "session-a",
      personaId: "persona-a",
      audio: { bytes: new Uint8Array([1, 2, 3]), contentType: "audio/webm" },
    });

    expect(result.mode).toBe("fixture");
    expect(result.transcript).toBe(parseResult.sourceText);
    expect(result.parseResult.source).toBe("fixture");
    expect(Buffer.from(result.audio.base64, "base64").subarray(0, 4).toString()).toBe(
      "RIFF",
    );
    expect(service.getTurn(result.turnId)).toEqual(result);
  });

  it("keeps voice histories isolated by session", async () => {
    const service = createService();
    const request = {
      personaId: "persona-a",
      audio: { bytes: new Uint8Array([1]), contentType: "audio/webm" },
    };
    await service.process({ ...request, sessionId: "session-a" });
    await service.process({ ...request, sessionId: "session-b" });

    expect(service.listTurns("session-a")).toHaveLength(1);
    expect(service.listTurns("session-b")).toHaveLength(1);
  });
});
