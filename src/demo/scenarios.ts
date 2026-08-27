import {
  MatchingProfileSchema,
  type ExchangeMode,
  type MatchingProfile,
  type ValueNode,
} from "../domain/contracts";

type PactTemplate = {
  title: string;
  exchangeModes: ExchangeMode[];
  timeWindow: string;
  locationSummary: string;
  costOrDifference: string;
  firstAction: string;
  completionCriteria: string[];
  exitRule: string;
  commitments: Array<{ personaId: string; deliverable: string }>;
  outcomes: Record<
    string,
    { completed: string; exited: string; treeChange: string }
  >;
};

export type DemoScenario = {
  id: string;
  title: string;
  summary: string;
  viewerPersonaId: string;
  expectedCandidateId: string;
  profiles: MatchingProfile[];
  sourceTexts: Record<string, string>;
  pact: PactTemplate;
};

const updatedAt = "2026-08-26T10:00:00.000Z";
const datasetVersion = "v1";

const node = (
  personaId: string,
  direction: "offer" | "need",
  domain: ValueNode["domain"],
  title: string,
  description: string,
  keywords: string[],
  deliverables: string[],
  evidenceCompleteness = 0.9,
): ValueNode => ({
  id: `${personaId}:${direction}:${domain}`,
  personaId,
  direction,
  domain,
  title,
  description,
  keywords,
  deliverables,
  visibility: "match_only",
  evidenceCompleteness,
  updatedAt,
  isSynthetic: true,
  datasetVersion,
});

const profile = (
  personaId: string,
  displayName: string,
  offer: ValueNode,
  need: ValueNode,
  acceptedExchangeModes: ExchangeMode[],
  locations: string[],
  availability: string[],
): MatchingProfile =>
  MatchingProfileSchema.parse({
    personaId,
    displayName,
    nodes: [offer, need],
    acceptedExchangeModes,
    constraints: { locations, availability },
  });

