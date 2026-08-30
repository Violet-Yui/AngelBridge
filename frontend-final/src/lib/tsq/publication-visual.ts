import type { PublicationDetail } from "@/lib/angelbridge-types";

export type PublicationVisualKind = "green" | "warm" | "purple";

const EMOJI_BY_CATEGORY: Record<string, string[]> = {
  space: ["🏠", "📍"], items: ["🎁", "📦"], idle: ["♻️", "🪴"],
  skills: ["🤝", "🛠️"], jobs: ["💼", "🔍"], people: ["🧑‍🤝‍🧑", "🌿"],
  experience: ["📚", "🧭"], video: ["🎬", "📹"],
};

export function getPublicationVisual(publication: Pick<PublicationDetail, "publicationId" | "category" | "kind">): {
  kind: PublicationVisualKind;
  emoji: string;
} {
  const choices = EMOJI_BY_CATEGORY[publication.category]
    ?? (publication.kind === "offer" ? ["🌱"] : publication.kind === "need" ? ["✨"] : ["🤝"]);
  let hash = 0;
  for (const char of publication.publicationId) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return {
    kind: publication.kind === "need" ? "purple" : publication.kind === "exchange" ? "warm" : "green",
    emoji: choices[Math.abs(hash) % choices.length],
  };
}
