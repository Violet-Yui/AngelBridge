import type { PoolMessage } from "../pool/contracts";

const encoder = new TextEncoder();

const eventChunk = (event: string, data: unknown, id?: string): Uint8Array =>
  encoder.encode([
    ...(id ? [`id: ${id}`] : []),
    `event: ${event}`,
    `data: ${JSON.stringify(data)}`,
    "",
    "",
  ].join("\n"));

export class ConversationMessageEvents {
  private readonly subscribers = new Map<string, Set<(message: PoolMessage) => void>>();

  publish(message: PoolMessage): void {
    for (const send of this.subscribers.get(message.conversationId) ?? []) {
      send(message);
    }
  }

  stream(conversationId: string, signal: AbortSignal): ReadableStream<Uint8Array> {
    let cleanup = () => undefined;

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        const send = (message: PoolMessage) => {
          controller.enqueue(eventChunk("message", message, message.messageId));
        };
        const subscribers = this.subscribers.get(conversationId) ?? new Set();
        subscribers.add(send);
        this.subscribers.set(conversationId, subscribers);

        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        }, 20_000);
        let closed = false;
        cleanup = () => {
          if (closed) return;
          closed = true;
          clearInterval(heartbeat);
          subscribers.delete(send);
          if (subscribers.size === 0) this.subscribers.delete(conversationId);
          signal.removeEventListener("abort", abort);
        };
        const abort = () => {
          cleanup();
          controller.close();
        };
        signal.addEventListener("abort", abort, { once: true });
        controller.enqueue(eventChunk("ready", { conversationId }));
        if (signal.aborted) abort();
      },
      cancel: () => cleanup(),
    });
  }
}
