import { AngelBridgeApplication } from "../src/application/app-service";
import { createDatabasePool } from "../src/database/connection";
import { PostgresApplicationStateRepository } from "../src/database/postgres-application-state-repository";
import { createApiHandler } from "../src/http/api";
import { createLocalApiServer } from "../src/http/node-server";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";
const databaseConfigured = Boolean(
  process.env.DATABASE_URL?.trim() || process.env.DATABASE_HOST?.trim(),
);
const databaseRequired = process.env.PERSISTENCE_REQUIRED === "true" ||
  process.env.NODE_ENV === "production";

if (databaseRequired && !databaseConfigured) {
  throw new Error("PostgreSQL configuration is required for this API runtime");
}

const app = new AngelBridgeApplication();
const stateRepository = databaseConfigured
  ? new PostgresApplicationStateRepository(createDatabasePool())
  : undefined;

if (stateRepository) await stateRepository.ping();

const server = createLocalApiServer(createApiHandler(app, stateRepository));

server.listen(port, host, () => {
  console.log(`AngelBridge API listening on http://${host}:${port}`);
  console.log("Health check: /api/health");
});

const shutdown = (signal: NodeJS.Signals) => {
  console.log(`Received ${signal}; closing AngelBridge API.`);
  server.close(async (error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
    await stateRepository?.close();
  });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
