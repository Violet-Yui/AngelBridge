import type { ImageAttachment } from "../media/contracts";
import type {
  LifeTreeDiagnosis,
  PetOrganizeInput,
  PetOrganizeResult,
} from "../pool/contracts";

export type PetProductContext = {
  account: {
    accountId: string;
    nickname: string;
    profileIntro: string;
    petName: string;
    gender: "m" | "f" | null;
    birthDate: string | null;
    city: string | null;
    personalityTags: string[];
    interestTags: string[];
    growthScore: number;
  };
  lifeTree: {
    status: string;
    bio: string;
    offers: string[];
    needs: string[];
    goals: string[];
    explorations: string[];
  } | null;
  publications: Array<{
    publicationId: string;
    title: string;
    content: string;
    category: string;
    kind: string;
    status: string;
    offers: string[];
    needs: string[];
    goals: string[];
    constraints: unknown;
    publishedAt: string | null;
  }>;
  matches: Array<Record<string, unknown>>;
  pacts: Array<Record<string, unknown>>;
  conversations: Array<Record<string, unknown>>;
};

export type PetChatContext = {
  nickname: string;
  petName: string;
  personalityTags: string[];
  message: string;
  images: ImageAttachment[];
  recentTurns: Array<{ userText: string; assistantText: string }>;
  productContext?: PetProductContext;
};

export interface PetChatProvider {
  reply(context: PetChatContext): Promise<string>;
  organize?(context: PetChatContext & PetOrganizeInput): Promise<PetOrganizeResult>;
  diagnoseLifeTree?(context: PetChatContext): Promise<LifeTreeDiagnosis>;
}
