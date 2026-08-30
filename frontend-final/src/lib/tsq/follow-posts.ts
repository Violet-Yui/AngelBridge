import type { Kind, PostComment } from "@/lib/tsq/data";

export type FollowPost = {
  id: string;
  image: string;
  title: string;
  desc: string;
  author: string;
  handle: string;
  avatar: string;
  likes: number | string;
  match: string | null;
  tall?: boolean;
  kind: Kind;
  place: string;
  time: string;
  facts: { label: string; value: string }[];
  comments: PostComment[];
};

export const FOLLOW_POSTS: FollowPost[] = [
  { id: "tea-welcome", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=640&auto=format&fit=crop", title: "用一杯好茶迎接你的到来", desc: "家里有几罐新到的白茶和乌龙，周末可以一起品茶聊天。希望认识同城喜欢慢生活、也愿意分享生活经验的朋友。", author: "柠檬CC", handle: "lemoncc", avatar: "🍋", likes: 222, match: null, tall: false, kind: "green", place: "杭州 · 西湖区", time: "20 分钟前", facts: [{ label: "我提供", value: "白茶/乌龙品饮体验" }, { label: "我想要", value: "认识同城慢生活朋友" }, { label: "地点", value: "杭州西湖区，确认后发具体地址" }], comments: [{ id: "c1", author: "茶小满", emoji: "🍵", text: "这个太治愈了，周日下午可以吗？", time: "刚刚" }] },
  { id: "wide-world", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=640&auto=format&fit=crop", title: "开心前往美好天地，世界为之宽广", desc: "计划下个月去云南短住一周，想找能一起做攻略、拍照、分担住宿的搭子。", author: "老家", handle: "laojia", avatar: "🌿", likes: "1万", match: "匹配度68%", tall: true, kind: "warm", place: "云南 · 大理", time: "1 小时前", facts: [{ label: "我想要", value: "旅行搭子与攻略共创" }, { label: "我提供", value: "摄影记录与住宿分摊" }, { label: "完成标准", value: "确认路线、住宿和预算" }], comments: [] },
  { id: "product-talk", image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=640&auto=format&fit=crop", title: "一起探讨我们感兴趣的产品", desc: "每周线上产品拆解，关注社区、AI 工具和增长设计，欢迎产品/设计/运营伙伴加入。", author: "鲜浆一味", handle: "fresh-juice", avatar: "🧃", likes: 2, match: null, tall: true, kind: "purple", place: "线上", time: "今天", facts: [{ label: "我提供", value: "产品拆解模板和会议组织" }, { label: "我获得", value: "不同视角反馈" }, { label: "第一步行动", value: "先交换一个想拆解的产品" }], comments: [] },
  { id: "ideal-life", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=640&auto=format&fit=crop", title: "和美好的人创造理想生活", desc: "想组织一个小型共创局，围绕生活方式、空间、美食和影像做长期内容。", author: "乐乐", handle: "lele", avatar: "☕", likes: 2, match: "匹配度98%", tall: false, kind: "green", place: "上海 · 徐汇", time: "今天", facts: [{ label: "我想要", value: "内容共创伙伴" }, { label: "地点", value: "上海或线上" }, { label: "退出方式", value: "提前沟通即可" }], comments: [] },
  { id: "photo-partner", image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=640&auto=format&fit=crop", title: "周末想认识摄影搭子，一起扫街", desc: "偏人文和城市街景，想找一个能互相出片、互相提醒构图的朋友。", author: "胶片旅人", handle: "film-traveler", avatar: "📷", likes: 86, match: "匹配度91%", tall: true, kind: "warm", place: "杭州 · 上城", time: "昨天", facts: [{ label: "我想要", value: "摄影搭子" }, { label: "我提供", value: "胶片相机试用和修图建议" }, { label: "地点", value: "杭州上城/西湖" }], comments: [] },
  { id: "plant-exchange", image: "https://images.unsplash.com/photo-1459156212016-c812468e2115?q=80&w=640&auto=format&fit=crop", title: "多肉分株，想换一盆香草", desc: "家里的多肉长得很好，可以分几盆出来，想换迷迭香或薄荷。", author: "植物研究所", handle: "plant-lab", avatar: "🪴", likes: 44, match: null, tall: false, kind: "green", place: "广州 · 天河", time: "昨天", facts: [{ label: "我提供", value: "多肉分株 2-3 盆" }, { label: "我获得", value: "迷迭香/薄荷" }, { label: "完成标准", value: "当面确认植物状态" }], comments: [] },
  { id: "food-map", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=640&auto=format&fit=crop", title: "一起整理城市美食地图", desc: "想做一份真实、不广告的同城小店清单，欢迎爱探店的朋友一起维护。", author: "饭团", handle: "fantuan", avatar: "🍙", likes: 120, match: "匹配度87%", tall: true, kind: "warm", place: "成都 · 全城", time: "2 天前", facts: [{ label: "我提供", value: "地图模板和整理方法" }, { label: "我想要", value: "真实探店记录" }, { label: "第一步行动", value: "先各自提交 3 家店" }], comments: [] },
  { id: "book-club", image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=640&auto=format&fit=crop", title: "周三晚读书会，一起聊长期主义", desc: "线上语音读书会，每次 45 分钟，轻松分享最近读到的一个观点。", author: "旧书小屋", handle: "old-books", avatar: "📖", likes: 67, match: null, tall: false, kind: "purple", place: "线上", time: "3 天前", facts: [{ label: "我提供", value: "读书会主持和资料" }, { label: "地点", value: "线上语音" }, { label: "完成标准", value: "每人分享一个观点" }], comments: [] },
];

export function findFollowPost(id: string) {
  return FOLLOW_POSTS.find((post) => post.id === id);
}
