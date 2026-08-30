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
import {
  LoginAccountInputSchema,
  LoginWithSmsInputSchema,
  RegisterAccountInputSchema,
  RegisterWithSmsInputSchema,
  SendSmsCodeInputSchema,
  SendSmsCodeAutoInputSchema,
  UpdateAccountProfileInputSchema,
} from "../auth/contracts";
import {
  InMemoryAccountRepository,
  type AccountRepository,
} from "../auth/repository";
import { AccountAuthService } from "../auth/account-auth-service";
import { PhoneAuthService, type ShowcaseLoginConfig } from "../auth/phone-auth-service";
import {
  InMemoryPhoneVerificationRepository,
  type PhoneVerificationRepository,
} from "../auth/phone-verification-repository";
import type { SmsCodeSender } from "../auth/sms-provider";
import {
  PoolConsentInputSchema,
  PoolMessageInputSchema,
  PoolPetTurnInputSchema,
  PetOrganizeInputSchema,
  CreatePublicationInputSchema,
  PublicationCompletionDecisionInputSchema,
  UpdatePublicationInputSchema,
  SavePoolProfileInputSchema,
  SaveLifeTreeInputSchema,
  UpdatePoolPactInputSchema,
} from "../pool/contracts";
import {
  InMemoryMatchPoolStateRepository,
  type MatchPoolStateRepository,
} from "../pool/repository";
import { MatchPoolService } from "../pool/match-pool-service";
import type { AiMatchAssessmentProvider } from "../ai-matching/provider";
import { ConversationMessageEvents } from "./conversation-message-events";
import type { ImageStore } from "../media/image-store";
import type { PetChatProvider } from "../pet-ai/provider";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type,x-demo-role-token",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: corsHeaders });

