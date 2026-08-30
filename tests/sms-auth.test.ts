import { describe, expect, it } from "vitest";
import { AngelBridgeApplication } from "../src/application/app-service";
import { AccountAuthService } from "../src/auth/account-auth-service";
import { InMemoryAccountRepository } from "../src/auth/repository";
import { InMemoryPhoneVerificationRepository } from "../src/auth/phone-verification-repository";
import { AliyunSmsCodeSender, type SmsCodeSender } from "../src/auth/sms-provider";
import { createApiHandler } from "../src/http/api";
import { InMemoryMatchPoolStateRepository } from "../src/pool/repository";

class CapturingSmsSender implements SmsCodeSender {
  readonly codes = new Map<string, string>();

  async sendCode(phone: string, code: string) {
    this.codes.set(phone, code);
  }
}

const call = async (
  handle: (request: Request) => Promise<Response>,
  path: string,
  body: unknown,
) => {
  const response = await handle(new Request(`http://local.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
  return { response, body: await response.json() as any };
};

const setup = () => {
  const accounts = new InMemoryAccountRepository();
  const sender = new CapturingSmsSender();
  const handle = createApiHandler(
    new AngelBridgeApplication(),
    undefined,
    accounts,
    new InMemoryMatchPoolStateRepository(),
    undefined,
    new InMemoryPhoneVerificationRepository(),
    sender,
  );
  return { accounts, sender, handle };
};

describe("SMS account authentication", () => {
  it("constructs the Aliyun client in the ESM runtime", () => {
    expect(() => new AliyunSmsCodeSender("test-id", "test-secret", "test-sign", "SMS_test"))
      .not.toThrow();
  });

  it("registers with phone, code and a non-unique display nickname", async () => {
    const { accounts, sender, handle } = setup();

    for (const phone of ["13800138000", "13900139000"]) {
      const sent = await call(handle, "/api/auth/sms/send", { phone, purpose: "register" });
      expect(sent.response.status).toBe(200);
      const registered = await call(handle, "/api/auth/sms/register", {
        phone,
        code: sender.codes.get(phone),
        nickname: "小雨",
      });
      expect(registered.response.status).toBe(201);
      expect(registered.body.data).toMatchObject({ nickname: "小雨", isSynthetic: false });
    }

    expect((await accounts.findByPhone("13800138000"))?.nickname).toBe("小雨");
    expect((await accounts.findByPhone("13900139000"))?.nickname).toBe("小雨");
  });

  it("logs an existing phone account in with a fresh login code", async () => {
    const { accounts, sender, handle } = setup();
    const phone = "13800138001";
    const registered = await new AccountAuthService(accounts).registerPhone(phone, "桥友");

    await call(handle, "/api/auth/sms/send", { phone, purpose: "login" });
    const loggedIn = await call(handle, "/api/auth/sms/login", {
      phone,
      code: sender.codes.get(phone),
    });
    expect(loggedIn.response.status).toBe(200);
    expect(loggedIn.body.data.accountId).toBe(registered.accountId);
    expect(loggedIn.body.data.token).toBe(registered.token);
  });

  it("rejects an unknown login phone before sending an SMS", async () => {
    const { sender, handle } = setup();
    const result = await call(handle, "/api/auth/sms/send", {
      phone: "13800138002",
      purpose: "login",
    });
    expect(result.response.status).toBe(404);
    expect(result.body.error.code).toBe("phone_not_registered");
    expect(sender.codes.size).toBe(0);
  });

  it("does not accept a registration code for login", async () => {
    const { sender, handle } = setup();
    const phone = "13800138003";
    await call(handle, "/api/auth/sms/send", { phone, purpose: "register" });
    const result = await call(handle, "/api/auth/sms/login", {
      phone,
      code: sender.codes.get(phone),
    });
    expect(result.response.status).toBe(401);
    expect(result.body.error.code).toBe("invalid_sms_code");
  });
});
