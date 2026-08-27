import { createLocalApiServer } from "../src/http/node-server";

const port = Number(process.env.PORT ?? 8787);
const server = createLocalApiServer();

server.listen(port, "127.0.0.1", () => {
  console.log(`AngelBridge local fixture API: http://127.0.0.1:${port}`);
  console.log("Health check: /api/health");
});
