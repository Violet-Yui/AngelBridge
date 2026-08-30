import type { Pool } from "pg";
import type {
  PhoneVerificationRecord,
  PhoneVerificationRepository,
} from "../auth/phone-verification-repository";

type VerificationRow = {
  phone: string;
  purpose: "register" | "login";
  code_salt: string;
  code_hash: string;
  expires_at: Date;
  next_send_at: Date;
  failed_attempts: number;
  consumed_at: Date | null;
  created_at: Date;
};

const mapRecord = (row: VerificationRow): PhoneVerificationRecord => ({
  phone: row.phone,
  purpose: row.purpose,
  codeSalt: row.code_salt,
  codeHash: row.code_hash,
  expiresAt: row.expires_at.toISOString(),
  nextSendAt: row.next_send_at.toISOString(),
  failedAttempts: row.failed_attempts,
  consumedAt: row.consumed_at?.toISOString() ?? null,
  createdAt: row.created_at.toISOString(),
});

export class PostgresPhoneVerificationRepository implements PhoneVerificationRepository {
  constructor(private readonly pool: Pool) {}

  async find(phone: string) {
    const result = await this.pool.query<VerificationRow>(
      "select * from sms_verification_codes where phone = $1",
      [phone],
    );
    return result.rows[0] ? mapRecord(result.rows[0]) : null;
  }

  async save(record: PhoneVerificationRecord) {
    await this.pool.query(
      `insert into sms_verification_codes (
         phone, purpose, code_salt, code_hash, expires_at, next_send_at,
         failed_attempts, consumed_at, created_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (phone) do update set
         purpose = excluded.purpose,
         code_salt = excluded.code_salt,
         code_hash = excluded.code_hash,
         expires_at = excluded.expires_at,
         next_send_at = excluded.next_send_at,
         failed_attempts = excluded.failed_attempts,
         consumed_at = excluded.consumed_at,
         created_at = excluded.created_at`,
      [
        record.phone,
        record.purpose,
        record.codeSalt,
        record.codeHash,
        record.expiresAt,
        record.nextSendAt,
        record.failedAttempts,
        record.consumedAt,
        record.createdAt,
      ],
    );
  }

  async incrementFailedAttempts(phone: string) {
    await this.pool.query(
      "update sms_verification_codes set failed_attempts = failed_attempts + 1 where phone = $1",
      [phone],
    );
  }

  async consume(phone: string, consumedAt: string) {
    await this.pool.query(
      "update sms_verification_codes set consumed_at = $2 where phone = $1",
      [phone, consumedAt],
    );
  }
}
