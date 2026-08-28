import { randomUUID } from "node:crypto";
import { ZodError, type ZodType } from "zod";
import { AngelBridgeApplication, ApplicationError } from "../application/app-service";
import {
  ConfirmValueNodesInputSchema,
  ConsentInputSchema,
  CreateDemoSessionInputSchema,
  FinishPactInputSchema,
  FixtureVoiceTurnInputSchema,
  ParseFixtureInputSchema,
  RunMatchingInputSchema,
  UpdateIntentInputSchema,
  UpdatePactInputSchema,
  UpdateTreeDisclosureInputSchema,
  UpdateValueNodeInputSchema,
} from "../application/contracts";
import { PetTextTurnInputSchema } from "../product/pet-conversation-contracts";
import { SendConversationMessageInputSchema } from "../product/conversation-contracts";
import type { ApplicationStateRepository } from "../persistence/application-state";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type,x-demo-role-token",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: corsHeaders });

const ok = (data: unknown, status = 200): Response =>
  json(
    {
      data,
      meta: {
        requestId: randomUUID(),
        dataMode: "fixture",
        isSynthetic: true,
      },
    },
    status,
  );

const parseBody = async <T>(request: Request, schema: ZodType<T>): Promise<T> => {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApplicationError("request body must be valid JSON", 400, "invalid_json");
  }
  return schema.parse(value);
};

const parseOptionalBody = async <T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> => {
  const raw = await request.text();
  if (!raw) return schema.parse({});
  try {
    return schema.parse(JSON.parse(raw));
  } catch (error) {
    if (error instanceof ZodError) throw error;
    throw new ApplicationError("request body must be valid JSON", 400, "invalid_json");
  }
};

const tokenFor = (request: Request): string =>
  request.headers.get("x-demo-role-token") ?? "";

