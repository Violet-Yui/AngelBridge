import { AngelBridgeApplication } from "../src/application/app-service";
import { createDatabasePool } from "../src/database/connection";
import { PostgresApplicationStateRepository } from "../src/database/postgres-application-state-repository";
import { createApiHandler } from "../src/http/api";
import { createLocalApiServer } from "../src/http/node-server";
import { PostgresAccountRepository } from "../src/database/postgres-account-repository";
import { InMemoryAccountRepository } from "../src/auth/repository";
import { PostgresMatchPoolStateRepository } from "../src/database/postgres-match-pool-state-repository";
import { InMemoryMatchPoolStateRepository } from "../src/pool/repository";
import { createAiMatchAssessmentProvider } from "../src/ai-matching/runtime";
import { PostgresPhoneVerificationRepository } from "../src/database/postgres-phone-verification-repository";
import { AliyunSmsCodeSender } from "../src/auth/sms-provider";
import { FileSystemImageStore } from "../src/media/image-store";
import { DoubaoArkPetChatProvider } from "../src/pet-ai/doubao-ark-provider";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";
const databaseConfigured = Boolean(
  process.env.DATABASE_URL?.trim() || process.env.DATABASE_HOST?.trim(),
);
const databaseRequired = process.env.PERSISTENCE_REQUIRED === "true" ||
  process.env.NODE_ENV === "production";
const aiMatchProvider = process.env.AI_MODE === "live_ai"
  ? createAiMatchAssessmentProvider(process.env)
  : undefined;
const mediaStorageDirectory = process.env.MEDIA_STORAGE_DIR?.trim() ||
  "/var/lib/angelbridge/media";
const publicAppUrl = process.env.PUBLIC_APP_URL?.trim() ||
  "https://angel.xxpeople.com";
const imageStore = new FileSystemImageStore(mediaStorageDirectory);
const petChatProvider = process.env.AI_MODE === "live_ai" && process.env.AI_API_KEY?.trim()
  ? new DoubaoArkPetChatProvider({
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL || "doubao-seed-2-0-lite-260428",
      publicAppUrl,
      endpoint: process.env.AI_ENDPOINT,
    })
  : undefined;

if (databaseRequired && !databaseConfigured) {
  throw new Error("PostgreSQL configuration is required for this API runtime");
}

const app = new AngelBridgeApplication();
const pool = databaseConfigured ? createDatabasePool() : undefined;
const stateRepository = databaseConfigured
  ? new PostgresApplicationStateRepository(pool!)
  : undefined;
const accountRepository = pool
  ? new PostgresAccountRepository(pool)
  : new InMemoryAccountRepository();
const poolRepository = pool
  ? new PostgresMatchPoolStateRepository(pool)
  : new InMemoryMatchPoolStateRepository();
const smsConfigured = Boolean(
  process.env.ALIBABA_CLOUD_ACCESS_KEY_ID?.trim() &&
  process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET?.trim() &&
  process.env.ALIYUN_SMS_SIGN_NAME?.trim() &&
  process.env.ALIYUN_SMS_TEMPLATE_CODE?.trim(),
);
const smsCodeSender = smsConfigured
  ? new AliyunSmsCodeSender(
      process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
      process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
      process.env.ALIYUN_SMS_SIGN_NAME!,
      process.env.ALIYUN_SMS_TEMPLATE_CODE!,
      process.env.ALIYUN_SMS_CODE_PARAM || "code",
    )
  : undefined;
const showcaseLogin = process.env.ENABLE_SHOWCASE_LOGIN === "true"
  ? {
      code: process.env.SHOWCASE_SMS_CODE || "888888",
      accounts: {
        [process.env.SHOWCASE_PHONE_A || "19900000001"]:
          process.env.SHOWCASE_NICKNAME_A || "铁树",
        [process.env.SHOWCASE_PHONE_B || "19900000002"]:
          process.env.SHOWCASE_NICKNAME_B || "摄影师阿杰",
        [process.env.SHOWCASE_PHONE_C || "19900000003"]:
          process.env.SHOWCASE_NICKNAME_C || "新用户体验",
      },
      freshPhones: [process.env.SHOWCASE_PHONE_C || "19900000003"],
    }
  : undefined;
const phoneVerificationRepository = pool
  ? new PostgresPhoneVerificationRepository(pool)
  : undefined;

if (stateRepository) {
  await stateRepository.ping();
  await accountRepository.ping();
  await poolRepository.ping();
}

const server = createLocalApiServer(
  createApiHandler(
    app,
    stateRepository,
    accountRepository,
    poolRepository,
    aiMatchProvider,
    phoneVerificationRepository,
    smsCodeSender,
    imageStore,
    petChatProvider,
    showcaseLogin,
  ),
);

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
