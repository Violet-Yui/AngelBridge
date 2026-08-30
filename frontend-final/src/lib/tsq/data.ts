// 天使桥 · 示例数据（前端原型）。上线接入真实数据时统一替换。
// 说明：色调 kind 用于卡片轻底色：green=人/成长, warm=物/资源, purple=心愿/工作/AI

export type Kind = "green" | "warm" | "purple";

// —— 人生树首页 ——
export type Match = {
  id: string;
  visualEmoji?: string;
  kind: Kind;
  tag: string; // 想找的人 / 想找的房 / ...
  scoreRange: string; // 匹配度百分比
  image: string; // 手绘风封面
  title: string;
  reason: string; // 匹配原因
  interested: number; // 也感兴趣人数
};

export type TodoKind = "job" | "coop" | "swap";
export type Todo = {
  id: string;
  kind: TodoKind;
  title: string;
  desc: string;
  meta: string;
};

export const HOME_MATCHES: Match[] = [
  {
    id: "m1",
    kind: "green",
    tag: "想找的人",
    scoreRange: "92%",
    image: "/migrated-assets/home-match-1.png",
    title: "资源设计师 · 可合作",
    reason: "你擅长 UI，对方想找长期共创伙伴",
    interested: 12,
  },
  {
    id: "m2",
    kind: "warm",
    tag: "想找的房",
    scoreRange: "88%",
    image: "/migrated-assets/home-match-2.png",
    title: "江景两居室 · 整租",
    reason: "符合你「近地铁 + 采光好」的心愿",
    interested: 8,
  },
  {
    id: "m3",
    kind: "purple",
    tag: "想找的工作",
    scoreRange: "86%",
    image: "/migrated-assets/home-match-3.png",
    title: "产品经理 · 互联网",
    reason: "与你 3 年产品经验高度匹配",
    interested: 16,
  },
  {
    id: "m4",
    kind: "warm",
    tag: "换物机会",
    scoreRange: "80%",
    image: "/migrated-assets/home-match-4.png",
    title: "设计课程 ↔ 摄影服务",
    reason: "你的课程正好是对方的心愿",
    interested: 5,
  },
];

export const HOME_TODOS: Todo[] = [
  {
    id: "t1",
    kind: "job",
    title: "小天发现一份可能适合你的工作",
    desc: "该职位与你的技能和经验高度匹配，是否接受推荐？",
    meta: "本地生活公司 · 产品设计师 · 匹配度 92%",
  },
  {
    id: "t2",
    kind: "coop",
    title: "有人希望与你建立合作关系",
    desc: "摄影师小林想与你合作拍摄项目，可互换资源。",
    meta: "合作 · 摄影拍摄",
  },
  {
    id: "t3",
    kind: "swap",
    title: "一个换物机会等待你确认",
    desc: "对方想用「胶片相机」交换你的「设计课程名额」。",
    meta: "换物 · 相机 ↔ 课程",
  },
];

// —— 找人内容流 ——
export type DiscoverFilter =
  | "全部"
  | "附近"
  | "技能达人"
  | "兴趣伙伴"
  | "合作伙伴"
  | "更多";

export const DISCOVER_FILTERS: DiscoverFilter[] = [
  "全部",
  "附近",
  "技能达人",
  "兴趣伙伴",
  "合作伙伴",
  "更多",
];

// 帖子分类：与顶部标签栏一一对应（"全部""更多"为视图，不属于卡片归属）
export type PersonCategory = "附近" | "技能达人" | "兴趣伙伴" | "合作伙伴";

// 每个业务分类对应的左上角标签文案（左上角标签 = 该帖归属的顶部分类）
export const CATEGORY_BADGE: Record<PersonCategory, string> = {
  附近: "附近的人",
  技能达人: "技能达人",
  兴趣伙伴: "兴趣伙伴",
  合作伙伴: "合作伙伴",
};

export type PostComment = {
  id: string;
  author: string;
  authorHandle?: string; // 评论者主页
  emoji: string;
  text: string;
  time: string;
  likes?: number;
  replies?: PostComment[]; // 楼中楼回复
};

