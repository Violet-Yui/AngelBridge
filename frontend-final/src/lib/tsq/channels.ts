// 天使桥 · 找物 / 找工作 / 闲置 / 经验 四大频道示例数据（前端原型）
// 统一的内容流结构 FeedItem：不同频道用不同数据集 + 不同筛选项，共用列表/详情组件。
import type { Kind, PostComment } from "@/lib/tsq/data";

export type ChannelKey = "thing" | "job" | "idle" | "exp";

export type FeedItem = {
  id: string;
  channel: ChannelKey;
  kind: Kind;
  category: string; // 归属的筛选分类（= 该频道筛选项之一）
  title: string;
  desc: string;
  // 频道特有的结构化信息（详情页以标签形式展示）
  facts: { label: string; value: string }[];
  place: string;
  author: string;
  authorHandle: string;
  authorBio: string;
  likes: number;
  favorites: number;
  emoji: string;
  image?: string;
  tall?: boolean;
  time: string;
  comments: PostComment[];
};

// 每个频道的筛选标签（首项恒为「全部」，末项恒为「更多」）
export const CHANNEL_FILTERS: Record<ChannelKey, string[]> = {
  thing: ["全部", "数码", "书籍", "家居", "母婴", "更多"],
  job: ["全部", "全职", "兼职", "远程", "实习", "更多"],
  idle: ["全部", "数码", "服饰", "图书", "家具", "更多"],
  exp: ["全部", "职场", "学习", "生活", "副业", "更多"],
};

export const CHANNEL_META: Record<
  ChannelKey,
  { label: string; placeholder: string }
> = {
  thing: { label: "找物", placeholder: "该分类下暂时还没有需求，换个标签看看吧～" },
  job: { label: "找工作", placeholder: "该分类下暂时还没有职位，换个标签看看吧～" },
  idle: { label: "闲置", placeholder: "该分类下暂时还没有闲置，换个标签看看吧～" },
  exp: { label: "经验", placeholder: "该分类下暂时还没有分享，换个标签看看吧～" },
};

