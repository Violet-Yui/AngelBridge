import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { ApplicationError } from "../application/app-service";
import type {
  AuthSession,
  LoginAccountInput,
  RegisterAccountInput,
  UpdateAccountProfileInput,
} from "./contracts";
import type { AccountRecord, AccountRepository } from "./repository";

const nicknameKey = (nickname: string): string => nickname.trim().toLowerCase();
export const normalizePhone = (phone: string): string =>
  phone.trim();

const derivePin = (pin: string, salt = randomBytes(16).toString("hex")) => ({
  salt,
  hash: scryptSync(pin, salt, 32).toString("hex"),
});

const pinMatches = (pin: string, account: AccountRecord): boolean => {
  const expected = Buffer.from(account.pinHash, "hex");
  const actual = scryptSync(pin, account.pinSalt, expected.length);
  return timingSafeEqual(actual, expected);
};

export class AccountAuthService {
  constructor(private readonly accounts: AccountRepository) {}

  async register(input: RegisterAccountInput): Promise<AuthSession> {
    if (await this.accounts.findByNicknameKey(nicknameKey(input.nickname))) {
      throw new ApplicationError("nickname already registered", 409, "nickname_taken");
    }
    const pinValue = derivePin(input.pin);
    const account: AccountRecord = {
      accountId: randomUUID(),
      nickname: input.nickname,
      nicknameKey: nicknameKey(input.nickname),
      pinSalt: pinValue.salt,
      pinHash: pinValue.hash,
      authToken: randomUUID(),
      personalityTags: [],
      interestTags: [],
      profileIntro: "",
      petName: "小天",
      avatarUrl: null,
      gender: null,
      birthDate: null,
      city: null,
      accountKind: "real",
      poolScope: "live",
      growthScore: 100,
      createdAt: new Date().toISOString(),
    };
    await this.accounts.create(account);
    return this.toAuthSession(account);
  }

  async login(input: LoginAccountInput): Promise<AuthSession> {
    const account = await this.accounts.findByNicknameKey(nicknameKey(input.nickname));
    if (!account || !pinMatches(input.pin, account)) {
      throw new ApplicationError("invalid nickname or PIN", 401, "invalid_credentials");
    }
    return this.toAuthSession(account);
  }

  async authenticate(token: string): Promise<AccountRecord> {
    if (!token) throw new ApplicationError("missing account token", 401, "unauthorized");
    const account = await this.accounts.findByToken(token);
    if (!account) throw new ApplicationError("invalid account token", 401, "unauthorized");
    return account;
  }

  async findByPhone(phoneInput: string): Promise<AccountRecord | null> {
    return this.accounts.findByPhone(normalizePhone(phoneInput));
  }

  async registerPhone(phoneInput: string, nickname: string): Promise<AuthSession> {
    const phone = normalizePhone(phoneInput);
    if (await this.accounts.findByPhone(phone)) {
      throw new ApplicationError("该手机号已经注册", 409, "phone_registered");
    }
    const pinValue = derivePin(randomBytes(24).toString("hex"));
    const account: AccountRecord = {
      accountId: randomUUID(),
      nickname,
      nicknameKey: nicknameKey(nickname),
      pinSalt: pinValue.salt,
      pinHash: pinValue.hash,
      authToken: randomUUID(),
      phone,
      personalityTags: [],
      interestTags: [],
      profileIntro: "",
      petName: "小天",
      avatarUrl: null,
      gender: null,
      birthDate: null,
      city: null,
      accountKind: "real",
      poolScope: "live",
      growthScore: 100,
      createdAt: new Date().toISOString(),
    };
    await this.accounts.create(account);
    return this.toAuthSession(account);
  }

  async loginPhone(phoneInput: string): Promise<AuthSession> {
    const account = await this.accounts.findByPhone(normalizePhone(phoneInput));
    if (!account) {
      throw new ApplicationError("该手机号尚未注册", 404, "phone_not_registered");
    }
    return this.toAuthSession(account);
  }

  async ensureShowcasePhone(phoneInput: string, nickname: string): Promise<AccountRecord> {
    const phone = normalizePhone(phoneInput);
    const existing = await this.accounts.findByPhone(phone);
    if (existing) return existing;
    const pinValue = derivePin(randomBytes(24).toString("hex"));
    const account: AccountRecord = {
      accountId: randomUUID(),
      nickname,
      nicknameKey: nicknameKey(`${nickname}-${phone}`),
      pinSalt: pinValue.salt,
      pinHash: pinValue.hash,
      authToken: randomUUID(),
      phone,
      personalityTags: [],
      interestTags: [],
      profileIntro: "",
      petName: "小天",
      avatarUrl: null,
      gender: null,
      birthDate: null,
      city: null,
      accountKind: "showcase",
      poolScope: "showcase",
      growthScore: 100,
      createdAt: new Date().toISOString(),
    };
    await this.accounts.create(account);
    return account;
  }

  async addGrowth(accountId: string, amount: number): Promise<AuthSession> {
    return this.toAuthSession(await this.accounts.addGrowth(accountId, amount));
  }

  async getAccountProfile(token: string): Promise<AuthSession> {
    return this.toAuthSession(await this.authenticate(token));
  }

  async updateAccountProfile(
    token: string,
    input: UpdateAccountProfileInput,
  ): Promise<AuthSession> {
    const account = await this.authenticate(token);
    const updated = await this.accounts.updateProfile(account.accountId, {
      personalityTags: input.personalityTags ?? account.personalityTags,
      interestTags: input.interestTags ?? account.interestTags,
      profileIntro: input.profileIntro ?? account.profileIntro,
      petName: input.petName ?? account.petName,
      avatarUrl: input.avatarUrl === undefined ? account.avatarUrl : input.avatarUrl,
      gender: input.gender ?? account.gender,
      birthDate: input.birthDate ?? account.birthDate,
      city: input.city ?? account.city,
    });
    return this.toAuthSession(updated);
  }

  private toAuthSession(account: AccountRecord): AuthSession {
    return {
      accountId: account.accountId,
      personaId: account.accountId,
      nickname: account.nickname,
      personalityTags: account.personalityTags,
      interestTags: account.interestTags,
      profileIntro: account.profileIntro,
      petName: account.petName,
      avatarUrl: account.avatarUrl,
      gender: account.gender,
      birthDate: account.birthDate,
      city: account.city,
      demographicTags: [
        account.gender === "m" ? "男" : account.gender === "f" ? "女" : null,
        account.birthDate ? account.birthDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1年$2月$3日") : null,
        account.city,
      ].filter((item): item is string => Boolean(item)),
      demographicsComplete: Boolean(account.gender && account.birthDate && account.city),
      accountKind: account.accountKind,
      poolScope: account.poolScope,
      growthScore: account.growthScore,
      token: account.authToken,
      tokenHeader: "x-demo-role-token",
      isSynthetic: false,
    };
  }
}