export type PersonCard = {
  id: string;
  kind: Kind;
  category: PersonCategory; // 归属的顶部标签栏分类
  title: string;
  desc: string;
  place: string;
  author: string;
  authorHandle: string; // 用户主页标识
  authorBio: string; // 作者一句话简介
  likes: number;
  favorites: number; // 收藏数
  tall?: boolean; // 瀑布流高低错落
  emoji: string; // 手绘占位插画的主视觉（原型演示）
  image?: string; // 帖子封面真实图片
  time: string; // 发布时间
  comments: PostComment[];
};

// 左上角标签始终由 category 派生，保证与顶部标签栏对应
export function badgeOf(card: PersonCard): string {
  return CATEGORY_BADGE[card.category];
}

export const DISCOVER_CARDS: PersonCard[] = [
  {
    id: "p1",
    kind: "green",
    category: "兴趣伙伴",
    title: "想认识摄影搭子，一起记录生活中的美好瞬间",
    desc: "坐标杭州，喜欢拍照，也喜欢探索城市里的小角落～希望能遇到同好，周末一起去扫街、拍人像或者记录城市里的光影。",
    place: "杭州 · 西湖区",
    author: "橙子汽水",
    authorHandle: "chengzi",
    authorBio: "摄影爱好者 · 记录生活的光影",
    likes: 56,
    favorites: 18,
    tall: true,
    emoji: "📷",
    image: "/discover/p1.png",
    time: "2 小时前",
    comments: [
      { id: "c1", author: "光影小鹿", emoji: "🦌", text: "我也在西湖区！可以约拍～", time: "1 小时前" },
      { id: "c2", author: "胶片旅人", emoji: "🎞️", text: "同好+1，喜欢扫街", time: "40 分钟前" },
    ],
  },
  {
    id: "p2",
    kind: "warm",
    category: "技能达人",
    title: "吉他入门想找个小伙伴一起练，互相鼓励～",
    desc: "刚学吉他不久，想找一个同样是新手的伙伴一起练习、分享，也欢迎有经验的达人指点一二。",
    place: "北京 · 朝阳区",
    author: "小树芽",
    authorHandle: "shuya",
    authorBio: "吉他新手 · 每天练琴打卡中",
    likes: 42,
    favorites: 9,
    emoji: "🎸",
    image: "/discover/p2.png",
    time: "5 小时前",
    comments: [
      { id: "c1", author: "指弹阿哲", emoji: "🎵", text: "我可以帮你看看指法～", time: "3 小时前" },
    ],
  },
  {
    id: "p3",
    kind: "purple",
    category: "合作伙伴",
    title: "寻找品牌设计师，长期合作共创项目",
    desc: "我们是一家小型创意工作室，正在寻找一位有想法、有审美的品牌设计师，长期合作、按项目结算，也接受资源互换。",
    place: "上海 · 静安区",
    author: "设计小站",
    authorHandle: "designspot",
    authorBio: "创意工作室 · 品牌 / 视觉共创",
    likes: 78,
    favorites: 31,
    tall: true,
    emoji: "🎨",
    image: "/discover/p3.png",
    time: "昨天",
    comments: [
      { id: "c1", author: "野生设计师", emoji: "✏️", text: "作品集已私信，期待合作！", time: "昨天" },
      { id: "c2", author: "林一叶", emoji: "🌿", text: "我做 UI，可以聊聊长期共创～", time: "昨天" },
    ],
  },
  {
    id: "p4",
    kind: "green",
    category: "技能达人",
    title: "产品经理交流小组，欢迎加入！",
    desc: "想认识更多产品经理，一起交流经验、分享资源、碰撞想法～不定期组织线上分享。",
    place: "深圳 · 南山区",
    author: "野生产品汪",
    authorHandle: "pmwang",
    authorBio: "互联网产品经理 · 3 年经验",
    likes: 63,
    favorites: 22,
    emoji: "💡",
    image: "/discover/p4.png",
    time: "昨天",
    comments: [],
  },
  {
    id: "p5",
    kind: "warm",
    category: "兴趣伙伴",
    title: "一起画画呀！水彩 / 插画都可以～",
    desc: "喜欢用画笔记录生活，想找同样热爱画画的小伙伴一起进步，线上线下都可以。",
    place: "广州 · 天河区",
    author: "麋小葵",
    authorHandle: "mixiaokui",
    authorBio: "插画师 · 水彩 / 板绘",
    likes: 39,
    favorites: 14,
    tall: true,
    emoji: "🖌️",
    image: "/discover/p5.png",
    time: "2 天前",
    comments: [
      { id: "c1", author: "水彩喵", emoji: "🐱", text: "想加入！有没有群～", time: "2 天前" },
    ],
  },
  {
    id: "p6",
    kind: "purple",
    category: "附近",
    title: "想找个英语语伴，就在附近，互相学习进步",
    desc: "想提高口语表达，希望能找到附近一起练习口语的伙伴，可以约在咖啡馆面对面练，互相鼓励～",
    place: "成都 · 武侯区",
    author: "学习的小E",
    authorHandle: "littlee",
    authorBio: "英语学习者 · 备考雅思中",
    likes: 48,
    favorites: 11,
    emoji: "🗣️",
    image: "/discover/p6.png",
    time: "3 天前",
    comments: [],
  },
  {
    id: "p7",
    kind: "green",
    category: "附近",
    title: "附近有没有一起晨跑的伙伴？锦江边约起",
    desc: "每天早上 6:30 锦江边晨跑，想找住得近的伙伴一起，互相监督不偷懒～",
    place: "成都 · 武侯区",
    author: "跑步的阿May",
    authorHandle: "runmay",
    authorBio: "晨跑爱好者 · 半马完赛",
    likes: 34,
    favorites: 7,
    emoji: "🏃",
    image: "/discover/p7.png",
    time: "5 小时前",
    comments: [],
  },
  {
    id: "p8",
    kind: "purple",
    category: "合作伙伴",
    title: "短视频工作室找长期剪辑合作，可分成",
    desc: "本地生活类短视频，稳定更新，寻找靠谱剪辑长期合作，按条或分成结算均可。",
    place: "上海 · 徐汇区",
    author: "阿柴出品",
    authorHandle: "achai",
    authorBio: "短视频创作者 · 本地生活赛道",
    likes: 51,
    favorites: 19,
    emoji: "🎬",
    image: "/discover/p8.png",
    time: "昨天",
    comments: [
      { id: "c1", author: "剪刀手Leo", emoji: "✂️", text: "有作品，可以聊！", time: "昨天" },
    ],
  },
];

