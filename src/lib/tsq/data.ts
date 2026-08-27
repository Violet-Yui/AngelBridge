// 天使桥 · 示例数据（前端原型）。上线接入真实数据时统一替换。
// 说明：色调 kind 用于卡片轻底色：green=人/成长, warm=物/资源, purple=心愿/工作/AI

export type Kind = "green" | "warm" | "purple";

// —— 人生树首页 ——
export type Match = {
  id: string;
  kind: Kind;
  tag: string; // 想找的人 / 想找的房 / ...
  score: number; // 匹配度
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
    score: 92,
    title: "资源设计师 · 可合作",
    reason: "你擅长 UI，对方想找长期共创伙伴",
    interested: 12,
  },
  {
    id: "m2",
    kind: "warm",
    tag: "想找的房",
    score: 87,
    title: "江景两居室 · 整租",
    reason: "符合你「近地铁 + 采光好」的心愿",
    interested: 8,
  },
  {
    id: "m3",
    kind: "purple",
    tag: "想找的工作",
    score: 84,
    title: "产品经理 · 互联网",
    reason: "与你 3 年产品经验高度匹配",
    interested: 16,
  },
  {
    id: "m4",
    kind: "warm",
    tag: "换物机会",
    score: 79,
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
    meta: "XX公司 · 产品设计师 · 匹配度 91%",
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

export type PersonCard = {
  id: string;
  kind: Kind;
  badge: string; // 新伙伴 / 技能互助 ...
  title: string;
  desc: string;
  place: string;
  author: string;
  likes: number;
  tall?: boolean; // 瀑布流高低错落
  emoji: string; // 手绘占位插画的主视觉（原型演示）
};

export const DISCOVER_CARDS: PersonCard[] = [
  {
    id: "p1",
    kind: "green",
    badge: "新伙伴",
    title: "想认识摄影搭子，一起记录生活中的美好瞬间",
    desc: "坐标杭州，喜欢拍照，也喜欢探索城市里的小角落～希望能遇到同好。",
    place: "杭州 · 西湖区",
    author: "橙子汽水",
    likes: 56,
    tall: true,
    emoji: "📷",
  },
  {
    id: "p2",
    kind: "warm",
    badge: "技能互助",
    title: "吉他入门想找个小伙伴一起练，互相鼓励～",
    desc: "刚学吉他不久，想找一个同样是新手的伙伴一起练习、分享。",
    place: "北京 · 朝阳区",
    author: "小树芽",
    likes: 42,
    emoji: "🎸",
  },
  {
    id: "p3",
    kind: "purple",
    badge: "合作伙伴",
    title: "寻找品牌设计师，长期合作共创项目",
    desc: "我们是一家小型创意工作室，正在寻找一位有想法、有审美的品牌设计师。",
    place: "上海 · 静安区",
    author: "设计小站",
    likes: 78,
    tall: true,
    emoji: "🎨",
  },
  {
    id: "p4",
    kind: "green",
    badge: "职场交流",
    title: "产品经理交流小组，欢迎加入！",
    desc: "想认识更多产品经理，一起交流经验、分享资源、碰撞想法～",
    place: "深圳 · 南山区",
    author: "野生产品汪",
    likes: 63,
    emoji: "💡",
  },
  {
    id: "p5",
    kind: "warm",
    badge: "兴趣伙伴",
    title: "一起画画呀！水彩 / 插画都可以～",
    desc: "喜欢用画笔记录生活，想找同样热爱画画的小伙伴一起进步。",
    place: "广州 · 天河区",
    author: "麋小葵",
    likes: 39,
    tall: true,
    emoji: "🖌️",
  },
  {
    id: "p6",
    kind: "purple",
    badge: "话伴伙伴",
    title: "想找个英语语伴，互相学习进步",
    desc: "想提高口语表达，希望能找到一起练习口语的伙伴，互相鼓励～",
    place: "成都 · 武侯区",
    author: "学习的小E",
    likes: 48,
    emoji: "🗣️",
  },
];

// —— 桥约（邀请管理）——
export type BridgeStatus = "pending" | "accepted" | "rejected";
export type BridgeType = "coop" | "friend" | "swap";
export type BridgeSource = "小天撮合" | "对方发起" | "我发起";

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
};

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
    name: "小天 · AI 助手",
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
  {
    id: "i2",
    zone: "friend",
    name: "摄影师小林",
    emoji: "摄",
    last: "想与你合作一个品牌拍摄项目～",
    time: "1 小时前",
    unread: 0,
  },
  {
    id: "i3",
    zone: "friend",
    name: "橙子汽水",
    emoji: "橙",
    last: "想认识你做个城市漫步搭子～",
    time: "今天 09:20",
    unread: 0,
  },
];

// —— 我（个人画像）——
export type ResourceItem = { label: string; value: string; kind: Kind };

export const ME = {
  name: "林一叶",
  handle: "@yiye",
  stage: "壮年期 · 扎根积累",
  growth: 1280,
  growthDelta: 28,
  level: 12,
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
