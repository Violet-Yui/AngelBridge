import { describe, expect, it, vi } from "vitest";
import { DoubaoArkLanguageModelProvider } from "../src/voice/doubao/ark-language-model-provider";
import { DoubaoFlashAsrProvider } from "../src/voice/doubao/flash-asr-provider";
import { DoubaoSeedTtsProvider } from "../src/voice/doubao/seed-tts-provider";
import { DoubaoVoiceEnvironmentSchema } from "../src/voice/doubao/runtime";

const context = { sessionId: "session-live", personaId: "persona-live" };

describe("Doubao provider adapters", () => {
  it("requires live credentials before building the runtime", () => {
    expect(
      DoubaoVoiceEnvironmentSchema.safeParse({
        VOICE_MODE: "live_ai",
        DOUBAO_ARK_API_KEY: "ark-key",
        DOUBAO_ARK_MODEL: "doubao-seed-2-0-lite-260215",
        DOUBAO_SPEECH_API_KEY: "speech-key",
        DOUBAO_TTS_SPEAKER: "voice-id",
      }).success,
    ).toBe(true);
    expect(
      DoubaoVoiceEnvironmentSchema.safeParse({ VOICE_MODE: "live_ai" }).success,
    ).toBe(false);
  });

  it("sends Base64 audio to flash ASR and returns result.text", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ result: { text: "我需要在杭州找一间房。" } }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Api-Status-Code": "20000000",
        },
      }),
    );
    const provider = new DoubaoFlashAsrProvider({
      apiKey: "speech-key",
      fetchImpl: fetchMock as unknown as typeof fetch,
      requestIdFactory: () => "request-1",
    });

    const transcript = await provider.transcribe(
      { bytes: new Uint8Array([1, 2, 3]), contentType: "audio/webm" },
      context,
    );

    expect(transcript).toBe("我需要在杭州找一间房。");
    const request = fetchMock.mock.calls[0][1]!;
    expect(new Headers(request.headers).get("X-Api-Key")).toBe("speech-key");
    expect(JSON.parse(request.body as string).audio.data).toBe("AQID");
  });

  it("converts the forced Ark tool call into a live ParseResult", async () => {
    const toolArguments = {
      nodes: [
        {
          direction: "need",
          domain: "space",
          title: "杭州租房",
          description: "希望在杭州找到一间可租住的房间。",
          keywords: ["杭州", "租房"],
          deliverables: [],
          visibility: "match_only",
          evidenceCompleteness: 0.7,
        },
      ],
      acceptedExchangeModes: ["money"],
      constraints: { locations: ["杭州"], availability: [] },
      replyText: "主人，我听到你想在杭州找一间房，要保存这项需求吗？",
    };
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    name: "record_value_nodes",
                    arguments: JSON.stringify(toolArguments),
                  },
                },
              ],
            },
          },
        ],
      }),
    );
    const provider = new DoubaoArkLanguageModelProvider({
      apiKey: "ark-key",
      model: "doubao-seed-2-0-lite-260215",
      fetchImpl: fetchMock as unknown as typeof fetch,
      idFactory: () => "node-1",
      now: () => new Date("2026-08-26T13:00:00.000Z"),
    });

    const result = await provider.interpret(
      "我需要在杭州找一间房。",
      context,
    );

    expect(result.parseResult.source).toBe("live_ai");
    expect(result.parseResult.nodes[0].id).toBe("node:node-1");
    expect(result.parseResult.intent.offerNodeIds).toEqual([]);
    expect(result.parseResult.intent.needNodeIds).toEqual(["node:node-1"]);
    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body.tool_choice.function.name).toBe("record_value_nodes");
  });

  it("joins Seed TTS SSE audio frames", async () => {
    const first = Buffer.from("ID3").toString("base64");
    const second = Buffer.from([1, 2]).toString("base64");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        [
          `data: ${JSON.stringify({ code: 0, message: "", data: first })}`,
          `data: ${JSON.stringify({ code: 0, message: "", data: second })}`,
          `data: ${JSON.stringify({ code: 20_000_000, message: "ok", data: null })}`,
          "",
        ].join("\n"),
        { status: 200, headers: { "Content-Type": "text/event-stream" } },
      ),
    );
    const provider = new DoubaoSeedTtsProvider({
      apiKey: "speech-key",
      speaker: "voice-id",
      styleInstruction: "请用温柔、轻快的语气说话。",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const result = await provider.synthesize("主人，我听到了。", context);

    expect(Buffer.from(result.bytes)).toEqual(Buffer.from([73, 68, 51, 1, 2]));
    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body.req_params.speaker).toBe("voice-id");
    expect(JSON.parse(body.req_params.additions).context_texts).toEqual([
      "请用温柔、轻快的语气说话。",
    ]);
  });
});
