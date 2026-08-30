import { randomUUID } from "node:crypto";
import { AccountAuthService } from "../auth/account-auth-service";
import { ApplicationError } from "../application/app-service";
import type { ValueNode } from "../domain/contracts";
import { rankCandidates } from "../domain/matching";
import { rankCandidatesWithAi } from "../ai-matching/hybrid-matching";
import type { AiMatchAssessmentProvider } from "../ai-matching/provider";
import {
  createConsentRecord,
  submitConsent,
  type ConsentDecision,
} from "../domain/workflow";
import {
  MatchPoolStateSchema,
  PublicationSchema,
  PoolMatchSchema,
  PoolMessageSchema,
  PoolPetTurnSchema,
  PoolPactSchema,
  PoolProfileSchema,
  type MatchPoolState,
  type CreatePublicationInput,
  type UpdatePublicationInput,
  type Publication,
  type PoolMatch,
  type PoolMessage,
  type PoolPetTurn,
  type PoolPact,
  type LifeTreeRecord,
  type SaveLifeTreeInput,
  type PoolProfile,
  type PetOrganizeInput,
  type PetOrganizeResult,
  type SavePoolProfileInput,
} from "./contracts";
import type { MatchPoolStateRepository } from "./repository";
import type { PetChatProvider, PetProductContext } from "../pet-ai/provider";
import type { AccountRecord } from "../auth/repository";

const emptyState = (): MatchPoolState => ({
  version: 1,
  profiles: {},
  publications: {},
  matches: {},
  messages: [],
  conversationReads: {},
  petTurns: [],
  pacts: {},
  lifeTrees: {},
});

const canonicalMatchId = (left: string, right: string): string =>
  `pool-match:${[left, right].sort().join(":")}`;

const canonicalPublicationMatchId = (left: string, right: string): string =>
  `publication-match:${[left, right].sort().join(":")}`;

export class MatchPoolService {
  private state = emptyState();
  private loaded = false;

  constructor(
    private readonly auth: AccountAuthService,
    private readonly repository: MatchPoolStateRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly aiMatchProvider?: AiMatchAssessmentProvider,
    private readonly petChatProvider?: PetChatProvider,
    private readonly publishMessage?: (message: PoolMessage) => void,
  ) {}

