import type { ParseResult } from "../domain/contracts";
import type { SynthesizedAudio, VoiceAudioInput } from "./contracts";

export type VoiceContext = {
  sessionId: string;
  personaId: string;
};

export interface SpeechToTextProvider {
  transcribe(
    audio: VoiceAudioInput,
    context: VoiceContext,
  ): Promise<string>;
}

export interface LanguageModelProvider {
  interpret(
    transcript: string,
    context: VoiceContext,
  ): Promise<{ parseResult: ParseResult; replyText: string }>;
}

export interface TextToSpeechProvider {
  synthesize(text: string, context: VoiceContext): Promise<SynthesizedAudio>;
}

export type VoiceProviders = {
  speechToText: SpeechToTextProvider;
  languageModel: LanguageModelProvider;
  textToSpeech: TextToSpeechProvider;
};
