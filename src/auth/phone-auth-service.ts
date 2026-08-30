import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { ApplicationError } from "../application/app-service";
import type {
  LoginWithSmsInput,
  RegisterWithSmsInput,
  SmsPurpose,
} from "./contracts";
import { AccountAuthService, normalizePhone } from "./account-auth-service";
import type { PhoneVerificationRepository } from "./phone-verification-repository";
import type { SmsCodeSender } from "./sms-provider";

const CODE_TTL_MS = 5 * 60_000;
const RESEND_INTERVAL_MS = 60_000;
const MAX_FAILED_ATTEMPTS = 5;

export type ShowcaseLoginConfig = {
  code: string;
  accounts: Record<string, string>;
  freshPhones?: string[];
};

const deriveCode = (code: string, salt = randomBytes(16).toString("hex")) => ({
  salt,
  hash: scryptSync(code, salt, 32).toString("hex"),
});

export class PhoneAuthService {
  constructor(
    private readonly auth: AccountAuthService,
    private readonly verifications: PhoneVerificationRepository,
    private readonly sender: SmsCodeSender,
    private readonly now: () => Date = () => new Date(),
    private readonly showcase?: ShowcaseLoginConfig,
  ) {}

  private showcaseNickname(phone: string): string | undefined {
    return this.showcase?.accounts[phone];
  }

  private isFreshShowcasePhone(phone: string): boolean {
    return this.showcase?.freshPhones?.includes(phone) ?? false;
  }

  async sendCodeAuto(phoneInput: string) {
    const phone = normalizePhone(phoneInput);
    const showcaseNickname = this.showcaseNickname(phone);
    if (showcaseNickname) {
      await this.auth.ensureShowcasePhone(phone, showcaseNickname);
    }
    const purpose: SmsPurpose = await this.auth.findByPhone(phone) ? "login" : "register";
    return {
      purpose,
      ...(await this.sendCode(phone, purpose)),
    };
  }

  async sendCode(phoneInput: string, purpose: SmsPurpose) {
    const phone = normalizePhone(phoneInput);
    const now = this.now();
    const showcaseNickname = this.showcaseNickname(phone);
    if (showcaseNickname) {
      await this.auth.ensureShowcasePhone(phone, showcaseNickname);
    }
    const accountExists = Boolean(await this.auth.findByPhone(phone));
    if (purpose === "register" && accountExists) {
      throw new ApplicationError("该手机号已经注册，请直接登录", 409, "phone_registered");
    }
    if (purpose === "login" && !accountExists) {
      throw new ApplicationError("该手机号尚未注册", 404, "phone_not_registered");
    }
    if (showcaseNickname) {
      return { expiresInSeconds: 86_400, resendAfterSeconds: 0, delivery: "showcase" as const };
    }
    const existing = await this.verifications.find(phone);
    if (existing && new Date(existing.nextSendAt) > now) {
      throw new ApplicationError("请稍后再获取验证码", 429, "sms_too_frequent");
    }
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const codeValue = deriveCode(code);
    try {
      await this.sender.sendCode(phone, code);
    } catch {
      throw new ApplicationError("验证码发送失败，请稍后重试", 502, "sms_send_failed");
    }
    await this.verifications.save({
      phone,
      purpose,
      codeSalt: codeValue.salt,
      codeHash: codeValue.hash,
      expiresAt: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
      nextSendAt: new Date(now.getTime() + RESEND_INTERVAL_MS).toISOString(),
      failedAttempts: 0,
      consumedAt: null,
      createdAt: now.toISOString(),
    });
    return { expiresInSeconds: 300, resendAfterSeconds: 60 };
  }

  async register(input: RegisterWithSmsInput) {
    await this.verifyCode(input.phone, input.code, "register");
    const session = await this.auth.registerPhone(input.phone, input.nickname);
    await this.consume(input.phone);
    return session;
  }

  async login(input: LoginWithSmsInput) {
    await this.verifyCode(input.phone, input.code, "login");
    const session = await this.auth.loginPhone(input.phone);
    await this.consume(input.phone);
    if (this.isFreshShowcasePhone(normalizePhone(input.phone))) {
      return {
        ...session,
        personalityTags: [],
        interestTags: [],
        profileIntro: "",
        petName: "小天",
        avatarUrl: null,
        gender: null,
        birthDate: null,
        city: null,
        demographicTags: [],
        demographicsComplete: false,
        growthScore: 100,
      };
    }
    return session;
  }

  private async verifyCode(phoneInput: string, code: string, purpose: SmsPurpose) {
    const phone = normalizePhone(phoneInput);
    if (this.showcaseNickname(phone)) {
      if (purpose !== "login" || code !== this.showcase?.code) {
        throw new ApplicationError("验证码错误", 401, "invalid_sms_code");
      }
      return;
    }
    const record = await this.verifications.find(phone);
    const now = this.now();
    if (!record || record.purpose !== purpose || record.consumedAt || new Date(record.expiresAt) <= now) {
      throw new ApplicationError("验证码无效或已过期", 401, "invalid_sms_code");
    }
    if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      throw new ApplicationError("验证码尝试次数过多，请重新获取", 429, "sms_attempts_exceeded");
    }
    const expected = Buffer.from(record.codeHash, "hex");
    const actual = scryptSync(code, record.codeSalt, expected.length);
    if (!timingSafeEqual(actual, expected)) {
      await this.verifications.incrementFailedAttempts(phone);
      throw new ApplicationError("验证码错误", 401, "invalid_sms_code");
    }
  }

  private async consume(phoneInput: string) {
    const phone = normalizePhone(phoneInput);
    if (this.showcaseNickname(phone)) return;
    await this.verifications.consume(phone, this.now().toISOString());
  }
}