  async getProfile(token: string): Promise<PoolProfile | null> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    return structuredClone(this.state.profiles[account.accountId] ?? null);
  }

  async saveProfile(token: string, input: SavePoolProfileInput): Promise<PoolProfile> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const timestamp = this.now().toISOString();
    const nodes = [
      ...this.nodesFor(account.accountId, "offer", input.offers, input.constraints, timestamp),
      ...this.nodesFor(account.accountId, "need", input.needs, input.constraints, timestamp),
      ...this.nodesFor(account.accountId, "goal", input.goals, input.constraints, timestamp),
    ];
    const profile = PoolProfileSchema.parse({
      accountId: account.accountId,
      poolScope: account.poolScope,
      bio: input.bio,
      avatarUrl: account.avatarUrl,
      profile: {
        personaId: account.accountId,
        displayName: account.nickname,
        personalityTags: account.personalityTags,
        interestTags: account.interestTags,
        nodes,
        acceptedExchangeModes: input.acceptedExchangeModes,
        constraints: input.constraints,
      },
      disclosurePolicy: input.disclosurePolicy,
      proposedPactTerms: input.proposedPactTerms,
      status: "draft",
      updatedAt: timestamp,
      isSynthetic: false,
    });
    this.state.profiles[account.accountId] = profile;
    this.removeMatchesFor(account.accountId);
    await this.persist();
    return structuredClone(profile);
  }

  async activateProfile(token: string): Promise<PoolProfile> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const profile = this.requireProfile(account.accountId);
    profile.status = "active";
    profile.updatedAt = this.now().toISOString();
    await this.persist();
    return structuredClone(profile);
  }

  async createPublication(
    token: string,
    input: CreatePublicationInput,
  ): Promise<Publication> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const publicationId = randomUUID();
    const timestamp = this.now().toISOString();
    const composed = await this.composePublication(account, input);
    const publication = this.buildPublication(
      publicationId,
      account,
      input,
      composed,
      "draft",
      timestamp,
      timestamp,
      null,
    );
    this.state.publications[publicationId] = publication;
    await this.persist();
    return structuredClone(publication);
  }

  async listPublications(token: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    return Object.values(this.state.publications)
        .filter((item) =>
          item.authorAccountId === account.accountId && item.status !== "deleted"
        )
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map((item) => this.toPublicationDetail(item, account.accountId));
  }

  async listDiscoverPublications(token: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    return Object.values(this.state.publications)
      .filter((item) =>
        item.poolScope === account.poolScope &&
        (item.status === "published" || (item.status === "completed" && item.discoveryVisible))
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((item) => this.toPublicationDetail(item, account.accountId));
  }

  async getPublication(token: string, publicationId: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const publication = this.state.publications[publicationId];
    const visitorCanView = publication?.status === "published" ||
      (publication?.status === "completed" && publication.discoveryVisible);
    if (!publication ||
      (publication.authorAccountId !== account.accountId && !visitorCanView)) {
      throw new ApplicationError("publication not found", 404, "publication_not_found");
    }
    return this.toPublicationDetail(publication, account.accountId);
  }

  async updatePublication(
    token: string,
    publicationId: string,
    input: UpdatePublicationInput,
  ): Promise<Publication> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const current = this.requireOwnedPublication(publicationId, account.accountId);
    const nextInput: CreatePublicationInput = {
      title: input.title ?? current.title,
      category: input.category ?? current.category,
      kind: input.kind ?? current.kind,
      bio: input.bio ?? current.bio,
      offers: input.offers ?? current.offers,
      needs: input.needs ?? current.needs,
      goals: input.goals ?? current.goals,
      acceptedExchangeModes: input.acceptedExchangeModes ?? current.acceptedExchangeModes,
      constraints: input.constraints ?? current.constraints,
      disclosurePolicy: input.disclosurePolicy ?? current.disclosurePolicy,
      proposedPactTerms: input.proposedPactTerms === undefined
        ? current.proposedPactTerms
        : input.proposedPactTerms,
    };
    const shouldRecompose = [
      input.bio,
      input.offers,
      input.needs,
      input.goals,
      input.acceptedExchangeModes,
      input.constraints,
      input.proposedPactTerms,
    ].some((value) => value !== undefined);
    const composed = shouldRecompose
      ? await this.composePublication(account, nextInput)
      : { title: nextInput.title ?? current.title, content: current.content };
    const updated = this.buildPublication(
      publicationId,
      account,
      nextInput,
      composed,
      current.status,
      current.createdAt,
      this.now().toISOString(),
      current.publishedAt,
      current.discoveryVisible,
      current.completionDecisionAt,
    );
    this.state.publications[publicationId] = updated;
    this.removeMatchesForPublication(publicationId);
    await this.persist();
    return structuredClone(updated);
  }

  async publishPublication(token: string, publicationId: string): Promise<Publication> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const publication = this.requireOwnedPublication(publicationId, account.accountId);
    publication.status = "published";
    publication.updatedAt = this.now().toISOString();
    publication.publishedAt ??= publication.updatedAt;
    await this.persist();
    return structuredClone(publication);
  }

  async decidePublicationAfterCompletion(
    token: string,
    publicationId: string,
    input: { action: "continue_matching" } | {
      action: "close_matching";
      discoveryVisible: boolean;
    },
  ) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const publication = this.requireOwnedPublication(publicationId, account.accountId);
    publication.status = input.action === "continue_matching" ? "published" : "completed";
    if (input.action === "close_matching") {
      publication.discoveryVisible = input.discoveryVisible;
    }
    publication.completionDecisionAt = this.now().toISOString();
    publication.updatedAt = publication.completionDecisionAt;
    if (publication.status !== "published") this.removeMatchesForPublication(publicationId);
    await this.persist();
    return this.toPublicationDetail(publication, account.accountId);
  }

  async deletePublication(token: string, publicationId: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const publication = this.requireOwnedPublication(publicationId, account.accountId);
    publication.status = "deleted";
    publication.discoveryVisible = false;
    publication.updatedAt = this.now().toISOString();
    this.removeMatchesForPublication(publicationId);
    await this.persist();
    return { publicationId, deleted: true as const };
  }

  async syncAccountProfile(
    token: string,
    invalidatePendingMatches = false,
  ): Promise<PoolProfile | null> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const profile = this.state.profiles[account.accountId];
    if (!profile) return null;
    profile.profile.displayName = account.nickname;
    profile.profile.personalityTags = [...account.personalityTags];
    profile.profile.interestTags = [...account.interestTags];
    profile.avatarUrl = account.avatarUrl;
    profile.updatedAt = this.now().toISOString();
    for (const publication of Object.values(this.state.publications)) {
      if (publication.authorAccountId !== account.accountId) continue;
      publication.profile.displayName = account.nickname;
      publication.profile.personalityTags = [...account.personalityTags];
      publication.profile.interestTags = [...account.interestTags];
      publication.avatarUrl = account.avatarUrl;
      publication.updatedAt = this.now().toISOString();
    }
    if (invalidatePendingMatches) this.removeMatchesFor(account.accountId);
    await this.persist();
    return structuredClone(profile);
  }

  async runMatching(token: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const published = Object.values(this.state.publications)
      .filter((item) => item.authorAccountId === account.accountId && item.status === "published");
    if (published.length > 0) {
      for (const publication of published) {
        await this.runPublicationMatchingForAccount(account, publication);
      }
      await this.persist();
      return this.listMatches(token);
    }
    const viewer = this.requireActiveProfile(account.accountId);
    const candidates = Object.values(this.state.profiles)
      .filter((item) =>
        item.accountId !== account.accountId &&
        item.status === "active" &&
        item.poolScope === account.poolScope
      );
    const ranked = this.aiMatchProvider
      ? await rankCandidatesWithAi(
          viewer.profile,
          candidates.map((item) => item.profile),
          this.aiMatchProvider,
          this.now(),
        )
      : rankCandidates(
          viewer.profile,
          candidates.map((item) => item.profile),
          this.now(),
        );
    const timestamp = this.now().toISOString();
    for (const result of ranked) {
      const matchId = canonicalMatchId(account.accountId, result.candidateId);
      const previous = this.state.matches[matchId];
      if (previous) continue;
      const consent = createConsentRecord(
        account.accountId,
        result.candidateId,
      );
      this.state.matches[matchId] = PoolMatchSchema.parse({
        matchId,
        viewerId: account.accountId,
        candidateId: result.candidateId,
        internalScore: result.internalScore,
        proof: {
          ...result.proof,
          matchId,
          status: consent.state,
          isSynthetic: false,
          datasetVersion: "user-v1",
        },
        assessment: "assessment" in result ? result.assessment : undefined,
        scoreBreakdown: "scoreBreakdown" in result ? result.scoreBreakdown : undefined,
        consent,
        updatedAt: timestamp,
        isSynthetic: false,
      });
    }
    await this.persist();
    return this.listMatches(token);
  }

  async runPublicationMatching(token: string, publicationId: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const publication = this.requireOwnedPublication(publicationId, account.accountId);
    if (publication.status !== "published") {
      throw new ApplicationError(
        "publication must be published before matching",
        409,
        "publication_not_published",
      );
    }
    await this.runPublicationMatchingForAccount(account, publication);
    await this.persist();
    return this.listPublicationMatches(token, publicationId);
  }

  async listPublicationMatches(token: string, publicationId: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    this.requireOwnedPublication(publicationId, account.accountId);
    return Object.values(this.state.matches)
      .filter((match) =>
        match.consent.partyIds.includes(account.accountId) &&
        (match.sourcePublicationId === publicationId || match.targetPublicationId === publicationId)
      )
      .sort((left, right) => right.internalScore - left.internalScore)
      .map((match) => this.toMatchView(match, account.accountId));
  }

  async listMatches(token: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    return Object.values(this.state.matches)
      .filter((match) => match.consent.partyIds.includes(account.accountId))
      .sort((left, right) => right.internalScore - left.internalScore)
      .map((match) => this.toMatchView(match, account.accountId));
  }

  async getMatch(token: string, matchId: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const match = this.requireMatchFor(matchId, account.accountId);
    return {
      ...this.toMatchView(match, account.accountId),
      proof: { ...match.proof, status: match.consent.state },
    };
  }

  async submitConsent(
    token: string,
    matchId: string,
    decision: ConsentDecision,
  ) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const match = this.requireMatchFor(matchId, account.accountId);
    match.consent = submitConsent(match.consent, account.accountId, decision);
    match.proof.status = match.consent.state;
    match.updatedAt = this.now().toISOString();
    if (match.consent.state === "mutual_accepted" && !this.state.pacts[matchId]) {
      const pact = this.createPact(match);
      this.state.pacts[matchId] = pact;
      const message = match.sourcePublicationId
        ? this.appendSystemMessage(matchId, "pact_proposed", "小天整理了一份桥约", {
            pactId: pact.pactId,
            title: pact.title,
            status: pact.status,
            firstAction: pact.firstAction,
            completionCriteria: pact.completionCriteria,
            exitRule: pact.exitRule,
            nextAction: "confirm_start",
          })
        : null;
      await this.persist();
      if (message) this.publishMessage?.(message);
      return structuredClone(match.consent);
    }
    await this.persist();
    return structuredClone(match.consent);
  }

  async getPact(token: string, matchId: string): Promise<PoolPact> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    this.requireMatchFor(matchId, account.accountId);
    const pact = this.state.pacts[matchId];
    if (!pact) throw new ApplicationError("双方同意后才能生成桥约", 409, "pact_not_ready");
    return structuredClone(pact);
  }

  async listPacts(token: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    return Object.values(this.state.pacts)
      .filter((pact) => pact.partyIds.includes(account.accountId))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((pact) => {
        const counterpartId = pact.partyIds.find((id) => id !== account.accountId)!;
        const match = this.requireMatchFor(pact.matchId, account.accountId);
        const counterpart = this.counterpartIdentity(match, account.accountId);
        const yourStartConfirmed = Boolean(pact.startConfirmations[account.accountId]);
        const counterpartStartConfirmed = Boolean(pact.startConfirmations[counterpartId]);
        const yourCompletionConfirmed = Boolean(
          pact.completionConfirmations[account.accountId],
        );
        const counterpartCompletionConfirmed = Boolean(
          pact.completionConfirmations[counterpartId],
        );
        const nextAction = pact.status === "waiting_start"
          ? yourStartConfirmed ? "wait_counterpart_start" : "confirm_start"
          : pact.status === "active" || pact.status === "waiting_completion"
            ? yourCompletionConfirmed ? "wait_counterpart_completion" : "confirm_completion"
            : pact.status === "completed" ? "view_result" : "none";
        return {
          pactId: pact.pactId,
          matchId: pact.matchId,
          title: pact.title,
          status: pact.status,
          counterpartId,
          counterpartDisplayName: counterpart.displayName,
          counterpartAvatarUrl: counterpart.avatarUrl,
          valueToYou: match.viewerId === account.accountId
            ? match.proof.valueToViewer
            : match.proof.valueToCandidate,
          valueToOther: match.viewerId === account.accountId
            ? match.proof.valueToCandidate
            : match.proof.valueToViewer,
          yourStartConfirmed,
          counterpartStartConfirmed,
          yourCompletionConfirmed,
          counterpartCompletionConfirmed,
          nextAction,
          createdAt: pact.createdAt,
          activatedAt: pact.activatedAt,
          completedAt: pact.completedAt,
          isSynthetic: false as const,
        };
      });
  }

  async updatePact(
    token: string,
    matchId: string,
    input: {
      title?: string;
      firstAction?: string;
      completionCriteria?: string;
      exitRule?: string;
      otherNotes?: string;
    },
  ): Promise<PoolPact> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const pact = this.requirePact(matchId, account.accountId);
    if (Object.values(pact.startConfirmations).some(Boolean)) {
      throw new ApplicationError("开始确认后不能修改桥约", 409, "pact_locked");
    }
    Object.assign(pact, input);
    const match = this.state.matches[matchId];
    const message = match?.sourcePublicationId
      ? this.appendSystemMessage(matchId, "pact_updated", "桥约内容已更新", {
          pactId: pact.pactId,
          title: pact.title,
          status: pact.status,
          firstAction: pact.firstAction,
          completionCriteria: pact.completionCriteria,
          exitRule: pact.exitRule,
        })
      : null;
    await this.persist();
    if (message) this.publishMessage?.(message);
    return structuredClone(pact);
  }

  async confirmPactStart(token: string, matchId: string): Promise<PoolPact> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const pact = this.requirePact(matchId, account.accountId);
    if (pact.status !== "waiting_start") return structuredClone(pact);
    pact.startConfirmations[account.accountId] = true;
    const messages: PoolMessage[] = [];
    if (pact.sourcePublicationId) messages.push(this.appendSystemMessage(
      matchId, "pact_start_confirmation", `${account.nickname} 已确认开始履约`,
      { pactId: pact.pactId, accountId: account.accountId },
    ));
    if (pact.partyIds.every((id) => pact.startConfirmations[id])) {
      pact.status = "active";
      pact.activatedAt = this.now().toISOString();
      if (pact.sourcePublicationId) messages.push(this.appendSystemMessage(matchId, "pact_started", "双方已确认，桥约开始履行", {
        pactId: pact.pactId,
        status: pact.status,
        activatedAt: pact.activatedAt,
        nextAction: "confirm_completion",
      }));
    }
    await this.persist();
    messages.forEach((message) => this.publishMessage?.(message));
    return structuredClone(pact);
  }

  async confirmPactCompletion(token: string, matchId: string): Promise<PoolPact> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const pact = this.requirePact(matchId, account.accountId);
    if (pact.status !== "active" && pact.status !== "waiting_completion") {
      throw new ApplicationError("桥约尚未开始", 409, "pact_not_active");
    }
    pact.status = "waiting_completion";
    pact.completionConfirmations[account.accountId] = true;
    const messages: PoolMessage[] = [];
    if (pact.sourcePublicationId) messages.push(this.appendSystemMessage(
      matchId, "pact_completion_confirmation", `${account.nickname} 已确认完成履约`,
      { pactId: pact.pactId, accountId: account.accountId },
    ));
    if (pact.partyIds.every((id) => pact.completionConfirmations[id])) {
      pact.status = "completed";
      pact.completedAt = this.now().toISOString();
      if (!pact.rewarded) {
        await Promise.all(pact.partyIds.map((id) => this.auth.addGrowth(id, 20)));
        pact.rewarded = true;
      }
      for (const publicationId of [pact.sourcePublicationId, pact.targetPublicationId]) {
        if (!publicationId) continue;
        const publication = this.state.publications[publicationId];
        if (!publication || publication.status === "deleted") continue;
        publication.status = "completed";
        publication.discoveryVisible = true;
        publication.completionDecisionAt = pact.completedAt;
        publication.updatedAt = pact.completedAt;
        this.removeMatchesForPublication(publicationId);
      }
      if (pact.sourcePublicationId) messages.push(this.appendSystemMessage(matchId, "pact_completed", "桥约已完成，双方成长值 +20", {
        pactId: pact.pactId,
        status: pact.status,
        growthDelta: 20,
        completedAt: pact.completedAt,
      }));
    }
    await this.persist();
    messages.forEach((message) => this.publishMessage?.(message));
    return structuredClone(pact);
  }

  async exitPact(token: string, matchId: string): Promise<PoolPact> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const pact = this.requirePact(matchId, account.accountId);
    let message: PoolMessage | null = null;
    if (pact.status !== "completed" && pact.status !== "exited") {
      pact.status = "exited";
      if (pact.sourcePublicationId) {
        message = this.appendSystemMessage(matchId, "pact_exited", `${account.nickname} 已结束桥约`, {
          pactId: pact.pactId,
          status: pact.status,
        });
      }
    }
    await this.persist();
    if (message) this.publishMessage?.(message);
    return structuredClone(pact);
  }

  async getLifeTree(token: string): Promise<LifeTreeRecord | null> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    return structuredClone(this.state.lifeTrees[account.accountId] ?? null);
  }

  async saveLifeTree(token: string, input: SaveLifeTreeInput): Promise<LifeTreeRecord> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const lifeTree: LifeTreeRecord = {
      accountId: account.accountId,
      ...structuredClone(input),
      diagnosis: null,
      diagnosedAt: null,
      updatedAt: this.now().toISOString(),
      isSynthetic: false,
    };
    this.state.lifeTrees[account.accountId] = lifeTree;
    await this.persist();
    return structuredClone(lifeTree);
  }

  async diagnoseLifeTree(token: string): Promise<LifeTreeRecord> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const lifeTree = this.state.lifeTrees[account.accountId];
    if (!lifeTree) {
      throw new ApplicationError("life tree not found", 404, "life_tree_not_found");
    }
    if (!this.petChatProvider?.diagnoseLifeTree) {
      throw new ApplicationError("小天人生树诊断尚未配置", 503, "life_tree_ai_not_configured");
    }
    const diagnosis = await this.petChatProvider.diagnoseLifeTree({
      nickname: account.nickname,
      petName: account.petName,
      personalityTags: account.personalityTags,
      message: "诊断我的人生树",
      images: [],
      recentTurns: [],
      productContext: this.buildPetProductContext(account),
    });
    lifeTree.diagnosis = diagnosis;
    lifeTree.diagnosedAt = this.now().toISOString();
    lifeTree.updatedAt = lifeTree.diagnosedAt;
    await this.persist();
    return structuredClone(lifeTree);
  }

  async getDashboard(token: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    const profile = this.state.profiles[account.accountId] ?? null;
    const matches = await this.listMatches(token);
    const publications = Object.values(this.state.publications)
      .filter((item) =>
        item.authorAccountId === account.accountId && item.status !== "deleted"
      );
    const publishedPublications = publications.filter((item) => item.status === "published");
    const recommendations = publishedPublications.length <= 1
      ? matches.slice(0, 4)
      : (() => {
          const selected: typeof matches = [];
          const covered = new Set<string>();
          for (const match of matches) {
            if (!match.publicationId || covered.has(match.publicationId)) continue;
            selected.push(match);
            covered.add(match.publicationId);
            if (selected.length === 4) return selected;
          }
          for (const match of matches) {
            if (selected.some((item) => item.matchId === match.matchId)) continue;
            selected.push(match);
            if (selected.length === 4) break;
          }
          return selected;
        })();
    const pacts = Object.values(this.state.pacts)
      .filter((pact) => pact.partyIds.includes(account.accountId));
    const pendingTasks = pacts.flatMap((pact) => {
      if (pact.status === "waiting_start") {
        return [{
          type: pact.startConfirmations[account.accountId] ? "wait_pact_start" : "confirm_pact_start",
          matchId: pact.matchId,
          title: pact.startConfirmations[account.accountId] ? "等待对方确认开始" : "确认开始履约",
        }];
      }
      if (pact.status === "active" || pact.status === "waiting_completion") {
        return [{
          type: pact.completionConfirmations[account.accountId]
            ? "wait_pact_completion"
            : "confirm_pact_completion",
          matchId: pact.matchId,
          title: pact.completionConfirmations[account.accountId]
            ? "等待对方确认完成"
            : "确认桥约已完成",
        }];
      }
      if (pact.status === "completed" && pact.completedAt) {
        const publicationId = pact.sourcePublicationId &&
            this.state.publications[pact.sourcePublicationId]?.authorAccountId === account.accountId
          ? pact.sourcePublicationId
          : pact.targetPublicationId &&
              this.state.publications[pact.targetPublicationId]?.authorAccountId === account.accountId
            ? pact.targetPublicationId
            : null;
        const publication = publicationId ? this.state.publications[publicationId] : null;
        if (publication &&
          (!publication.completionDecisionAt || pact.completedAt > publication.completionDecisionAt)) {
          return [{
            type: "decide_publication_after_completion",
            matchId: pact.matchId,
            publicationId,
            title: "桥约已完成，请选择是否继续接受匹配",
          }];
        }
      }
      return [];
    });
    const recentGrowth = pacts
      .filter((pact) => pact.status === "completed" && pact.completedAt)
      .sort((left, right) => right.completedAt!.localeCompare(left.completedAt!))
      .slice(0, 10)
      .map((pact) => ({
        eventId: `growth:${pact.pactId}`,
        type: "pact_completed" as const,
        title: "完成一次桥约闭环",
        delta: 20,
        matchId: pact.matchId,
        createdAt: pact.completedAt!,
      }));
    return {
      account: {
        nickname: account.nickname,
        avatarUrl: account.avatarUrl,
        petName: account.petName,
        growthScore: account.growthScore,
        personalityTags: account.personalityTags,
        interestTags: account.interestTags,
      },
      stats: {
        offers: publications.length > 0
          ? publications.filter((item) => item.offers.length > 0).length
          : profile?.profile.nodes.filter((node) => node.direction === "offer").length ?? 0,
        needs: publications.length > 0
          ? publications.filter((item) => item.needs.length > 0).length
          : profile?.profile.nodes.filter((node) => node.direction === "need").length ?? 0,
        opportunities: matches.length,
        completedPacts: pacts.filter((pact) => pact.status === "completed").length,
      },
      recommendations,
      publicationCount: publications.length,
      pendingTasks,
      recentGrowth,
      lifeTree: this.state.lifeTrees[account.accountId] ?? null,
      profileStatus: profile?.status ?? "empty",
      isSynthetic: false as const,
    };
  }

  async listConversations(token: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    return Object.values(this.state.matches)
      .filter(
        (match) =>
          match.consent.state === "mutual_accepted" &&
          match.consent.partyIds.includes(account.accountId),
      )
      .map((match) => {
        const counterpartId = match.consent.partyIds.find(
          (partyId) => partyId !== account.accountId,
        )!;
        const counterpart = this.counterpartIdentity(match, account.accountId);
        const messages = this.messagesFor(match.matchId);
        const lastReadMessageId = this.state.conversationReads[match.matchId]?.[account.accountId];
        const lastReadIndex = lastReadMessageId
          ? messages.findIndex((message) => message.messageId === lastReadMessageId)
          : -1;
        const lastReadAt = lastReadIndex >= 0 ? messages[lastReadIndex].createdAt : null;
        const unreadCount = messages.slice(lastReadIndex + 1).filter(
          (message) =>
            message.senderPersonaId !== account.accountId,
        ).length;
        return {
          conversationId: match.matchId,
          matchId: match.matchId,
          counterpartId,
          counterpartDisplayName: counterpart.displayName,
          counterpartAvatarUrl: counterpart.avatarUrl,
          lastMessage: messages.at(-1)?.text || (messages.at(-1)?.images.length ? "[图片]" : null),
          messageCount: messages.length,
          unreadCount,
          lastReadAt,
          updatedAt: messages.at(-1)?.createdAt ?? match.updatedAt,
          isSynthetic: false as const,
        };
      });
  }

  async markConversationRead(token: string, conversationId: string) {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    this.requireConversation(conversationId, account.accountId);
    const messages = this.messagesFor(conversationId);
    const lastMessage = messages.at(-1)!;
    this.state.conversationReads[conversationId] ??= {};
    this.state.conversationReads[conversationId][account.accountId] = lastMessage.messageId;
    await this.persist();
    return {
      conversationId,
      lastReadAt: lastMessage.createdAt,
      unreadCount: 0,
      isSynthetic: false as const,
    };
  }

  async listMessages(token: string, conversationId: string): Promise<PoolMessage[]> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    this.requireConversation(conversationId, account.accountId);
    return structuredClone(this.messagesFor(conversationId));
  }

  async sendMessage(
    token: string,
    conversationId: string,
    input: { text: string; images: PoolMessage["images"] },
  ): Promise<PoolMessage> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    this.requireConversation(conversationId, account.accountId);
    const message = PoolMessageSchema.parse({
      messageId: randomUUID(),
      conversationId,
      senderPersonaId: account.accountId,
      senderDisplayName: account.nickname,
      text: input.text,
      images: input.images,
      createdAt: this.now().toISOString(),
      isSynthetic: false,
    });
    this.state.messages.push(message);
    await this.persist();
    return structuredClone(message);
  }

  async listPetTurns(token: string): Promise<PoolPetTurn[]> {
    const account = await this.auth.authenticate(token);
    await this.ensureLoaded();
    return structuredClone(
      this.state.petTurns.filter((turn) => turn.accountId === account.accountId),
    );
  }

  async sendPetTurn(
    token: string,
    input: { message: string; images: PoolPetTurn["userImages"] },
  ): Promise<PoolPetTurn> {
    const account = await this.auth.authenticate(token);
    if (!this.petChatProvider) {
      throw new ApplicationError("小天 AI 尚未配置", 503, "pet_ai_not_configured");
    }
    await this.ensureLoaded();
    const recentTurns = this.state.petTurns
      .filter((turn) => turn.accountId === account.accountId)
      .slice(-6)
      .map((turn) => ({
        userText: turn.userText || "[图片]",
        assistantText: turn.assistantText,
      }));
    const assistantText = await this.petChatProvider.reply({
      nickname: account.nickname,
      petName: account.petName,
      personalityTags: account.personalityTags,
      message: input.message,
      images: input.images,
      recentTurns,
      productContext: this.buildPetProductContext(account),
    });
    const turn = PoolPetTurnSchema.parse({
      turnId: randomUUID(),
      accountId: account.accountId,
      userText: input.message,
      userImages: input.images,
      assistantText,
      createdAt: this.now().toISOString(),
      isSynthetic: false,
    });
    this.state.petTurns.push(turn);
    await this.persist();
    return structuredClone(turn);
  }

  async organizeWithPet(
    token: string,
    input: PetOrganizeInput,
  ): Promise<PetOrganizeResult> {
    const account = await this.auth.authenticate(token);
    if (!this.petChatProvider?.organize) {
      throw new ApplicationError("小天整理能力尚未配置", 503, "pet_organize_not_configured");
    }
    await this.ensureLoaded();
    const recentTurns = this.state.petTurns
      .filter((turn) => turn.accountId === account.accountId)
      .slice(-4)
      .map((turn) => ({
        userText: turn.userText || "[图片]",
        assistantText: turn.assistantText,
      }));
    return this.petChatProvider.organize({
      ...input,
      nickname: account.nickname,
      petName: account.petName,
      personalityTags: account.personalityTags,
      recentTurns,
      productContext: this.buildPetProductContext(account),
    });
  }

  private buildPetProductContext(account: AccountRecord): PetProductContext {
    const profile = this.state.profiles[account.accountId] ?? null;
    const savedLifeTree = this.state.lifeTrees[account.accountId] ?? null;
    const ownPublications = Object.values(this.state.publications)
      .filter(
        (publication) =>
          publication.authorAccountId === account.accountId &&
          publication.status !== "deleted",
      );
    const ownMatches = Object.values(this.state.matches)
      .filter((match) => match.consent.partyIds.includes(account.accountId));
    const ownPacts = Object.values(this.state.pacts)
      .filter((pact) => pact.partyIds.includes(account.accountId));
    const conversations = ownMatches
      .filter((match) => match.consent.state === "mutual_accepted")
      .map((match) => {
        const counterpart = this.counterpartIdentity(match, account.accountId);
        const messages = this.messagesFor(match.matchId);
        const lastReadMessageId = this.state.conversationReads[match.matchId]?.[account.accountId];
        const lastReadIndex = lastReadMessageId
          ? messages.findIndex((message) => message.messageId === lastReadMessageId)
          : -1;
        return {
          conversationId: match.matchId,
          counterpartDisplayName: counterpart.displayName,
          lastMessage: messages.at(-1)?.text ?? null,
          unreadCount: messages.slice(lastReadIndex + 1).filter(
            (message) =>
              message.senderPersonaId !== account.accountId,
          ).length,
          updatedAt: messages.at(-1)?.createdAt ?? match.updatedAt,
        };
      });
    const nodeTitles = (direction: "offer" | "need" | "goal") =>
      profile?.profile.nodes
        .filter((node) => node.direction === direction)
        .map((node) => node.title) ?? [];

    return {
      account: {
        accountId: account.accountId,
        nickname: account.nickname,
        profileIntro: account.profileIntro,
        petName: account.petName,
        gender: account.gender,
        birthDate: account.birthDate,
        city: account.city,
        personalityTags: account.personalityTags,
        interestTags: account.interestTags,
        growthScore: account.growthScore,
      },
      lifeTree: savedLifeTree ? {
        status: savedLifeTree.diagnosis ? "diagnosed" : "saved",
        bio: profile?.bio ?? account.profileIntro,
        offers: savedLifeTree.offers.map((tag) => tag.label),
        needs: savedLifeTree.needs.map((tag) => tag.label),
        goals: [],
        explorations: savedLifeTree.explorations.map((tag) => tag.label),
      } : profile ? {
        status: profile.status,
        bio: profile.bio,
        offers: nodeTitles("offer"),
        needs: nodeTitles("need"),
        goals: nodeTitles("goal"),
        explorations: nodeTitles("goal"),
      } : null,
      publications: ownPublications.map((publication) => ({
        publicationId: publication.publicationId,
        title: publication.title,
        content: publication.content,
        category: publication.category,
        kind: publication.kind,
        status: publication.status,
        offers: publication.offers.map((item) => item.title),
        needs: publication.needs.map((item) => item.title),
        goals: publication.goals.map((item) => item.title),
        constraints: publication.constraints,
        publishedAt: publication.publishedAt,
      })),
      matches: ownMatches.map((match) => this.toMatchView(match, account.accountId)),
      pacts: ownPacts.map((pact) => structuredClone(pact)),
      conversations,
    };
  }

  private nodesFor(
    personaId: string,
    direction: "offer" | "need" | "goal",
    inputs: SavePoolProfileInput["offers"],
    constraints: SavePoolProfileInput["constraints"],
    updatedAt: string,
  ): ValueNode[] {
    return inputs.map((input, index) => ({
      id: `${personaId}:${direction}:${index + 1}`,
      personaId,
      direction,
      ...input,
      description: input.description || input.title,
      evidenceCompleteness: this.evidenceCompleteness(input, constraints),
      updatedAt,
      isSynthetic: false,
      datasetVersion: "user-v1",
    }));
  }

  private buildPublication(
    publicationId: string,
    account: AccountRecord,
    input: CreatePublicationInput,
    composed: { title: string; content: string },
    status: Publication["status"],
    createdAt: string,
    updatedAt: string,
    publishedAt: string | null,
    discoveryVisible = true,
    completionDecisionAt: string | null = null,
  ): Publication {
    const nodes = [
      ...this.nodesFor(publicationId, "offer", input.offers, input.constraints, updatedAt),
      ...this.nodesFor(publicationId, "need", input.needs, input.constraints, updatedAt),
      ...this.nodesFor(publicationId, "goal", input.goals, input.constraints, updatedAt),
    ];
    return PublicationSchema.parse({
      publicationId,
      authorAccountId: account.accountId,
      authorGrowthScore: account.growthScore,
      poolScope: account.poolScope,
      avatarUrl: account.avatarUrl,
      title: composed.title,
      content: composed.content,
      category: input.category,
      kind: input.kind,
      bio: input.bio,
      offers: input.offers,
      needs: input.needs,
      goals: input.goals,
      acceptedExchangeModes: input.acceptedExchangeModes,
      constraints: input.constraints,
      disclosurePolicy: input.disclosurePolicy,
      proposedPactTerms: input.proposedPactTerms,
      profile: {
        personaId: publicationId,
        displayName: account.nickname,
        personalityTags: account.personalityTags,
        interestTags: account.interestTags,
        nodes,
        acceptedExchangeModes: input.acceptedExchangeModes,
        constraints: input.constraints,
      },
      status,
      discoveryVisible,
      completionDecisionAt,
      createdAt,
      updatedAt,
      publishedAt,
      isSynthetic: false,
    });
  }

  private async composePublication(
    account: AccountRecord,
    input: CreatePublicationInput,
  ): Promise<{ title: string; content: string }> {
    if (!this.petChatProvider?.organize) {
      throw new ApplicationError(
        "小天发布整理能力尚未配置",
        503,
        "publication_ai_not_configured",
      );
    }
    const images = [...input.offers, ...input.needs, ...input.goals]
      .flatMap((item) => item.images);
    const result = await this.petChatProvider.organize({
      nickname: account.nickname,
      petName: account.petName,
      personalityTags: account.personalityTags,
      message: [
        "请把以下发布表单整理成一个准确简洁的帖子标题，以及一段逻辑通顺、表达清晰的正文。",
        "正文必须保留资源、需求、交换方式、地点时间条件和桥约条件等全部有效信息，不得虚构。",
        JSON.stringify({
          kind: input.kind,
          category: input.category,
          titleHint: input.title ?? null,
          bio: input.bio,
          offers: input.offers,
          needs: input.needs,
          goals: input.goals,
          acceptedExchangeModes: input.acceptedExchangeModes,
          constraints: input.constraints,
          proposedPactTerms: input.proposedPactTerms,
        }),
      ].join("\n"),
      images,
      recentTurns: [],
      productContext: this.buildPetProductContext(account),
      context: "publish",
      currentDraft: null,
    });
    return { title: result.draft.title, content: input.bio.trim() || result.draft.summary };
  }

  private toPublicationDetail(publication: Publication, viewerAccountId: string) {
    const owner = publication.authorAccountId === viewerAccountId;
    const completedPacts = Object.values(this.state.pacts)
      .filter((pact) =>
        pact.status === "completed" &&
        (pact.sourcePublicationId === publication.publicationId ||
          pact.targetPublicationId === publication.publicationId)
      )
      .sort((left, right) => right.completedAt!.localeCompare(left.completedAt!));
    const latestCompletionAt = completedPacts[0]?.completedAt ?? null;
    const completionDecisionRequired = Boolean(
      owner && latestCompletionAt &&
      (!publication.completionDecisionAt || latestCompletionAt > publication.completionDecisionAt),
    );
    return {
      publicationId: publication.publicationId,
      viewerRole: owner ? "owner" as const : "visitor" as const,
      title: publication.title,
      content: publication.content,
      category: publication.category,
      kind: publication.kind,
      images: [...publication.offers, ...publication.needs, ...publication.goals]
        .flatMap((item) => item.images),
      author: {
        accountId: publication.authorAccountId,
        displayName: publication.profile.displayName,
        avatarUrl: publication.avatarUrl,
        stageLabel: publication.authorGrowthScore < 500 ? "青苗期·探索阶段" : "壮年期·扎根积累",
      },
      authorBio: publication.bio,
      locationLabel: publication.constraints.locations[0] ?? "",
      status: publication.status,
      discoveryVisible: publication.discoveryVisible,
      publishedAt: publication.publishedAt,
      updatedAt: publication.updatedAt,
      completedPactCount: completedPacts.length,
      hasCompletedPact: completedPacts.length > 0,
      completionDecisionRequired,
      canInvite: !owner && publication.status === "published",
      canEdit: owner && publication.status !== "deleted",
      canDelete: owner && publication.status !== "deleted",
      formData: owner ? {
        bio: publication.bio,
        offers: publication.offers,
        needs: publication.needs,
        goals: publication.goals,
        acceptedExchangeModes: publication.acceptedExchangeModes,
        constraints: publication.constraints,
        disclosurePolicy: publication.disclosurePolicy,
        proposedPactTerms: publication.proposedPactTerms,
      } : null,
      isSynthetic: false as const,
    };
  }

  private async runPublicationMatchingForAccount(
    account: AccountRecord,
    source: Publication,
  ): Promise<void> {
    const candidates = Object.values(this.state.publications)
      .filter((item) =>
        item.authorAccountId !== account.accountId &&
        item.status === "published" &&
        item.poolScope === account.poolScope
      );
    const ranked = this.aiMatchProvider
      ? await rankCandidatesWithAi(
          source.profile,
          candidates.map((item) => item.profile),
          this.aiMatchProvider,
          this.now(),
          4,
        )
      : rankCandidates(
          source.profile,
          candidates.map((item) => item.profile),
          this.now(),
          4,
        );
    const timestamp = this.now().toISOString();
    for (const result of ranked) {
      const target = this.state.publications[result.candidateId];
      if (!target) continue;
      const matchId = canonicalPublicationMatchId(source.publicationId, target.publicationId);
      if (this.state.matches[matchId]) continue;
      const consent = createConsentRecord(account.accountId, target.authorAccountId);
      this.state.matches[matchId] = PoolMatchSchema.parse({
        matchId,
        viewerId: account.accountId,
        candidateId: target.authorAccountId,
        sourcePublicationId: source.publicationId,
        targetPublicationId: target.publicationId,
        internalScore: result.internalScore,
        proof: {
          ...result.proof,
          matchId,
          viewerId: account.accountId,
          candidateId: target.authorAccountId,
          status: consent.state,
          isSynthetic: false,
          datasetVersion: "publication-v1",
        },
        assessment: "assessment" in result ? result.assessment : undefined,
        scoreBreakdown: "scoreBreakdown" in result ? result.scoreBreakdown : undefined,
        consent,
        updatedAt: timestamp,
        isSynthetic: false,
      });
    }
  }

  private evidenceCompleteness(
    input: SavePoolProfileInput["offers"][number],
    constraints: SavePoolProfileInput["constraints"],
  ): number {
    let score = 0.35;
    score += input.description.length >= 20 ? 0.2 : input.description.length >= 8 ? 0.1 : 0;
    score += Math.min(0.15, input.keywords.length * 0.05);
    score += input.deliverables.length > 0 ? 0.2 : 0;
    score += constraints.locations.length > 0 ? 0.05 : 0;
    score += constraints.availability.length > 0 ? 0.05 : 0;
    return Math.min(1, Number(score.toFixed(2)));
  }

  private toMatchView(match: PoolMatch, personaId: string) {
    const isViewer = match.viewerId === personaId;
    const counterpartId = isViewer ? match.candidateId : match.viewerId;
    const yourDecision = match.consent.decisions[personaId] ?? null;
    const counterpartDecision = match.consent.decisions[counterpartId] ?? null;
    const invitationDirection = match.consent.state === "mutual_accepted"
      ? "mutual"
      : yourDecision === "accepted" && counterpartDecision === null
        ? "sent"
        : yourDecision === null && counterpartDecision === "accepted"
          ? "received"
          : "none";
    const counterpartPublicationId = isViewer
      ? match.targetPublicationId
      : match.sourcePublicationId;
    const ownPublicationId = isViewer
      ? match.sourcePublicationId
      : match.targetPublicationId;
    const counterpartPublication = counterpartPublicationId
      ? this.state.publications[counterpartPublicationId]
      : null;
    const ownPublication = ownPublicationId
      ? this.state.publications[ownPublicationId]
      : null;
    const counterpart = counterpartPublication?.profile ?? this.requireProfile(counterpartId).profile;
    const valueToYou = isViewer ? match.proof.valueToViewer : match.proof.valueToCandidate;
    const valueToOther = isViewer ? match.proof.valueToCandidate : match.proof.valueToViewer;
    const ownNeed = ownPublication?.needs[0];
    const ownOffer = ownPublication?.offers[0];
    const counterpartNeed = counterpartPublication?.needs[0];
    const counterpartOffer = counterpartPublication?.offers[0];
    const directionalValueToYou = ownNeed && counterpartOffer
      ? `对方可提供「${counterpartOffer.title}」，回应你的「${ownNeed.title}」`
      : ownOffer && counterpartNeed
        ? `对方正在寻找「${counterpartNeed.title}」，与你提供的「${ownOffer.title}」匹配`
        : valueToYou[0];
    const directionalValueToOther = ownOffer && counterpartNeed
      ? `你提供的「${ownOffer.title}」回应了对方的「${counterpartNeed.title}」`
      : ownNeed && counterpartOffer
        ? `你的「${ownNeed.title}」与对方提供的「${counterpartOffer.title}」形成连接`
        : valueToOther[0];
    const matchReasons = match.proof.matchReasons
      .map((reason) => {
        const type = isViewer
          ? reason.type
          : reason.type === "value_to_you"
            ? "value_to_other" as const
            : reason.type === "value_to_other"
              ? "value_to_you" as const
              : reason.type;
        return {
          ...reason,
          type,
          text: type === "value_to_you"
            ? directionalValueToYou ?? reason.text
            : type === "value_to_other"
              ? directionalValueToOther ?? reason.text
              : reason.text,
        };
      })
      .sort((left, right) => {
        const order = { value_to_you: 0, value_to_other: 1, execution_fit: 2 };
        return order[left.type] - order[right.type];
      });
    return {
      matchId: match.matchId,
      publicationId: ownPublicationId,
      counterpartPublicationId,
      publicationTitle: ownPublicationId
        ? this.state.publications[ownPublicationId]?.title ?? null
        : null,
      counterpartPublicationTitle: counterpartPublication?.title ?? null,
      counterpartId,
      counterpartDisplayName: counterpart.displayName,
      counterpartAvatarUrl: counterpartPublication?.avatarUrl ??
        this.state.profiles[counterpartId]?.avatarUrl ?? null,
      counterpartPersonalityTags: counterpart.personalityTags,
      counterpartInterestTags: counterpart.interestTags,
      bridgeIndex: match.internalScore,
      tier: match.scoreBreakdown?.tier ?? null,
      status: match.consent.state,
      yourDecision,
      counterpartDecision,
      invitationDirection,
      valueToYou,
      valueToOther,
      satisfiedConstraints: match.proof.satisfiedConstraints,
      conflicts: match.proof.conflicts,
      unknowns: match.proof.unknowns,
      matchReasons,
      primaryPattern: match.assessment?.primaryPattern ?? null,
      supportingPatterns: match.assessment?.supportingPatterns ?? [],
      assessment: match.assessment ?? null,
      scoreBreakdown: match.scoreBreakdown ?? null,
      isSynthetic: false as const,
    };
  }

  private requireProfile(accountId: string): PoolProfile {
    const profile = this.state.profiles[accountId];
    if (!profile) throw new ApplicationError("profile not found", 404, "profile_not_found");
    return profile;
  }

  private counterpartIdentity(match: PoolMatch, accountId: string) {
    const isViewer = match.viewerId === accountId;
    const counterpartId = isViewer ? match.candidateId : match.viewerId;
    const publicationId = isViewer
      ? match.targetPublicationId
      : match.sourcePublicationId;
    const publication = publicationId ? this.state.publications[publicationId] : null;
    if (publication) {
      return {
        accountId: counterpartId,
        displayName: publication.profile.displayName,
        avatarUrl: publication.avatarUrl,
      };
    }
    const profile = this.requireProfile(counterpartId);
    return {
      accountId: counterpartId,
      displayName: profile.profile.displayName,
      avatarUrl: profile.avatarUrl,
    };
  }

  private requireOwnedPublication(publicationId: string, accountId: string): Publication {
    const publication = this.state.publications[publicationId];
    if (!publication || publication.authorAccountId !== accountId) {
      throw new ApplicationError("publication not found", 404, "publication_not_found");
    }
    return publication;
  }

  private requireActiveProfile(accountId: string): PoolProfile {
    const profile = this.requireProfile(accountId);
    if (profile.status !== "active") {
      throw new ApplicationError("profile must be active before matching", 409, "profile_not_active");
    }
    return profile;
  }

  private requireMatchFor(matchId: string, accountId: string): PoolMatch {
    const match = this.state.matches[matchId];
    if (!match || !match.consent.partyIds.includes(accountId)) {
      throw new ApplicationError("match not found", 404, "not_found");
    }
    return match;
  }

  private requireConversation(conversationId: string, accountId: string): PoolMatch {
    const match = this.requireMatchFor(conversationId, accountId);
    if (match.consent.state !== "mutual_accepted") {
      throw new ApplicationError(
        "mutual consent is required before messaging",
        409,
        "conversation_not_ready",
      );
    }
    return match;
  }

  private createPact(match: PoolMatch): PoolPact {
    const firstReason = match.proof.matchReasons[0]?.text ?? "双方建立价值连接";
    const proposedTerms = (match.sourcePublicationId
      ? this.state.publications[match.sourcePublicationId]?.proposedPactTerms
      : null) ?? (match.targetPublicationId
      ? this.state.publications[match.targetPublicationId]?.proposedPactTerms
      : null) ?? this.state.profiles[match.viewerId]?.proposedPactTerms ??
      this.state.profiles[match.candidateId]?.proposedPactTerms;
    return PoolPactSchema.parse({
      pactId: `pact:${match.matchId}`,
      matchId: match.matchId,
      sourcePublicationId: match.sourcePublicationId,
      targetPublicationId: match.targetPublicationId,
      partyIds: match.consent.partyIds,
      title: `围绕「${firstReason}」的桥约`,
      firstAction: proposedTerms?.firstAction ?? "双方先在聊天中确认时间、地点和第一步行动",
      completionCriteria: proposedTerms?.completionCriteria ?? "双方确认约定事项已经完成",
      exitRule: proposedTerms?.exitRule ?? "如一方无法履约，应尽早在聊天中告知对方",
      otherNotes: proposedTerms?.otherNotes ?? "",
      status: "waiting_start",
      startConfirmations: {},
      completionConfirmations: {},
      rewarded: false,
      createdAt: this.now().toISOString(),
      activatedAt: null,
      completedAt: null,
      isSynthetic: false,
    });
  }

  private requirePact(matchId: string, accountId: string): PoolPact {
    const pact = this.state.pacts[matchId];
    if (!pact || !pact.partyIds.includes(accountId)) {
      throw new ApplicationError("桥约不存在", 404, "pact_not_found");
    }
    return pact;
  }

  private messagesFor(conversationId: string): PoolMessage[] {
    return this.state.messages.filter(
      (message) => message.conversationId === conversationId,
    );
  }

  private appendSystemMessage(
    conversationId: string,
    type: PoolMessage["type"],
    text: string,
    payload: Record<string, unknown>,
  ): PoolMessage {
    const message = PoolMessageSchema.parse({
      messageId: randomUUID(),
      conversationId,
      senderPersonaId: "system",
      senderDisplayName: "小天",
      type,
      text,
      images: [],
      payload,
      createdAt: this.now().toISOString(),
      isSynthetic: false,
    });
    this.state.messages.push(message);
    return message;
  }

  private removeMatchesFor(accountId: string): void {
    for (const [matchId, match] of Object.entries(this.state.matches)) {
      if (
        match.consent.partyIds.includes(accountId) &&
        match.consent.state !== "mutual_accepted"
      ) {
        delete this.state.matches[matchId];
        this.state.messages = this.state.messages.filter(
          (message) => message.conversationId !== matchId,
        );
      }
    }
  }

  private removeMatchesForPublication(publicationId: string): void {
    for (const [matchId, match] of Object.entries(this.state.matches)) {
      if (
        (match.sourcePublicationId === publicationId ||
          match.targetPublicationId === publicationId) &&
        match.consent.state !== "mutual_accepted"
      ) {
        delete this.state.matches[matchId];
      }
    }
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    const stored = await this.repository.load();
    this.state = stored ? MatchPoolStateSchema.parse(stored) : emptyState();
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    this.state = MatchPoolStateSchema.parse(this.state);
    await this.repository.save(this.state);
  }
}