export const CHANNEL_ITEMS: FeedItem[] = [
  // ——— 找物 ———
  {
    id: "t1",
    channel: "thing",
    kind: "warm",
    category: "数码",
    title: "求一台二手 iPad，用来画画和记笔记",
    desc: "预算 2000 以内，成色好、无维修史优先，杭州可当面交易，也接受资源互换。",
    facts: [
      { label: "预算", value: "≤ 2000 元" },
      { label: "交易方式", value: "当面 / 换物" },
    ],
    place: "杭州 · 西湖区",
    author: "画画的橙子",
    authorHandle: "orange-draw",
    authorBio: "插画爱好者 · 想要一台画板",
    likes: 24,
    favorites: 6,
    emoji: "📱",
    image: "/channel/t1.png",
    tall: true,
    time: "1 小时前",
    comments: [
      { id: "c1", author: "数码小铺", emoji: "🛒", text: "有台 2019 款，成色 95 新～", time: "40 分钟前" },
    ],
  },
  {
    id: "t2",
    channel: "thing",
    kind: "green",
    category: "书籍",
    title: "求《设计中的设计》原研哉，二手可",
    desc: "想读原研哉这本，二手九成新即可，可邮寄。",
    facts: [
      { label: "预算", value: "≤ 40 元" },
      { label: "交易方式", value: "邮寄" },
    ],
    place: "北京 · 海淀区",
    author: "读书的树芽",
    authorHandle: "book-shuya",
    authorBio: "设计系学生 · 爱囤书",
    likes: 15,
    favorites: 3,
    emoji: "📚",
    image: "/channel/t2.png",
    time: "今天 10:20",
    comments: [],
  },
  {
    id: "t3",
    channel: "thing",
    kind: "purple",
    category: "家居",
    title: "想找一盏氛围落地灯，暖光、可调亮度",
    desc: "布置阅读角用，暖光可调，预算 300 左右，深圳同城优先。",
    facts: [
      { label: "预算", value: "≈ 300 元" },
      { label: "交易方式", value: "同城当面" },
    ],
    place: "深圳 · 南山区",
    author: "宅家阿May",
    authorHandle: "home-may",
    authorBio: "热爱布置小家",
    likes: 31,
    favorites: 12,
    emoji: "💡",
    image: "/channel/t3.png",
    tall: true,
    time: "昨天",
    comments: [
      { id: "c1", author: "灯具控", emoji: "🔦", text: "宜家那款很合适！", time: "昨天" },
    ],
  },

  // ——— 找工作 ———
  {
    id: "j1",
    channel: "job",
    kind: "purple",
    category: "全职",
    title: "招聘 UI 设计师 · 本地生活团队",
    desc: "负责 App 与小程序界面设计，需 2 年以上经验，熟悉 Figma，有完整项目经验优先。",
    facts: [
      { label: "薪资", value: "15-22K · 13 薪" },
      { label: "地点", value: "上海 · 静安" },
      { label: "经验", value: "2 年以上" },
    ],
    place: "上海 · 静安区",
    author: "本地生活HR",
    authorHandle: "local-hr",
    authorBio: "本地生活团队 · 招聘负责人",
    likes: 42,
    favorites: 28,
    emoji: "🎨",
    image: "/channel/j1.png",
    tall: true,
    time: "3 小时前",
    comments: [
      { id: "c1", author: "林一叶", emoji: "🌿", text: "3 年 UI，作品集已投～", time: "2 小时前" },
    ],
  },
  {
    id: "j2",
    channel: "job",
    kind: "green",
    category: "远程",
    title: "远程内容运营 · 兼职可转全职",
    desc: "负责公众号与小红书内容策划撰写，远程办公，按周对齐，做得好可转全职。",
    facts: [
      { label: "薪资", value: "6-9K / 月" },
      { label: "方式", value: "远程" },
    ],
    place: "远程 · 全国",
    author: "新媒体主理人",
    authorHandle: "media-owner",
    authorBio: "内容工作室主理人",
    likes: 37,
    favorites: 19,
    emoji: "✍️",
    image: "/channel/j2.png",
    time: "昨天",
    comments: [],
  },
  {
    id: "j3",
    channel: "job",
    kind: "warm",
    category: "实习",
    title: "产品实习生 · 每周到岗 3 天",
    desc: "跟随资深产品经理参与需求梳理与原型设计，接受在校生，表现好可留用。",
    facts: [
      { label: "补贴", value: "200 / 天" },
      { label: "地点", value: "深圳 · 南山" },
    ],
    place: "深圳 · 南山区",
    author: "野生产品汪",
    authorHandle: "pmwang",
    authorBio: "互联网产品经理 · 3 年经验",
    likes: 26,
    favorites: 9,
    emoji: "💡",
    image: "/channel/j3.png",
    tall: true,
    time: "2 天前",
    comments: [
      { id: "c1", author: "应届小白", emoji: "🐣", text: "大三可以投吗？", time: "1 天前" },
    ],
  },

  // ——— 闲置 ———
  {
    id: "i1",
    channel: "idle",
    kind: "warm",
    category: "数码",
    title: "转闲置 · 理光 GR3 街拍相机",
    desc: "去年入手，快门数很低，配件齐全，无磕碰，杭州当面验机，也接受换设计课程名额。",
    facts: [
      { label: "价格", value: "3200 元" },
      { label: "成色", value: "99 新" },
      { label: "方式", value: "当面 / 换物" },
    ],
    place: "杭州 · 上城区",
    author: "胶片旅人",
    authorHandle: "film-traveler",
    authorBio: "街拍爱好者 · 常清理器材",
    likes: 58,
    favorites: 33,
    emoji: "📷",
    image: "/channel/i1.png",
    tall: true,
    time: "1 小时前",
    comments: [
      { id: "c1", author: "扫街阿哲", emoji: "📸", text: "还在吗？想当面看看", time: "30 分钟前" },
    ],
  },
  {
    id: "i2",
    channel: "idle",
    kind: "green",
    category: "图书",
    title: "闲置 · 设计类书籍 5 本打包",
    desc: "《写给大家看的设计书》等 5 本，九成新，打包出，可邮寄。",
    facts: [
      { label: "价格", value: "80 元包邮" },
      { label: "成色", value: "9 成新" },
    ],
    place: "北京 · 海淀区",
    author: "旧书小屋",
    authorHandle: "old-books",
    authorBio: "常年出闲置书",
    likes: 21,
    favorites: 8,
    emoji: "📖",
    image: "/channel/i2.png",
    time: "今天",
    comments: [],
  },
  {
    id: "i3",
    channel: "idle",
    kind: "purple",
    category: "家具",
    title: "搬家转 · 实木书桌 + 人体工学椅",
    desc: "用了一年，几乎全新，因搬家低价出，仅限广州同城自提。",
    facts: [
      { label: "价格", value: "450 元 / 套" },
      { label: "方式", value: "同城自提" },
    ],
    place: "广州 · 天河区",
    author: "麋小葵",
    authorHandle: "mixiaokui",
    authorBio: "插画师 · 水彩 / 板绘",
    likes: 40,
    favorites: 15,
    emoji: "🪑",
    image: "/channel/i3.png",
    tall: true,
    time: "昨天",
    comments: [
      { id: "c1", author: "同城搬家", emoji: "📦", text: "椅子单出吗？", time: "昨天" },
    ],
  },

  // ——— 经验 ———
  {
    id: "e1",
    channel: "exp",
    kind: "green",
    category: "职场",
    title: "转行做 UI 设计，我踩过的 5 个坑",
    desc: "从零基础转行到入职一年，分享作品集、面试、谈薪里最容易踩的坑，纯干货。",
    facts: [
      { label: "类型", value: "转行经验" },
      { label: "适合", value: "UI 入门" },
    ],
    place: "经验分享",
    author: "林一叶",
    authorHandle: "yiye",
    authorBio: "UI 设计师 · 乐于分享",
    likes: 132,
    favorites: 88,
    emoji: "🎯",
    image: "/channel/e1.png",
    tall: true,
    time: "2 小时前",
    comments: [
      { id: "c1", author: "转行小白", emoji: "🐤", text: "太及时了，正在准备作品集！", time: "1 小时前" },
      { id: "c2", author: "设计小站", emoji: "🎨", text: "第 3 点深有同感", time: "40 分钟前" },
    ],
  },
  {
    id: "e2",
    channel: "exp",
    kind: "warm",
    category: "副业",
    title: "利用业余时间接单，半年多赚一台相机",
    desc: "分享我怎么在下班后接设计私单，从找渠道、报价到交付避坑的完整流程。",
    facts: [
      { label: "类型", value: "副业经验" },
      { label: "适合", value: "接单入门" },
    ],
    place: "经验分享",
    author: "橙子汽水",
    authorHandle: "chengzi",
    authorBio: "摄影爱好者 · 记录生活的光影",
    likes: 96,
    favorites: 61,
    emoji: "💰",
    image: "/channel/e2.png",
    time: "昨天",
    comments: [],
  },
  {
    id: "e3",
    channel: "exp",
    kind: "purple",
    category: "学习",
    title: "三个月自学吉他，我的每日练习清单",
    desc: "分享一个新手也能坚持的练琴计划，附上我用过的免费教程和 App。",
    facts: [
      { label: "类型", value: "学习经验" },
      { label: "适合", value: "吉他新手" },
    ],
    place: "经验分享",
    author: "小树芽",
    authorHandle: "shuya",
    authorBio: "吉他新手 · 每天练琴打卡中",
    likes: 74,
    favorites: 40,
    emoji: "🎸",
    image: "/channel/e3.png",
    tall: true,
    time: "3 天前",
    comments: [
      { id: "c1", author: "指弹阿哲", emoji: "🎵", text: "清单收藏了，感谢！", time: "2 天前" },
    ],
  },
  {
    id: "space1",
    channel: "thing",
    kind: "warm",
    category: "家居",
    title: "江景两居室 · 整租",
    desc: "近地铁、采光好，适合需要稳定居住空间或短期过渡的伙伴。确认意向后再展示详细地址与联系方式。",
    facts: [
      { label: "位置", value: "温州龙湾" },
      { label: "方式", value: "整租 / 可协商" },
      { label: "亮点", value: "江景 · 采光好 · 近地铁" },
    ],
    place: "温州 · 龙湾",
    author: "江湾屋主",
    authorHandle: "river-home",
    authorBio: "房源提供者 · 重视稳定互信",
    likes: 38,
    favorites: 16,
    emoji: "🏠",
    image: "/channel/t3.png",
    tall: true,
    time: "今天",
    comments: [
      { id: "c1", author: "林一叶", emoji: "🌿", text: "想进一步了解通勤和入住时间～", time: "刚刚" },
    ],
  },
  {
    id: "job1",
    channel: "job",
    kind: "purple",
    category: "远程",
    title: "产品经理 · 互联网",
    desc: "远程协作岗位，关注用户增长与社区产品方向，需要有需求梳理、原型设计和跨团队推进经验。",
    facts: [
      { label: "方向", value: "社区 / 增长产品" },
      { label: "方式", value: "远程优先" },
      { label: "经验", value: "3 年左右" },
    ],
    place: "远程 · 全国",
    author: "成长型团队",
    authorHandle: "growth-team",
    authorBio: "互联网团队 · 寻找产品伙伴",
    likes: 46,
    favorites: 24,
    emoji: "💼",
    image: "/channel/j3.png",
    tall: true,
    time: "今天",
    comments: [],
  },
  {
    id: "swap1",
    channel: "idle",
    kind: "warm",
    category: "数码",
    title: "设计课程 ↔ 摄影服务",
    desc: "对方希望用一组品牌摄影服务，交换你的设计课程名额。适合先确认拍摄张数、修图范围与交付时间。",
    facts: [
      { label: "我提供", value: "设计课程名额" },
      { label: "我获得", value: "品牌照片 + 基础修图" },
      { label: "方式", value: "资源互换" },
    ],
    place: "杭州 · 可线下沟通",
    author: "品牌摄影师阿杰",
    authorHandle: "photo-ajie",
    authorBio: "摄影师 · 品牌视觉与人像拍摄",
    likes: 52,
    favorites: 20,
    emoji: "📷",
    image: "/channel/i1.png",
    tall: true,
    time: "今天",
    comments: [
      { id: "c1", author: "林一叶", emoji: "🌿", text: "这个交换边界比较清楚，可以聊聊。", time: "刚刚" },
    ],
  },
];

export function itemsByChannel(channel: ChannelKey): FeedItem[] {
  return CHANNEL_ITEMS.filter((i) => i.channel === channel);
}

export function findItem(id: string): FeedItem | undefined {
  return CHANNEL_ITEMS.find((i) => i.id === id);
}

export function channelItemsByAuthor(handle: string): FeedItem[] {
  return CHANNEL_ITEMS.filter((i) => i.authorHandle === handle);
}