// 按 handle 查作者（用于个人主页）
export function findCardsByAuthor(handle: string): PersonCard[] {
  return DISCOVER_CARDS.filter((c) => c.authorHandle === handle);
}

export function findCard(id: string): PersonCard | undefined {
  return DISCOVER_CARDS.find((c) => c.id === id);
}

// —— 用户画像（个人主页展示：需求 / 资源 / 个性特质）——
export type UserPersona = {
  needs: string[]; // TA 的需求（想找 / 想要）
  resources: string[]; // TA 的资源（能提供 / 拥有）
  traits: string[]; // 个性特质标签
};

// 为主要用户定制画像，其余用 getPersona 生成合理默认
const USER_PERSONAS: Record<string, UserPersona> = {
  chengzi: {
    needs: ["想找摄影搭子一起扫街", "想置换一台胶片相机", "想认识杭州本地同好"],
    resources: ["人像 / 街拍摄影", "后期修图", "杭州拍摄点位攻略"],
    traits: ["爱观察", "随性", "乐于分享"],
  },
  shuya: {
    needs: ["想找一起练琴的伙伴", "想要入门吉他教程", "想坚持每日打卡"],
    resources: ["基础乐理笔记", "练琴计划表", "耐心陪练"],
    traits: ["自律", "有耐心", "爱记录"],
  },
  designspot: {
    needs: ["寻找长期合作的品牌设计师", "想扩充创意资源库", "想找靠谱共创伙伴"],
    resources: ["创意工作室资源", "品牌 / 视觉项目", "按项目结算 / 可换物"],
    traits: ["有审美", "务实", "重协作"],
  },
  pmwang: {
    needs: ["想认识更多产品经理", "想交流行业经验", "想招产品实习生"],
    resources: ["3 年产品经验", "需求梳理 / 原型能力", "行业人脉"],
    traits: ["逻辑清晰", "爱交流", "行动派"],
  },
  mixiaokui: {
    needs: ["想找画画搭子", "想接插画约稿", "想处理闲置家具"],
    resources: ["水彩 / 板绘", "插画约稿", "闲置好物"],
    traits: ["细腻", "热爱生活", "有创意"],
  },
  yiye: {
    needs: ["想找长期共创的设计伙伴", "想学一门乐器", "想找远程产品工作"],
    resources: ["UI 设计 / Figma / 3 年", "创意圈人脉", "乐于分享经验"],
    traits: ["爱学习", "靠谱", "乐于助人"],
  },
  "film-traveler": {
    needs: ["想置换设计课程名额", "想认识同城摄影玩家"],
    resources: ["理光 GR3 相机", "街拍经验", "器材鉴别"],
    traits: ["讲究", "爱旅行", "重信用"],
  },
  "local-hr": {
    needs: ["招聘 UI 设计师", "寻找优秀的设计人才"],
    resources: ["本地生活团队岗位", "职业发展空间", "13 薪福利"],
    traits: ["专业", "高效", "直爽"],
  },
};

