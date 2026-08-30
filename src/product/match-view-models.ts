import { z } from "zod";
import { AiMatchAssessmentSchema, HybridScoreBreakdownSchema } from "../ai-matching/contracts";
import type { DemoSession, SessionMatch } from "../demo/session-service";
import { MatchProofSchema } from "../domain/contracts";

export const MatchCardViewSchema = z.object({
  matchId: z.string().min(1),
  counterpartId: z.string().min(1),
  counterpartDisplayName: z.string().min(1),
  bridgeIndex: z.number().min(0).max(100),
  status: MatchProofSchema.shape.status,
  valueToYou: z.array(z.string().min(1)).min(1),
  valueToOther: z.array(z.string().min(1)).min(1),
  unknownCount: z.number().int().nonnegative(),
  scoringMode: z.enum(["rule", "fixture_ai"]),
  isSynthetic: z.literal(true),
});

export const MatchDetailViewSchema = MatchCardViewSchema.extend({
  proof: MatchProofSchema,
  assessment: AiMatchAssessmentSchema.optional(),
  scoreBreakdown: HybridScoreBreakdownSchema.optional(),
});

export type MatchCardView = z.infer<typeof MatchCardViewSchema>;
export type MatchDetailView = z.infer<typeof MatchDetailViewSchema>;

const counterpartFor = (
  session: DemoSession,
  match: SessionMatch,
  personaId: string,
) => {
  const isViewer = match.proof.viewerId === personaId;
  const counterpartId = isViewer ? match.proof.candidateId : match.proof.viewerId;
  const counterpart = session.profiles.find(
    (profile) => profile.personaId === counterpartId,
  );
  if (!counterpart) throw new Error("match counterpart does not belong to session");
  return { isViewer, counterpartId, counterpart };
};

export const toMatchCardView = (
  session: DemoSession,
  match: SessionMatch,
  personaId: string,
): MatchCardView => {
  const { isViewer, counterpartId, counterpart } = counterpartFor(
    session,
    match,
    personaId,
  );
  return MatchCardViewSchema.parse({
    matchId: match.proof.matchId,
    counterpartId,
    counterpartDisplayName: counterpart.displayName,
    bridgeIndex: match.internalScore,
    status: match.proof.status,
    valueToYou: isViewer ? match.proof.valueToViewer : match.proof.valueToCandidate,
    valueToOther: isViewer ? match.proof.valueToCandidate : match.proof.valueToViewer,
    unknownCount: match.proof.unknowns.length,
    scoringMode: "assessment" in match ? "fixture_ai" : "rule",
    isSynthetic: true,
  });
};

export const toMatchDetailView = (
  session: DemoSession,
  match: SessionMatch,
  personaId: string,
): MatchDetailView => MatchDetailViewSchema.parse({
  ...toMatchCardView(session, match, personaId),
  proof: match.proof,
  ...( "assessment" in match
    ? { assessment: match.assessment, scoreBreakdown: match.scoreBreakdown }
    : {}),
});