const studioPhotography: DemoScenario = {
  id: "studio-photography",
  title: "工作室 × 品牌摄影",
  summary: "用下周末两天工作室使用权置换一组品牌照片。",
  viewerPersonaId: "studio-a",
  expectedCandidateId: "studio-b",
  profiles: [
    profile(
      "studio-a",
      "空间主理人 A",
      node(
        "studio-a",
        "offer",
        "space",
        "下周末工作室两天使用权",
        "北京朝阳区室内工作室，可提供下周末两天使用权。",
        ["工作室", "室内拍摄", "两天"],
        ["下周末两天工作室使用权"],
      ),
      node(
        "studio-a",
        "need",
        "service",
        "品牌摄影服务",
        "需要完成一组可用于品牌宣传的照片。",
        ["品牌摄影", "照片交付"],
        [],
      ),
      ["barter", "collaboration"],
      ["北京朝阳"],
      ["下周末"],
    ),
    profile(
      "studio-b",
      "品牌摄影师 B",
      node(
        "studio-b",
        "offer",
        "service",
        "品牌摄影与基础交付",
        "提供品牌摄影和一组基础精修照片。",
        ["品牌摄影", "照片交付"],
        ["一组品牌照片"],
        0.96,
      ),
      node(
        "studio-b",
        "need",
        "space",
        "室内拍摄工作室",
        "需要下周末可使用两天的室内拍摄空间。",
        ["工作室", "室内拍摄", "两天"],
        [],
        0.96,
      ),
      ["barter", "collaboration"],
      ["北京朝阳"],
      ["下周末"],
    ),
    profile(
      "studio-c",
      "商业摄影师 C",
      node(
        "studio-c",
        "offer",
        "service",
        "商业品牌摄影",
        "可用场地置换加少量补差价的方式提供品牌摄影。",
        ["品牌摄影", "照片交付"],
        ["一组品牌照片"],
      ),
      node(
        "studio-c",
        "need",
        "space",
        "室内拍摄场地",
        "需要北京朝阳室内拍摄空间，可接受场地置换。",
        ["工作室", "室内拍摄", "两天"],
        [],
      ),
      ["barter"],
      ["北京朝阳"],
      ["下周末"],
    ),
    profile(
      "studio-d",
      "异地摄影师 D",
      node(
        "studio-d",
        "offer",
        "service",
        "品牌摄影服务",
        "提供品牌摄影与照片交付。",
        ["品牌摄影", "照片交付"],
        ["一组品牌照片"],
      ),
      node(
        "studio-d",
        "need",
        "space",
        "北京室内工作室",
        "需要北京朝阳的室内拍摄空间。",
        ["工作室", "室内拍摄", "两天"],
        [],
      ),
      ["barter"],
      ["北京朝阳"],
      ["下周末"],
    ),
  ],
  sourceTexts: {
    "studio-a": "我下周末可以提供北京朝阳工作室两天，希望换一组品牌照片。",
    "studio-b": "我能做品牌摄影和基础精修，需要下周末两天室内拍摄场地。",
    "studio-c": "我提供商业品牌摄影，需要北京朝阳室内场地，可接受场地置换加补差价。",
    "studio-d": "我能提供品牌摄影，希望在北京朝阳找到下周末的室内工作室。",
  },
  pact: {
    title: "两天工作室使用权置换一组品牌照片",
    exchangeModes: ["barter"],
    timeWindow: "本周六至周日 10:00-18:00",
    locationSummary: "北京朝阳（双方确认桥约后开放详细地址）",
    costOrDifference: "优先互换，可视实际增项协商补差价",
    firstAction: "先发送 3 张场地参考图，再确认拍摄时间",
    completionCriteria: ["交付 12 张精选照片", "完成 3 张基础精修"],
    exitRule: "任一方无法履约，需至少提前 24 小时告知",
    commitments: [
      { personaId: "studio-a", deliverable: "提供下周末两天工作室使用权" },
      { personaId: "studio-b", deliverable: "完成品牌摄影并交付一组基础精修照片" },
    ],
    outcomes: {
      "studio-a": {
        completed: "获得一次品牌内容合作成果",
        exited: "完成一次资源连接评估，但本次未继续执行",
        treeChange: "生命树新增一枚品牌内容合作果实",
      },
      "studio-b": {
        completed: "完成一次空间换服务的价值置换",
        exited: "完成一次空间合作评估，但本次未继续执行",
        treeChange: "生命树新增一枚资源置换果实",
      },
    },
  },
};

