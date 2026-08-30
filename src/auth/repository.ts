export type AccountRecord = {
  accountId: string;
  nickname: string;
  nicknameKey: string;
  pinSalt: string;
  pinHash: string;
  authToken: string;
  phone?: string;
  personalityTags: string[];
  interestTags: string[];
  profileIntro: string;
  petName: string;
  avatarUrl: string | null;
  gender: "m" | "f" | null;
  birthDate: string | null;
  city: string | null;
  accountKind: "real" | "showcase";
  poolScope: "live" | "showcase";
  growthScore: number;
  createdAt: string;
};

export interface AccountRepository {
  findByNicknameKey(nicknameKey: string): Promise<AccountRecord | null>;
  findByToken(token: string): Promise<AccountRecord | null>;
  findByPhone(phone: string): Promise<AccountRecord | null>;
  create(account: AccountRecord): Promise<void>;
  updateProfile(
    accountId: string,
    profile: Pick<AccountRecord, "personalityTags" | "interestTags" | "profileIntro" | "petName" | "avatarUrl" | "gender" | "birthDate" | "city">,
  ): Promise<AccountRecord>;
  addGrowth(accountId: string, amount: number): Promise<AccountRecord>;
  ping(): Promise<void>;
}

export class InMemoryAccountRepository implements AccountRepository {
  private readonly accountsById = new Map<string, AccountRecord>();

  async findByNicknameKey(nicknameKey: string) {
    const account = [...this.accountsById.values()].find(
      (item) => item.nicknameKey === nicknameKey,
    );
    return structuredClone(account ?? null);
  }

  async findByToken(token: string) {
    const account = [...this.accountsById.values()].find(
      (item) => item.authToken === token,
    );
    return structuredClone(account ?? null);
  }

  async findByPhone(phone: string) {
    const account = [...this.accountsById.values()].find(
      (item) => item.phone === phone,
    );
    return structuredClone(account ?? null);
  }

  async create(account: AccountRecord) {
    if (account.phone && await this.findByPhone(account.phone)) {
      throw new Error("phone already exists");
    }
    this.accountsById.set(account.accountId, structuredClone(account));
  }

  async updateProfile(
    accountId: string,
    profile: Pick<AccountRecord, "personalityTags" | "interestTags" | "profileIntro" | "petName" | "avatarUrl" | "gender" | "birthDate" | "city">,
  ) {
    const account = this.accountsById.get(accountId);
    if (!account) throw new Error("account not found");
    const updated = { ...account, ...structuredClone(profile) };
    this.accountsById.set(accountId, updated);
    return structuredClone(updated);
  }

  async addGrowth(accountId: string, amount: number) {
    const account = this.accountsById.get(accountId);
    if (!account) throw new Error("account not found");
    const updated = { ...account, growthScore: account.growthScore + amount };
    this.accountsById.set(accountId, updated);
    return structuredClone(updated);
  }

  async ping() {}
}
