import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
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
  const body = Buffer.from(await response.arrayBuffer());
  target.end(body);
};

export const createLocalApiServer = (
  handle: (request: Request) => Promise<Response> = createApiHandler(),
) => {
  return createServer(async (incoming, outgoing) => {
    try {
      const body = await readBody(incoming);
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
        else if (value !== undefined) headers.set(name, value);
      }
      const request = new Request(
        `http://${incoming.headers.host ?? "127.0.0.1"}${incoming.url ?? "/"}`,
        { method: incoming.method, headers, body: body?.toString("utf8") },
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