const productWeb: DemoScenario = {
  id: "product-web",
  title: "产品策划 × 网页开发",
  summary: "用 MVP 产品策划置换可演示网页原型开发。",
  viewerPersonaId: "product-a",
  expectedCandidateId: "product-b",
  profiles: [
    profile(
      "product-a",
      "产品发起人 A",
      node(
        "product-a",
        "offer",
        "skill",
        "MVP 产品策划",
        "提供需求梳理、范围收束和产品叙事。",
        ["产品策划", "MVP", "需求梳理"],
        ["一份 MVP 产品方案"],
      ),
      node(
        "product-a",
        "need",
        "skill",
        "网页原型开发",
        "需要一个可在手机端演示的网页原型。",
        ["网页开发", "MVP", "前端"],
        [],
      ),
      ["skill_swap", "collaboration"],
      ["线上"],
      ["周末"],
    ),
    profile(
      "product-b",
      "全栈创作者 B",
      node(
        "product-b",
        "offer",
        "skill",
        "网页 MVP 开发",
        "提供移动端优先的网页前端与基础后端开发。",
        ["网页开发", "MVP", "前端"],
        ["一个可演示网页原型"],
        0.97,
      ),
      node(
        "product-b",
        "need",
        "skill",
        "产品范围与需求梳理",
        "需要明确 MVP 范围与展示叙事。",
        ["产品策划", "MVP", "需求梳理"],
        [],
        0.97,
      ),
      ["skill_swap", "collaboration"],
      ["线上"],
      ["周末"],
    ),
    profile(
      "product-c",
      "外包开发者 C",
      node(
        "product-c",
        "offer",
        "skill",
        "网页外包开发",
        "可用技能互换方式完成网页开发。",
        ["网页开发", "MVP", "前端"],
        ["一个网页原型"],
      ),
      node(
        "product-c",
        "need",
        "skill",
        "产品需求文档",
        "需要对方提供明确的产品方案与需求梳理。",
        ["产品策划", "MVP", "需求梳理"],
        [],
      ),
      ["skill_swap"],
      ["线上"],
      ["周末"],
    ),
    profile(
      "product-d",
      "工作日开发者 D",
      node(
        "product-d",
        "offer",
        "skill",
        "网页 MVP 开发",
        "工作日提供网页前端开发。",
        ["网页开发", "MVP", "前端"],
        ["一个网页原型"],
      ),
      node(
        "product-d",
        "need",
        "skill",
        "产品需求梳理",
        "希望通过技能互换获得产品策划。",
        ["产品策划", "MVP", "需求梳理"],
        [],
      ),
      ["skill_swap"],
      ["线上"],
      ["周末"],
    ),
  ],
  sourceTexts: {
    "product-a": "我能提供 MVP 产品策划，希望用技能互换找到网页开发伙伴。",
    "product-b": "我能开发网页 MVP，需要有人帮我梳理产品范围和需求。",
    "product-c": "我可用技能互换承接网页开发，需要对方先给出清晰的产品方案。",
    "product-d": "我周末能做网页开发，希望互换产品策划支持。",
  },
  pact: {
    title: "MVP 产品策划置换网页原型开发",
    exchangeModes: ["skill_swap"],
    timeWindow: "本周末",
    locationSummary: "线上协作",
    costOrDifference: "技能互换，不额外计费",
    firstAction: "产品方先提交一页需求摘要，开发方确认技术边界",
    completionCriteria: ["提交一份 MVP 产品方案", "交付一个移动端可演示网页原型"],
    exitRule: "无法继续时提前说明，并交付已经完成的可复用材料",
    commitments: [
      { personaId: "product-a", deliverable: "提交一份 MVP 产品方案" },
      { personaId: "product-b", deliverable: "提交一个移动端可演示网页原型" },
    ],
    outcomes: {
      "product-a": {
        completed: "产品想法获得可演示网页原型",
        exited: "完成一次技术伙伴连接评估，但本次未继续执行",
        treeChange: "生命树新增一枚产品落地果实",
      },
      "product-b": {
        completed: "获得一份清晰的 MVP 产品方案",
        exited: "完成一次产品合作评估，但本次未继续执行",
        treeChange: "生命树新增一枚产品协作果实",
      },
    },
  },
};

