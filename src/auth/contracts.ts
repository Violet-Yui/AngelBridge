import { z } from "zod";

const NicknameSchema = z.string().trim().min(1).max(24);
const PinSchema = z.string().regex(/^\d{4,12}$/, "PIN must contain 4 to 12 digits");
export const GenderSchema = z.enum(["m", "f"]);
export const BirthDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "birthDate must use YYYY-MM-DD",
).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "birthDate must be a valid date").refine(
  (value) => new Date(`${value}T00:00:00Z`) <= new Date(),
  "birthDate cannot be in the future",
);
export const CitySchema = z.string().trim().min(1).max(40);

export const PersonalityTagSchema = z.enum([
  "热爱生活",
  "理性务实",
  "天马行空",
  "温柔倾听",
  "行动派",
  "创意驱动",
  "细节控",
  "乐于分享",
  "独立自主",
  "爱冒险",
  "成长型",
  "长期主义",
  "共情力强",
  "幽默风趣",
  "手艺人",
]);

export const InterestTagSchema = z.enum([
  "公益",
  "社会时政",
  "职场",
  "教育校园",
  "科技",
  "财经",
  "法律",
  "医疗健康",
  "科普",
  "三农",
  "生活家居",
  "亲子",
  "传统文化",
  "摄影摄像",
  "生活记录",
]);

export const UpdateAccountProfileInputSchema = z.object({
  personalityTags: z.array(PersonalityTagSchema).max(15).optional(),
  interestTags: z.array(InterestTagSchema).max(5).optional(),
  profileIntro: z.string().trim().max(120).optional(),
  petName: z.string().trim().min(1).max(12).optional(),
  avatarUrl: z.string().trim().regex(/^\/api\/media\/[0-9a-f-]+$/).nullable().optional(),
  gender: GenderSchema.optional(),
  birthDate: BirthDateSchema.optional(),
  city: CitySchema.optional(),
}).refine(
  (value) => Object.values(value).some((item) => item !== undefined),
  "at least one account profile field is required",
);

export const RegisterAccountInputSchema = z.object({
  nickname: NicknameSchema,
  pin: PinSchema,
});

export const LoginAccountInputSchema = z.object({
  nickname: NicknameSchema,
  pin: PinSchema,
});

export const PhoneNumberSchema = z.string().trim()
  .regex(/^1[3-9]\d{9}$/, "phone must be an 11-digit mainland China mobile number");

export const SendSmsCodeInputSchema = z.object({
  phone: PhoneNumberSchema,
  purpose: z.enum(["register", "login"]),
});

export const SendSmsCodeAutoInputSchema = z.object({
  phone: PhoneNumberSchema,
});

export const RegisterWithSmsInputSchema = z.object({
  phone: PhoneNumberSchema,
  code: z.string().regex(/^\d{6}$/, "verification code must contain 6 digits"),
  nickname: NicknameSchema,
});

export const LoginWithSmsInputSchema = z.object({
  phone: PhoneNumberSchema,
  code: z.string().regex(/^\d{6}$/, "verification code must contain 6 digits"),
});

export type RegisterAccountInput = z.infer<typeof RegisterAccountInputSchema>;
export type LoginAccountInput = z.infer<typeof LoginAccountInputSchema>;
export type SmsPurpose = z.infer<typeof SendSmsCodeInputSchema>["purpose"];
export type RegisterWithSmsInput = z.infer<typeof RegisterWithSmsInputSchema>;
export type LoginWithSmsInput = z.infer<typeof LoginWithSmsInputSchema>;

export type AuthSession = {
  accountId: string;
  personaId: string;
  nickname: string;
  personalityTags: string[];
  interestTags: string[];
  profileIntro: string;
  petName: string;
  avatarUrl: string | null;
  gender: z.infer<typeof GenderSchema> | null;
  birthDate: string | null;
  city: string | null;
  demographicTags: string[];
  demographicsComplete: boolean;
  accountKind: "real" | "showcase";
  poolScope: "live" | "showcase";
  growthScore: number;
  token: string;
  tokenHeader: "x-demo-role-token";
  isSynthetic: false;
};

export type UpdateAccountProfileInput = z.infer<
  typeof UpdateAccountProfileInputSchema
>;
