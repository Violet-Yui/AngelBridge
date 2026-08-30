import { createDatabasePool } from "../src/database/connection";
import {
  MatchPoolStateSchema,
  PoolProfileSchema,
  PublicationSchema,
  type MatchPoolState,
  type SavePoolProfileInput,
} from "../src/pool/contracts";

type ValueInput = SavePoolProfileInput["offers"][number];

const PHONE_A = process.env.SHOWCASE_PHONE_A || "19900000001";
const PHONE_B = process.env.SHOWCASE_PHONE_B || "19900000002";
const POST_A = "showcase-a-core-post";
const POST_B = "showcase-b-core-post";

const pool = createDatabasePool();
const client = await pool.connect();

const value = (
  domain: ValueInput["domain"],
  title: string,
  description: string,
  keywords: string[],
  deliverables: string[],
): ValueInput => ({
  domain,
  title,
  description,
  keywords,
  deliverables,
  visibility: "match_only",
  images: [],
});

const nodesFor = (
  personaId: string,
  direction: "offer" | "need" | "goal",
  inputs: ValueInput[],
  updatedAt: string,
) => inputs.map((input, index) => ({
  id: `${personaId}:${direction}:${index + 1}`,
  personaId,
  direction,
  ...input,
  description: input.description || input.title,
  evidenceCompleteness: 0.95,
  updatedAt,
  isSynthetic: false as const,
  datasetVersion: "showcase-v1",
}));