export const createApiHandler = (
  app = new AngelBridgeApplication(),
  stateRepository?: ApplicationStateRepository,
): ((request: Request) => Promise<Response>) => {
  const handleRequest = async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

    try {
      const url = new URL(request.url);
      const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);

      if (request.method === "GET" && url.pathname === "/api/health") {
        return ok({
          status: "ok",
          service: "angelbridge-local-api",
          persistence: stateRepository ? "postgres" : "memory",
        });
      }
      if (request.method === "GET" && url.pathname === "/api/demo/scenarios") {
        return ok(app.listScenarios());
      }
      if (request.method === "POST" && url.pathname === "/api/demo/sessions") {
        const input = await parseBody(request, CreateDemoSessionInputSchema);
        return ok(app.createDemoSession(input.scenarioId), 201);
      }

      if (parts[0] !== "api" || parts[1] !== "sessions" || !parts[2]) {
        throw new ApplicationError("route not found", 404, "not_found");
      }

      const sessionId = parts[2];
      const resource = parts[3];
      const childId = parts[4];
      const action = parts[5];
      const token = tokenFor(request);

      if (request.method === "GET" && resource === "status" && !childId) {
        return ok(app.getStatus(sessionId, token));
      }
      if (request.method === "POST" && resource === "reset" && !childId) {
        return ok(app.resetSession(sessionId, token));
      }
      if (request.method === "GET" && resource === "dashboard" && !childId) {
        return ok(app.getDashboard(sessionId, token));
      }
      if (request.method === "POST" && resource === "parse" && !childId) {
        const input = await parseBody(request, ParseFixtureInputSchema);
        return ok(app.parseFixture(sessionId, token, input.text));
      }
      if (resource === "nodes" && childId && !action && request.method === "PATCH") {
        const input = await parseBody(request, UpdateValueNodeInputSchema);
        return ok(app.updateNode(sessionId, token, childId, input));
      }
      if (resource === "nodes" && childId && !action && request.method === "DELETE") {
        app.deleteNode(sessionId, token, childId);
        return ok({ nodeId: childId, deleted: true });
      }
      if (resource === "nodes" && childId === "confirm" && request.method === "POST") {
        const input = await parseBody(request, ConfirmValueNodesInputSchema);
        return ok(app.confirmNodes(sessionId, token, input.nodeIds));
      }
      if (resource === "intent" && !childId && request.method === "PUT") {
        const input = await parseBody(request, UpdateIntentInputSchema);
        return ok(app.updateIntent(sessionId, token, input));
      }
      if (resource === "intent" && childId === "activate" && request.method === "POST") {
        return ok(app.activateIntent(sessionId, token));
      }
      if (resource === "matches" && childId === "run" && request.method === "POST") {
        const input = await parseOptionalBody(request, RunMatchingInputSchema);
        return ok(await app.runMatching(sessionId, token, input.mode));
      }
      if (resource === "matches" && !childId && request.method === "GET") {
        return ok(app.listMatches(sessionId, token));
      }
      if (resource === "matches" && childId && !action && request.method === "GET") {
        return ok(app.getMatch(sessionId, token, childId));
      }
      if (resource === "matches" && childId && action === "consent" && request.method === "POST") {
        const input = await parseBody(request, ConsentInputSchema);
        return ok(app.submitConsent(sessionId, token, childId, input.decision));
      }
      if (resource === "consent" && !childId && request.method === "GET") {
        return ok(app.getConsent(sessionId, token));
      }
      if (resource === "pact" && !childId && request.method === "GET") {
        return ok(app.getPact(sessionId, token));
      }
      if (resource === "pact" && !childId && request.method === "PATCH") {
        const input = await parseBody(request, UpdatePactInputSchema);
        return ok(app.updatePact(sessionId, token, input));
      }
      if (resource === "pact" && childId === "confirm" && request.method === "POST") {
        return ok(app.confirmPact(sessionId, token));
      }
      if (resource === "pact" && childId === "finish" && request.method === "POST") {
        const input = await parseBody(request, FinishPactInputSchema);
        return ok(app.finishPact(sessionId, token, input.outcome));
      }
      if (resource === "tree" && !childId && request.method === "GET") {
        return ok(app.getTree(sessionId, token, url.searchParams.get("view") === "detail"));
      }
      if (resource === "tree" && !childId && request.method === "PATCH") {
        const input = await parseBody(request, UpdateTreeDisclosureInputSchema);
        return ok(app.updateTreeDisclosure(sessionId, token, input.disclosure));
      }
      if (resource === "voice" && childId === "turn" && request.method === "POST") {
        const input = await parseBody(request, FixtureVoiceTurnInputSchema);
        return ok(await app.processFixtureVoice(sessionId, token, input), 201);
      }
      if (resource === "voice" && childId === "turns" && request.method === "GET") {
        return ok(app.listVoiceTurns(sessionId, token));
      }
      if (resource === "pet" && childId === "turn" && request.method === "POST") {
        const input = await parseBody(request, PetTextTurnInputSchema);
        return ok(app.processPetText(sessionId, token, input), 201);
      }
      if (resource === "pet" && childId === "turns" && request.method === "GET") {
        return ok(app.listPetTextTurns(sessionId, token));
      }
      if (resource === "connection" && !childId && request.method === "GET") {
        return ok(app.getConnectionDisclosure(sessionId, token));
      }
      if (resource === "inbox" && !childId && request.method === "GET") {
        return ok(app.getInbox(sessionId, token));
      }
      if (resource === "conversations" && !childId && request.method === "GET") {
        return ok(app.listConversations(sessionId, token));
      }
      if (resource === "conversations" && childId && action === "messages" && request.method === "GET") {
        return ok(app.listConversationMessages(sessionId, token, childId));
      }
      if (resource === "conversations" && childId && action === "messages" && request.method === "POST") {
        const input = await parseBody(request, SendConversationMessageInputSchema);
        return ok(app.sendConversationMessage(sessionId, token, childId, input.text), 201);
      }

      throw new ApplicationError("route not found", 404, "not_found");
    } catch (error) {
      if (error instanceof ZodError) {
        return json(
          {
            error: {
              code: "invalid_request",
              message: "request validation failed",
              issues: error.issues,
            },
          },
          400,
        );
      }
      if (error instanceof ApplicationError) {
        return json({ error: { code: error.code, message: error.message } }, error.status);
      }
      const message = error instanceof Error ? error.message : "unexpected application error";
      return json({ error: { code: "invalid_state", message } }, 409);
    }
  };

  return async (request: Request): Promise<Response> => {
    if (!stateRepository) return handleRequest(request);

    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const sessionId = parts[0] === "api" && parts[1] === "sessions"
      ? parts[2]
      : undefined;

    try {
      if (url.pathname === "/api/health") {
        await stateRepository.ping();
      }
      if (sessionId && !app.hasSession(sessionId)) {
        const snapshot = await stateRepository.findBySessionId(sessionId);
        if (snapshot) app.restoreSessionSnapshot(snapshot);
      }

      const response = await handleRequest(request);
      if (!response.ok || ["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        return response;
      }

      let changedSessionId = sessionId;
      if (!changedSessionId && url.pathname === "/api/demo/sessions") {
        const payload = await response.clone().json() as {
          data?: { sessionId?: string };
        };
        changedSessionId = payload.data?.sessionId;
      }
      if (changedSessionId) {
        await stateRepository.save(app.exportSessionSnapshot(changedSessionId));
      }
      return response;
    } catch (error) {
      return json(
        {
          error: {
            code: "persistence_unavailable",
            message: error instanceof Error
              ? error.message
              : "PostgreSQL persistence is unavailable",
          },
        },
        503,
      );
    }
  };
};