export function getPersona(handle: string, bio?: string): UserPersona {
  if (USER_PERSONAS[handle]) return USER_PERSONAS[handle];
  // 未定制的用户：基于简介给出合理占位画像
  const skill = bio?.split("·")[0]?.trim() || "多面手";
  return {
    needs: ["想认识志同道合的伙伴", "想交换有价值的资源"],
    resources: [skill, "乐于分享", "本地资源"],
    traits: ["真诚", "开放", "靠谱"],
  };
}


// —— 桥约（邀请管理）——
// 桥约状态流（最小闭环）：待处理 → 已接受 → 进行中 → 已完成(含双向评价)；rejected 为异常归档
export type BridgeStatus = "pending" | "accepted" | "ongoing" | "done" | "rejected";
export type BridgeType = "coop" | "friend" | "swap";
export type BridgeSource = "小天撮合" | "对方发起" | "我发起";

// 完成确认结果
export type CompleteResult = "completed" | "partial" | "failed";
// 一条双向评价
export type BridgeReview = {
  result: CompleteResult; // 是否完成
  tags: string[]; // 体验标签
  note: string; // 文字反馈
  rating: number; // 1-5 星
};

export type Invite = {
  id: string;
  status: BridgeStatus;
  type: BridgeType;
  source: BridgeSource;
  person: string;
  place: string;
  time: string;
  // 换物专用：交换结构
  mine?: string;
  theirs?: string;
  // 合作/交友：描述
  desc?: string;
  postHref?: string;
  chatThread?: string;
  // 我方对本次桥约的评价（已评价后写入）
  myReview?: BridgeReview;
};

// 完成体验标签（评价用）
export const BRIDGE_REVIEW_TAGS = [
  "沟通顺畅",
  "守时靠谱",
  "货真价实",
  "乐于助人",
  "超出预期",
  "还会再合作",
];

export const INVITES: Invite[] = [
  {
    id: "i1",
    status: "pending",
    type: "swap",
    source: "小天撮合",
    person: "胶片旅人",
    place: "杭州 · 上城区",
    time: "10 分钟前",
    mine: "设计课程名额",
    theirs: "理光胶片相机",
  },
  {
    id: "i2",
    status: "pending",
    type: "coop",
    source: "对方发起",
    person: "摄影师小林",
    place: "上海 · 徐汇区",
    time: "1 小时前",
    desc: "想与你合作一个品牌拍摄项目，可用拍摄服务换你的设计支持。",
  },
  {
    id: "i3",
    status: "pending",
    type: "friend",
    source: "对方发起",
    person: "橙子汽水",
    place: "杭州 · 西湖区",
    time: "今天 09:20",
    desc: "看到你也喜欢城市漫步摄影，想认识你做个搭子～",
  },
  {
    id: "i4",
    status: "accepted",
    type: "swap",
    source: "我发起",
    person: "植物研究所",
    place: "广州 · 天河区",
    time: "昨天",
    mine: "多肉盆栽 3 盆",
    theirs: "手绘插画一幅",
  },
  {
    id: "i5",
    status: "accepted",
    type: "coop",
    source: "小天撮合",
    person: "创意工作室",
    place: "深圳 · 南山区",
    time: "3 天前",
    desc: "已确认长期共创，等待你在消息里约定首次沟通时间。",
  },
  {
    id: "i6",
    status: "rejected",
    type: "friend",
    source: "对方发起",
    person: "匿名用户",
    place: "未知",
    time: "上周",
    desc: "你已婉拒这条交友邀请。",
  },
  {
    id: "i7",
    status: "rejected",
    type: "swap",
    source: "我发起",
    person: "旧书小屋",
    place: "北京 · 海淀区",
    time: "上周",
    mine: "闲置耳机",
    theirs: "二手书 5 本",
  },
];

