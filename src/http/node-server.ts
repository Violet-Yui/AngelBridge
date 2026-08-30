import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { createApiHandler } from "./api";

const readBody = async (request: IncomingMessage): Promise<Buffer | undefined> => {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
};

const writeResponse = async (response: Response, target: ServerResponse) => {
  target.statusCode = response.status;
  response.headers.forEach((value, key) => target.setHeader(key, value));
  if (!response.body) {
    target.end();
    return;
  }

  const reader = response.body.getReader();
  const cancel = () => void reader.cancel();
  target.once("close", cancel);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!target.write(Buffer.from(value))) await once(target, "drain");
    }
  } finally {
    target.off("close", cancel);
    if (!target.destroyed) target.end();
  }
};

export const createLocalApiServer = (
  handle: (request: Request) => Promise<Response> = createApiHandler(),
) => {
  return createServer(async (incoming, outgoing) => {
    try {
      const abortController = new AbortController();
      incoming.once("aborted", () => abortController.abort());
      outgoing.once("close", () => abortController.abort());
      const body = await readBody(incoming);
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
        else if (value !== undefined) headers.set(name, value);
      }
      const request = new Request(
        `http://${incoming.headers.host ?? "127.0.0.1"}${incoming.url ?? "/"}`,
        {
          method: incoming.method,
          headers,
          body: body ? new Uint8Array(body) : undefined,
          signal: abortController.signal,
        },
      );
      await writeResponse(await handle(request), outgoing);
    } catch (error) {
      outgoing.statusCode = 500;
      outgoing.setHeader("content-type", "application/json; charset=utf-8");
      outgoing.end(JSON.stringify({
        error: {
          code: "server_error",
          message: error instanceof Error ? error.message : "local server error",
        },
      }));
    }
  });
};
