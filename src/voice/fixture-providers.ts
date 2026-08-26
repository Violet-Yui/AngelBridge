import type { ParseResult } from "../domain/contracts";
import type {
  LanguageModelProvider,
  SpeechToTextProvider,
  TextToSpeechProvider,
} from "./providers";

export class FixtureSpeechToTextProvider implements SpeechToTextProvider {
  constructor(private readonly transcript: string) {}

  async transcribe(): Promise<string> {
    return this.transcript;
  }
}

export class FixtureLanguageModelProvider implements LanguageModelProvider {
  constructor(
    private readonly parseResult: ParseResult,
    private readonly replyText: string,
  ) {}

  async interpret(): Promise<{
    parseResult: ParseResult;
    replyText: string;
  }> {
    return {
      parseResult: structuredClone(this.parseResult),
      replyText: this.replyText,
    };
  }
}

const createSilentWav = (): Uint8Array => {
  const sampleRate = 8_000;
  const samples = 800;
  const bytesPerSample = 2;
  const dataSize = samples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
};

export class FixtureTextToSpeechProvider implements TextToSpeechProvider {
  async synthesize(): Promise<{ bytes: Uint8Array; contentType: string }> {
    return { bytes: createSilentWav(), contentType: "audio/wav" };
  }
}
