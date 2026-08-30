export type PhoneVerificationRecord = {
  phone: string;
  purpose: "register" | "login";
  codeSalt: string;
  codeHash: string;
  expiresAt: string;
  nextSendAt: string;
  failedAttempts: number;
  consumedAt: string | null;
  createdAt: string;
};

export interface PhoneVerificationRepository {
  find(phone: string): Promise<PhoneVerificationRecord | null>;
  save(record: PhoneVerificationRecord): Promise<void>;
  incrementFailedAttempts(phone: string): Promise<void>;
  consume(phone: string, consumedAt: string): Promise<void>;
}

export class InMemoryPhoneVerificationRepository implements PhoneVerificationRepository {
  private readonly records = new Map<string, PhoneVerificationRecord>();

  async find(phone: string) {
    return structuredClone(this.records.get(phone) ?? null);
  }

  async save(record: PhoneVerificationRecord) {
    this.records.set(record.phone, structuredClone(record));
  }

  async incrementFailedAttempts(phone: string) {
    const record = this.records.get(phone);
    if (record) record.failedAttempts += 1;
  }

  async consume(phone: string, consumedAt: string) {
    const record = this.records.get(phone);
    if (record) record.consumedAt = consumedAt;
  }
}
