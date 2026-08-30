import type { Pool } from "pg";
import type { AccountRecord, AccountRepository } from "../auth/repository";

type AccountRow = {
  account_id: string;
  nickname: string;
  nickname_key: string;
  pin_salt: string;
  pin_hash: string;
  auth_token: string;
  phone: string | null;
  personality_tags: string[];
  interest_tags: string[];
  profile_intro: string;
  pet_name: string;
  avatar_url: string | null;
  gender: "m" | "f" | null;
  birth_date: string | Date | null;
  city: string | null;
  account_kind: "real" | "showcase";
  pool_scope: "live" | "showcase";
  growth_score: number;
  created_at: Date;
};

const mapAccount = (row: AccountRow): AccountRecord => ({
  accountId: row.account_id,
  nickname: row.nickname,
  nicknameKey: row.nickname_key,
  pinSalt: row.pin_salt,
  pinHash: row.pin_hash,
  authToken: row.auth_token,
  phone: row.phone ?? undefined,
  personalityTags: row.personality_tags,
  interestTags: row.interest_tags,
  profileIntro: row.profile_intro,
  petName: row.pet_name,
  avatarUrl: row.avatar_url,
  gender: row.gender,
  birthDate: row.birth_date instanceof Date
    ? row.birth_date.toISOString().slice(0, 10)
    : row.birth_date,
  city: row.city,
  accountKind: row.account_kind,
  poolScope: row.pool_scope,
  growthScore: row.growth_score,
  createdAt: row.created_at.toISOString(),
});

export class PostgresAccountRepository implements AccountRepository {
  constructor(private readonly pool: Pool) {}

  async findByNicknameKey(nicknameKey: string) {
    const result = await this.pool.query<AccountRow>(
      "select * from accounts where nickname_key = $1",
      [nicknameKey],
    );
    return result.rows[0] ? mapAccount(result.rows[0]) : null;
  }

  async findByToken(token: string) {
    const result = await this.pool.query<AccountRow>(
      "select * from accounts where auth_token = $1",
      [token],
    );
    return result.rows[0] ? mapAccount(result.rows[0]) : null;
  }

  async findByPhone(phone: string) {
    const result = await this.pool.query<AccountRow>(
      "select * from accounts where phone = $1",
      [phone],
    );
    return result.rows[0] ? mapAccount(result.rows[0]) : null;
  }

  async create(account: AccountRecord) {
    await this.pool.query(
      `insert into accounts (
         account_id, nickname, nickname_key, pin_salt, pin_hash, auth_token, phone,
         personality_tags, pet_name, avatar_url, gender, birth_date, city, created_at
         , interest_tags, profile_intro, account_kind, pool_scope, growth_score
       ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$18,$19)`,
      [
        account.accountId,
        account.nickname,
        account.nicknameKey,
        account.pinSalt,
        account.pinHash,
        account.authToken,
        account.phone ?? null,
        JSON.stringify(account.personalityTags),
        account.petName,
        account.avatarUrl,
        account.gender,
        account.birthDate,
        account.city,
        account.createdAt,
        JSON.stringify(account.interestTags),
        account.profileIntro,
        account.accountKind,
        account.poolScope,
        account.growthScore,
      ],
    );
  }

  async updateProfile(
    accountId: string,
    profile: Pick<AccountRecord, "personalityTags" | "interestTags" | "profileIntro" | "petName" | "avatarUrl" | "gender" | "birthDate" | "city">,
  ) {
    const result = await this.pool.query<AccountRow>(
      `update accounts
       set personality_tags = $2::jsonb, pet_name = $3, avatar_url = $4,
           gender = $5, birth_date = $6, city = $7,
           interest_tags = $8::jsonb, profile_intro = $9
       where account_id = $1
       returning *`,
      [
        accountId,
        JSON.stringify(profile.personalityTags),
        profile.petName,
        profile.avatarUrl,
        profile.gender,
        profile.birthDate,
        profile.city,
        JSON.stringify(profile.interestTags),
        profile.profileIntro,
      ],
    );
    if (!result.rows[0]) throw new Error("account not found");
    return mapAccount(result.rows[0]);
  }

  async addGrowth(accountId: string, amount: number) {
    const result = await this.pool.query<AccountRow>(
      "update accounts set growth_score = growth_score + $2 where account_id = $1 returning *",
      [accountId, amount],
    );
    if (!result.rows[0]) throw new Error("account not found");
    return mapAccount(result.rows[0]);
  }

  async ping() {
    await this.pool.query("select account_id from accounts limit 1");
  }
}