const ok = (data: unknown, status = 200, isSynthetic = true): Response =>
  json(
    {
      data,
      meta: {
        requestId: randomUUID(),
        dataMode: isSynthetic ? "fixture" : "user",
        isSynthetic,
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
  accountRepository: AccountRepository = new InMemoryAccountRepository(),
  poolRepository: MatchPoolStateRepository = new InMemoryMatchPoolStateRepository(),
  aiMatchProvider?: AiMatchAssessmentProvider,
  phoneVerificationRepository: PhoneVerificationRepository = new InMemoryPhoneVerificationRepository(),
  smsCodeSender?: SmsCodeSender,
  imageStore?: ImageStore,
  petChatProvider?: PetChatProvider,
  showcaseLogin?: ShowcaseLoginConfig,
): ((request: Request) => Promise<Response>) => {
  const auth = new AccountAuthService(accountRepository);
  const phoneAuth = smsCodeSender
    ? new PhoneAuthService(auth, phoneVerificationRepository, smsCodeSender, undefined, showcaseLogin)
    : undefined;
  const messageEvents = new ConversationMessageEvents();
  const pool = new MatchPoolService(
    auth,
    poolRepository,
    undefined,
    aiMatchProvider,
    petChatProvider,
    (message) => messageEvents.publish(message),
  );
  const handleRequest = async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

    try {
      const url = new URL(request.url);
      const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);

      if (
        request.method === "GET" && parts[0] === "api" &&
        parts[1] === "media" && parts[2] && !parts[3]
      ) {
        if (!imageStore) {
          throw new ApplicationError("图片存储尚未配置", 503, "media_not_configured");
        }
        try {
          const stored = await imageStore.read(parts[2]);
          return new Response(Uint8Array.from(stored.bytes).buffer, {
            headers: {
              ...corsHeaders,
              "cache-control": "public, max-age=31536000, immutable",
              "content-type": stored.attachment.mimeType,
            },
          });
        } catch {
          throw new ApplicationError("图片不存在", 404, "media_not_found");
        }
      }

      if (request.method === "GET" && url.pathname === "/api/health") {
        await accountRepository.ping();
        await poolRepository.ping();
        return ok({
          status: "ok",
          service: "angelbridge-local-api",
          persistence: stateRepository ? "postgres" : "memory",
        }, 200, false);
      }
      if (request.method === "GET" && url.pathname === "/api/demo/scenarios") {
        return ok(app.listScenarios());
      }
      if (request.method === "POST" && url.pathname === "/api/demo/sessions") {
        const input = await parseBody(request, CreateDemoSessionInputSchema);
        return ok(app.createDemoSession(input.scenarioId), 201);
      }
      if (request.method === "POST" && url.pathname === "/api/auth/register") {
        const input = await parseBody(request, RegisterAccountInputSchema);
        return ok(await auth.register(input), 201, false);
      }
      if (request.method === "POST" && url.pathname === "/api/auth/login") {
        const input = await parseBody(request, LoginAccountInputSchema);
        return ok(await auth.login(input), 200, false);
      }
      if (request.method === "POST" && url.pathname === "/api/auth/sms/send") {
        if (!phoneAuth) {
          throw new ApplicationError("SMS login is not configured", 503, "sms_not_configured");
        }
        const input = await parseBody(request, SendSmsCodeInputSchema);
        return ok(await phoneAuth.sendCode(input.phone, input.purpose), 200, false);
      }
      if (request.method === "POST" && url.pathname === "/api/auth/sms/send-auto") {
        if (!phoneAuth) {
          throw new ApplicationError("SMS login is not configured", 503, "sms_not_configured");
        }
        const input = await parseBody(request, SendSmsCodeAutoInputSchema);
        return ok(await phoneAuth.sendCodeAuto(input.phone), 200, false);
      }
      if (request.method === "POST" && url.pathname === "/api/auth/sms/register") {
        if (!phoneAuth) {
          throw new ApplicationError("SMS login is not configured", 503, "sms_not_configured");
        }
        const input = await parseBody(request, RegisterWithSmsInputSchema);
        return ok(await phoneAuth.register(input), 201, false);
      }
      if (request.method === "POST" && url.pathname === "/api/auth/sms/login") {
        if (!phoneAuth) {
          throw new ApplicationError("SMS login is not configured", 503, "sms_not_configured");
        }
        const input = await parseBody(request, LoginWithSmsInputSchema);
        const session = await phoneAuth.login(input);
        return ok(session, 200, false);
      }

      const token = tokenFor(request);
      if (request.method === "GET" && url.pathname === "/api/me/account") {
        return ok(await auth.getAccountProfile(token), 200, false);
      }
      if (request.method === "PATCH" && url.pathname === "/api/me/account") {
        const input = await parseBody(request, UpdateAccountProfileInputSchema);
        const account = await auth.updateAccountProfile(token, input);
        if (input.personalityTags || input.interestTags || input.avatarUrl !== undefined) {
          await pool.syncAccountProfile(
            token,
            input.personalityTags !== undefined || input.interestTags !== undefined,
          );
        }
        return ok(account, 200, false);
      }
      if (request.method === "POST" && url.pathname === "/api/media/images") {
        await auth.authenticate(token);
        if (!imageStore) {
          throw new ApplicationError("图片存储尚未配置", 503, "media_not_configured");
        }
        const form = await request.formData();
        const image = form.get("image");
        if (!(image instanceof File)) {
          throw new ApplicationError("image 文件不能为空", 400, "invalid_image");
        }
        try {
          return ok(await imageStore.save(image), 201, false);
        } catch (error) {
          throw new ApplicationError(
            error instanceof Error ? error.message : "图片上传失败",
            400,
            "invalid_image",
          );
        }
      }
      if (request.method === "GET" && url.pathname === "/api/me/profile") {
        return ok(await pool.getProfile(token), 200, false);
      }
      if (request.method === "PUT" && url.pathname === "/api/me/profile") {
        const input = await parseBody(request, SavePoolProfileInputSchema);
        return ok(await pool.saveProfile(token, input), 200, false);
      }
      if (request.method === "POST" && url.pathname === "/api/me/profile/activate") {
        return ok(await pool.activateProfile(token), 200, false);
      }
      if (request.method === "POST" && url.pathname === "/api/publications") {
        const input = await parseBody(request, CreatePublicationInputSchema);
        return ok(await pool.createPublication(token, input), 201, false);
      }
      if (
        request.method === "GET" &&
        (url.pathname === "/api/publications/mine" || url.pathname === "/api/me/publications")
      ) {
        return ok(await pool.listPublications(token), 200, false);
      }
      if (request.method === "GET" && url.pathname === "/api/publications/discover") {
        return ok(await pool.listDiscoverPublications(token), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "publications" && parts[2] &&
        !parts[3] && request.method === "GET"
      ) {
        return ok(await pool.getPublication(token, parts[2]), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "publications" && parts[2] &&
        !parts[3] && request.method === "PATCH"
      ) {
        const input = await parseBody(request, UpdatePublicationInputSchema);
        return ok(await pool.updatePublication(token, parts[2], input), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "publications" && parts[2] &&
        parts[3] === "publish" && request.method === "POST"
      ) {
        return ok(await pool.publishPublication(token, parts[2]), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "publications" && parts[2] &&
        parts[3] === "completion-decision" && request.method === "POST"
      ) {
        const input = await parseBody(request, PublicationCompletionDecisionInputSchema);
        return ok(
          await pool.decidePublicationAfterCompletion(token, parts[2], input),
          200,
          false,
        );
      }
      if (
        parts[0] === "api" && parts[1] === "publications" && parts[2] &&
        !parts[3] && request.method === "DELETE"
      ) {
        return ok(await pool.deletePublication(token, parts[2]), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "publications" && parts[2] &&
        parts[3] === "matches" && parts[4] === "run" && request.method === "POST"
      ) {
        return ok(await pool.runPublicationMatching(token, parts[2]), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "publications" && parts[2] &&
        parts[3] === "matches" && !parts[4] && request.method === "GET"
      ) {
        return ok(await pool.listPublicationMatches(token, parts[2]), 200, false);
      }
      if (request.method === "POST" && url.pathname === "/api/matches/run") {
        return ok(await pool.runMatching(token), 200, false);
      }
      if (request.method === "GET" && url.pathname === "/api/dashboard") {
        return ok(await pool.getDashboard(token), 200, false);
      }
      if (request.method === "GET" && url.pathname === "/api/pacts") {
        return ok(await pool.listPacts(token), 200, false);
      }
      if (request.method === "GET" && url.pathname === "/api/matches") {
        return ok(await pool.listMatches(token), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "matches" && parts[2] &&
        !parts[3] && request.method === "GET"
      ) {
        return ok(await pool.getMatch(token, parts[2]), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "matches" && parts[2] &&
        parts[3] === "consent" && request.method === "POST"
      ) {
        const input = await parseBody(request, PoolConsentInputSchema);
        return ok(
          await pool.submitConsent(token, parts[2], input.decision),
          200,
          false,
        );
      }
      if (
        parts[0] === "api" && parts[1] === "matches" && parts[2] &&
        parts[3] === "pact"
      ) {
        if (!parts[4] && request.method === "GET") {
          return ok(await pool.getPact(token, parts[2]), 200, false);
        }
        if (!parts[4] && request.method === "PATCH") {
          const input = await parseBody(request, UpdatePoolPactInputSchema);
          return ok(await pool.updatePact(token, parts[2], input), 200, false);
        }
        if (parts[4] === "start-confirmation" && request.method === "POST") {
          return ok(await pool.confirmPactStart(token, parts[2]), 200, false);
        }
        if (parts[4] === "completion-confirmation" && request.method === "POST") {
          return ok(await pool.confirmPactCompletion(token, parts[2]), 200, false);
        }
        if (parts[4] === "exit" && request.method === "POST") {
          return ok(await pool.exitPact(token, parts[2]), 200, false);
        }
      }
      if (request.method === "GET" && url.pathname === "/api/conversations") {
        return ok(await pool.listConversations(token), 200, false);
      }
      if (url.pathname === "/api/life-tree" && request.method === "GET") {
        return ok(await pool.getLifeTree(token), 200, false);
      }
      if (url.pathname === "/api/life-tree" && request.method === "PUT") {
        const input = await parseBody(request, SaveLifeTreeInputSchema);
        return ok(await pool.saveLifeTree(token, input), 200, false);
      }
      if (url.pathname === "/api/life-tree/diagnose" && request.method === "POST") {
        return ok(await pool.diagnoseLifeTree(token), 200, false);
      }
      if (request.method === "GET" && url.pathname === "/api/pet/messages") {
        return ok(await pool.listPetTurns(token), 200, false);
      }
      if (request.method === "POST" && url.pathname === "/api/pet/messages") {
        const input = await parseBody(request, PoolPetTurnInputSchema);
        return ok(await pool.sendPetTurn(token, input), 201, false);
      }
      if (request.method === "POST" && url.pathname === "/api/pet/organize") {
        const input = await parseBody(request, PetOrganizeInputSchema);
        return ok(await pool.organizeWithPet(token, input), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "conversations" && parts[2] &&
        parts[3] === "read" && request.method === "POST"
      ) {
        return ok(await pool.markConversationRead(token, parts[2]), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "conversations" && parts[2] &&
        parts[3] === "events" && request.method === "GET"
      ) {
        await pool.listMessages(token, parts[2]);
        return new Response(messageEvents.stream(parts[2], request.signal), {
          headers: {
            ...corsHeaders,
            "cache-control": "no-cache, no-transform",
            "content-type": "text/event-stream; charset=utf-8",
            "x-accel-buffering": "no",
          },
        });
      }
      if (
        parts[0] === "api" && parts[1] === "conversations" && parts[2] &&
        parts[3] === "messages" && request.method === "GET"
      ) {
        return ok(await pool.listMessages(token, parts[2]), 200, false);
      }
      if (
        parts[0] === "api" && parts[1] === "conversations" && parts[2] &&
        parts[3] === "messages" && request.method === "POST"
      ) {
        const input = await parseBody(request, PoolMessageInputSchema);
        const message = await pool.sendMessage(token, parts[2], input);
        messageEvents.publish(message);
        return ok(message, 201, false);
      }

      if (parts[0] !== "api" || parts[1] !== "sessions" || !parts[2]) {
        throw new ApplicationError("route not found", 404, "not_found");
      }

      const sessionId = parts[2];
      const resource = parts[3];
      const childId = parts[4];
      const action = parts[5];
      const demoToken = token;

      if (request.method === "GET" && resource === "status" && !childId) {
        return ok(app.getStatus(sessionId, demoToken));
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