// —— 消息（三分区）——
export type MsgZone = "ai" | "friend" | "stranger";
export type Conversation = {
  id: string;
  zone: MsgZone;
  name: string;
  emoji: string;
  last: string;
  time: string;
  unread: number;
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    zone: "ai",
    name: "小天 · 智能助手",
    emoji: "🌱",
    last: "我为你新匹配到 3 个换物机会，要看看吗？",
    time: "刚刚",
    unread: 3,
  },
  {
    id: "c2",
    zone: "friend",
    name: "设计小站",
    emoji: "🎨",
    last: "那我们周四下午视频对一下项目细节～",
    time: "12:40",
    unread: 2,
  },
  {
    id: "c3",
    zone: "friend",
    name: "小树芽",
    emoji: "🎸",
    last: "今晚一起云练琴吗？",
    time: "昨天",
    unread: 0,
  },
  {
    id: "c4",
    zone: "friend",
    name: "植物研究所",
    emoji: "🪴",
    last: "多肉已经打包好啦，约个时间交换～",
    time: "昨天",
    unread: 0,
  },
  {
    id: "c5",
    zone: "stranger",
    name: "胶片旅人",
    emoji: "📷",
    last: "在吗？想聊聊相机换课程的事。",
    time: "周一",
    unread: 1,
  },
  {
    id: "c6",
    zone: "stranger",
    name: "野生产品汪",
    emoji: "💡",
    last: "看到你也是产品，想交流下经验～",
    time: "上周",
    unread: 0,
  },
];

// —— 我（个人画像）——
export type ResourceItem = { label: string; value: string; kind: Kind };

export const ME = {
  name: "林一叶",
  handle: "@yiye",
  stage: "盛长期 · 扎根积累",
  growth: 1280,
  growthDelta: 28,
  level: 12,
  sunlightCoins: 128,
  wishSeeds: 3,
  freshSprouts: 5,
  followers: 12,
  mood: "晴",
  luck: 5,
  // 我的资源（拥有）
  resources: [
    { label: "健康", value: "作息规律 · 常跑步", kind: "green" },
    { label: "财富", value: "稳定储蓄 · 可小额投资", kind: "warm" },
    { label: "技能", value: "UI设计 / Figma / 3年", kind: "green" },
    { label: "人脉", value: "创意圈 · 20+ 伙伴", kind: "purple" },
    { label: "潜力", value: "未来可期 · 持续学习", kind: "purple" },
    { label: "闲置", value: "相机 / 书籍 / 盆栽", kind: "warm" },
  ] as ResourceItem[],
  // 我的需求（心愿）
  needs: [
    "想找长期共创的设计伙伴",
    "想学习一门乐器（吉他）",
    "想置换一台胶片相机",
    "想找一份远程产品工作",
  ],
  // 成长记录
  growthLog: [
    { title: "完成一次资源交换", date: "今天", delta: 28 },
    { title: "分享经验帮助了 6 人", date: "昨天", delta: 15 },
    { title: "新增合作伙伴 1 位", date: "3 天前", delta: 20 },
  ],
} as const;

// —— 创建页可选项 ——
export const CREATE_CHANNELS = [
  { key: "person", label: "找人", desc: "发布伙伴/合作/搭子需求", kind: "green" },
  { key: "thing", label: "找物", desc: "发布想找的物品/资源", kind: "warm" },
  { key: "job", label: "找工作", desc: "发布岗位或求职意向", kind: "purple" },
  { key: "idle", label: "闲置", desc: "让闲置资源重新流动", kind: "warm" },
  { key: "exp", label: "经验", desc: "分享攻略与心得", kind: "purple" },
  { key: "video", label: "视频", desc: "用视频展示资源", kind: "green" },
] as const;

export const CHANNELS = [
  "人生树",
  "找人",
  "找物",
  "找工作",
  "闲置",
  "经验",
  "视频",
] as const;