try {
  await client.query("begin");
  const accounts = await client.query<{
    account_id: string;
    phone: string;
    nickname: string;
  }>(
    "select account_id, phone, nickname from accounts where phone = any($1::text[]) order by phone",
    [[PHONE_A, PHONE_B]],
  );
  if (accounts.rows.length !== 2) {
    throw new Error("showcase accounts A/B must login once before reset");
  }
  const accountA = accounts.rows.find((row) => row.phone === PHONE_A)!;
  const accountB = accounts.rows.find((row) => row.phone === PHONE_B)!;

  await client.query(
    `update accounts set
       gender = 'm', birth_date = '1993-05-18', city = '北京市 / 北京市',
       profile_intro = '用设计和空间，把一个好想法变成看得见的作品。',
       personality_tags = $2::jsonb, interest_tags = $3::jsonb, growth_score = 680
     where account_id = $1`,
    [accountA.account_id, JSON.stringify(["务实", "共创"]), JSON.stringify(["职场", "科技", "摄影摄像", "生活记录"])],
  );
  await client.query(
    `update accounts set
       gender = 'f', birth_date = '1992-09-12', city = '上海市 / 上海市',
       profile_intro = '用影像记录真实价值，也寻找长期共创伙伴。',
       personality_tags = $2::jsonb, interest_tags = $3::jsonb, growth_score = 720
     where account_id = $1`,
    [accountB.account_id, JSON.stringify(["可靠", "审美"]), JSON.stringify(["摄影摄像", "职场", "生活记录", "科技"])],
  );

  const snapshotResult = await client.query<{ snapshot: unknown }>(
    "select snapshot from match_pool_snapshot where state_key = 'default' for update",
  );
  const state: MatchPoolState = snapshotResult.rows[0]
    ? MatchPoolStateSchema.parse(snapshotResult.rows[0].snapshot)
    : MatchPoolStateSchema.parse({ version: 1, profiles: {}, publications: {}, matches: {}, messages: [], conversationReads: {}, petTurns: [], pacts: {}, lifeTrees: {} });
  const accountIds = new Set([accountA.account_id, accountB.account_id]);
  const oldPublicationIds = new Set(Object.values(state.publications)
    .filter((post) => accountIds.has(post.authorAccountId))
    .map((post) => post.publicationId));
  const removedMatchIds = new Set(Object.values(state.matches)
    .filter((match) => match.consent.partyIds.some((id) => accountIds.has(id)) ||
      (match.sourcePublicationId ? oldPublicationIds.has(match.sourcePublicationId) : false) ||
      (match.targetPublicationId ? oldPublicationIds.has(match.targetPublicationId) : false))
    .map((match) => match.matchId));

  for (const id of oldPublicationIds) delete state.publications[id];
  for (const id of removedMatchIds) delete state.matches[id];
  for (const [id, pact] of Object.entries(state.pacts)) {
    if (pact.partyIds.some((partyId) => accountIds.has(partyId)) || removedMatchIds.has(pact.matchId)) delete state.pacts[id];
  }
  state.messages = state.messages.filter((message) => !removedMatchIds.has(message.conversationId));
  state.petTurns = state.petTurns.filter((turn) => !accountIds.has(turn.accountId));
  for (const id of removedMatchIds) delete state.conversationReads[id];

  const now = new Date().toISOString();
  const disclosurePolicy = {
    matchLocationPrecision: "region" as const,
    contactDisclosure: "after_mutual_consent" as const,
    exactLocationDisclosure: "after_pact_active" as const,
  };
  const constraintsA = { locations: ["北京市 / 北京市"], availability: ["周六、周日 10:00–18:00"] };
  const constraintsB = { locations: ["北京市 / 北京市"], availability: ["周末可预约，先线上确认清单"] };
  const offersA = [value("space", "北京朝阳周末工作室", "周六、周日可用于产品拍摄、直播或小型共创。", ["工作室", "拍摄空间", "周末"], ["周末工作室使用权"] )];
  const needsA = [value("service", "品牌摄影服务", "需要产品图、环境图和基础后期。", ["品牌摄影", "产品图", "环境图"], ["12张精修产品图", "3张环境图"] )];
  const offersB = [value("service", "品牌摄影服务", "提供品牌产品拍摄、环境拍摄和基础后期。", ["品牌摄影", "产品拍摄", "基础后期"], ["按清单交付精修成片"] )];
  const needsB = [value("space", "北京拍摄空间与设计支持", "需要自然光拍摄空间和必要的排版支持。", ["拍摄空间", "品牌设计", "长期共创"], ["周末拍摄空间使用权"] )];

  const makePublication = (config: {
    publicationId: string;
    accountId: string;
    nickname: string;
    growth: number;
    title: string;
    content: string;
    category: "space" | "skills";
    offers: ValueInput[];
    needs: ValueInput[];
    constraints: typeof constraintsA;
    interests: string[];
    personality: string[];
    terms: { firstAction: string; completionCriteria: string; exitRule: string; otherNotes: string };
  }) => PublicationSchema.parse({
    publicationId: config.publicationId,
    authorAccountId: config.accountId,
    authorGrowthScore: config.growth,
    poolScope: "showcase",
    avatarUrl: null,
    title: config.title,
    content: config.content,
    category: config.category,
    kind: "exchange",
    bio: config.content,
    offers: config.offers,
    needs: config.needs,
    goals: [],
    acceptedExchangeModes: ["barter", "collaboration"],
    constraints: config.constraints,
    disclosurePolicy,
    proposedPactTerms: config.terms,
    profile: {
      personaId: config.publicationId,
      displayName: config.nickname,
      personalityTags: config.personality,
      interestTags: config.interests,
      nodes: [
        ...nodesFor(config.publicationId, "offer", config.offers, now),
        ...nodesFor(config.publicationId, "need", config.needs, now),
      ],
      acceptedExchangeModes: ["barter", "collaboration"],
      constraints: config.constraints,
    },
    status: "published",
    discoveryVisible: true,
    completionDecisionAt: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    isSynthetic: false,
  });

  state.publications[POST_A] = makePublication({
    publicationId: POST_A, accountId: accountA.account_id, nickname: accountA.nickname, growth: 680,
    title: "北京周末工作室使用权换品牌摄影",
    content: "我这里可以提供北京朝阳周末工作室，希望换到品牌摄影服务，地点在北京市。先线上确认拍摄清单和时间。",
    category: "space", offers: offersA, needs: needsA, constraints: constraintsA,
    interests: ["职场", "科技", "摄影摄像", "生活记录"], personality: ["务实", "共创"],
    terms: { firstAction: "本周先线上确认拍摄清单和时间", completionCriteria: "交付12张精修产品图和3张环境图", exitRule: "如一方无法履约，提前24小时说明并协商调整", otherNotes: "可先线上沟通" },
  });
  state.publications[POST_B] = makePublication({
    publicationId: POST_B, accountId: accountB.account_id, nickname: accountB.nickname, growth: 720,
    title: "品牌摄影服务换周末拍摄空间",
    content: "我这里可以提供品牌产品摄影与基础后期，希望换到北京周末拍摄空间和设计支持，地点在北京市。",
    category: "skills", offers: offersB, needs: needsB, constraints: constraintsB,
    interests: ["摄影摄像", "职场", "生活记录", "科技"], personality: ["可靠", "审美"],
    terms: { firstAction: "先看工作室照片并确认产品数量", completionCriteria: "完成约定拍摄并交付约定数量的精修照片", exitRule: "拍摄计划变化时提前沟通，不临时失联", otherNotes: "周末可预约" },
  });

  const makeProfile = (accountId: string, nickname: string, offers: ValueInput[], needs: ValueInput[], constraints: typeof constraintsA, personality: string[], interests: string[]) => PoolProfileSchema.parse({
    accountId, poolScope: "showcase", bio: "成熟展示账号", avatarUrl: null,
    profile: { personaId: accountId, displayName: nickname, personalityTags: personality, interestTags: interests, nodes: [...nodesFor(accountId, "offer", offers, now), ...nodesFor(accountId, "need", needs, now)], acceptedExchangeModes: ["barter", "collaboration"], constraints },
    disclosurePolicy, proposedPactTerms: null, status: "active", updatedAt: now, isSynthetic: false,
  });
  state.profiles[accountA.account_id] = makeProfile(accountA.account_id, accountA.nickname, offersA, needsA, constraintsA, ["务实", "共创"], ["职场", "科技", "摄影摄像", "生活记录"]);
  state.profiles[accountB.account_id] = makeProfile(accountB.account_id, accountB.nickname, offersB, needsB, constraintsB, ["可靠", "审美"], ["摄影摄像", "职场", "生活记录", "科技"]);
  state.lifeTrees[accountA.account_id] = { accountId: accountA.account_id, offers: ["空间资源", "品牌设计", "UI设计", "项目策划", "社群组织", "时间"].map((label) => ({ label, visible: true })), needs: ["品牌摄影", "短视频剪辑", "长期合作伙伴", "传播支持"].map((label) => ({ label, visible: true })), explorations: ["创业项目", "新技能", "社会议题"].map((label) => ({ label, visible: true })), diagnosis: null, diagnosedAt: null, updatedAt: now, isSynthetic: false };
  state.lifeTrees[accountB.account_id] = { accountId: accountB.account_id, offers: ["品牌摄影", "人像摄影", "产品拍摄", "基础修图", "短视频拍摄"].map((label) => ({ label, visible: true })), needs: ["拍摄空间", "品牌设计支持", "长期共创伙伴"].map((label) => ({ label, visible: true })), explorations: ["新技能", "新城市", "创业项目"].map((label) => ({ label, visible: true })), diagnosis: null, diagnosedAt: null, updatedAt: now, isSynthetic: false };

  const parsed = MatchPoolStateSchema.parse(state);
  await client.query(
    `insert into match_pool_snapshot (state_key, snapshot_version, snapshot, created_at, updated_at)
     values ('default', 1, $1::jsonb, now(), now())
     on conflict (state_key) do update set snapshot = excluded.snapshot, updated_at = now()`,
    [JSON.stringify(parsed)],
  );
  await client.query("commit");
  console.log(`showcase reset complete: ${accountA.nickname}, ${accountB.nickname}`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