const ruralContent: DemoScenario = {
  id: "rural-content",
  title: "田园空间 × 内容运营",
  summary: "用田园空间联合运营机会连接新媒体内容伙伴。",
  viewerPersonaId: "rural-a",
  expectedCandidateId: "rural-b",
  profiles: [
    profile(
      "rural-a",
      "田园空间主理人 A",
      node(
        "rural-a",
        "offer",
        "opportunity",
        "田园空间联合运营机会",
        "杭州近郊田园体验空间，可共同策划线下活动。",
        ["田园空间", "联合运营", "线下活动"],
        ["一次田园主题活动场地与联合运营机会"],
      ),
      node(
        "rural-a",
        "need",
        "service",
        "新媒体内容运营",
        "需要短视频策划、拍摄与品牌传播支持。",
        ["内容运营", "短视频", "品牌传播"],
        [],
      ),
      ["collaboration", "barter"],
      ["杭州近郊"],
      ["九月周末"],
    ),
    profile(
      "rural-b",
      "内容创作者 B",
      node(
        "rural-b",
        "offer",
        "service",
        "短视频内容运营",
        "提供主题策划、短视频拍摄和账号内容运营。",
        ["内容运营", "短视频", "品牌传播"],
        ["一期田园主题短视频内容"],
        0.95,
      ),
      node(
        "rural-b",
        "need",
        "opportunity",
        "田园主题联合创作机会",
        "寻找可开展线下活动和内容共创的田园空间。",
        ["田园空间", "联合运营", "线下活动"],
        [],
        0.95,
      ),
      ["collaboration", "barter"],
      ["杭州近郊"],
      ["九月周末"],
    ),
    profile(
      "rural-c",
      "商业运营团队 C",
      node(
        "rural-c",
        "offer",
        "service",
        "商业内容代运营",
        "可联合运营并提供短视频与品牌传播服务。",
        ["内容运营", "短视频", "品牌传播"],
        ["一期短视频内容"],
      ),
      node(
        "rural-c",
        "need",
        "opportunity",
        "田园活动场地",
        "需要活动空间，可接受联合运营。",
        ["田园空间", "联合运营", "线下活动"],
        [],
      ),
      ["collaboration"],
      ["杭州近郊"],
      ["九月周末"],
    ),
    profile(
      "rural-d",
      "异地内容团队 D",
      node(
        "rural-d",
        "offer",
        "service",
        "田园短视频运营",
        "提供短视频策划和品牌传播。",
        ["内容运营", "短视频", "品牌传播"],
        ["一期短视频内容"],
      ),
      node(
        "rural-d",
        "need",
        "opportunity",
        "杭州田园联合创作",
        "寻找杭州近郊的田园空间。",
        ["田园空间", "联合运营", "线下活动"],
        [],
      ),
      ["collaboration"],
      ["杭州近郊"],
      ["九月周末"],
    ),
  ],
  sourceTexts: {
    "rural-a": "我有杭州近郊田园空间，希望连接能做短视频和内容运营的联合伙伴。",
    "rural-b": "我能做短视频内容运营，希望找到田园空间共同策划线下活动。",
    "rural-c": "我们可联合运营提供内容服务，也需要适合活动的田园场地。",
    "rural-d": "我们能做田园短视频，希望连接杭州近郊的联合创作空间。",
  },
  pact: {
    title: "田园空间联合运营与短视频内容共创",
    exchangeModes: ["collaboration"],
    timeWindow: "九月周末，具体日期待双方确认",
    locationSummary: "杭州近郊（确认桥约后开放详细地址）",
    costOrDifference: "联合运营，新增成本由双方另行确认",
    firstAction: "内容方先提交一期主题提纲，空间方确认可用档期",
    completionCriteria: ["完成一次田园主题活动", "交付一期主题短视频内容"],
    exitRule: "无法执行时至少提前 48 小时告知",
    commitments: [
      { personaId: "rural-a", deliverable: "提供一次田园活动场地与联合运营支持" },
      { personaId: "rural-b", deliverable: "策划并交付一期田园主题短视频内容" },
    ],
    outcomes: {
      "rural-a": {
        completed: "完成一次田园空间内容共创",
        exited: "完成一次内容伙伴连接评估，但本次未继续执行",
        treeChange: "生命树新增一枚空间共创果实",
      },
      "rural-b": {
        completed: "获得一次田园主题联合创作经历",
        exited: "完成一次空间合作评估，但本次未继续执行",
        treeChange: "生命树新增一枚内容共创果实",
      },
    },
  },
};

export const demoScenarios: DemoScenario[] = [
  studioPhotography,
  productWeb,
  ruralContent,
];

export const getDemoScenario = (scenarioId: string): DemoScenario => {
  const scenario = demoScenarios.find((item) => item.id === scenarioId);
  if (!scenario) {
    throw new Error(`unknown demo scenario: ${scenarioId}`);
  }
  return scenario;
};
