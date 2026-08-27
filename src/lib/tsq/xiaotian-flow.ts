import type { LucideIcon } from "lucide-react";
import { Camera, CalendarDays, Gift, Home, Image as ImageIcon, MapPin, MessageCircle, ShieldCheck, Star, Users, Zap } from "lucide-react";

export type FlowStep = {
  label: string;
  hint?: string;
  active?: boolean;
  done?: boolean;
};

export type IntentBlock = {
  no: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "warm" | "purple";
  children: { title: string; desc?: string; icon?: LucideIcon }[];
};

export const INTENT_BLOCKS: IntentBlock[] = [
  {
    no: 1,
    title: "我能提供 Offer",
    subtitle: "你的可交换资源",
    icon: CalendarDays,
    tone: "blue",
    children: [{ title: "周末工作室", desc: "可用时间：周六 - 周日 10:00 - 18:00", icon: CalendarDays }],
  },
  {
    no: 2,
    title: "我需要 Need",
    subtitle: "你想获得的资源",
    icon: ImageIcon,
    tone: "green",
    children: [{ title: "一组品牌照片 / 基础修图", icon: ImageIcon }],
  },
  {
    no: 3,
    title: "交换方式 Exchange",
    subtitle: "优先互换，可视情况补差价",
    icon: Gift,
    tone: "warm",
    children: [{ title: "优先互换", icon: Zap }, { title: "可补差价", icon: Star }],
  },
  {
    no: 4,
    title: "条件 Constraints",
    subtitle: "匹配边界",
    icon: MapPin,
    tone: "purple",
    children: [
      { title: "地点：温州龙湾", icon: MapPin },
      { title: "人数：1-3人", icon: Users },
      { title: "适合拍摄品牌照", icon: Gift },
    ],
  },
  {
    no: 5,
    title: "边界 Boundary",
    subtitle: "隐私与开放范围",
    icon: ShieldCheck,
    tone: "warm",
    children: [
      { title: "匹配阶段仅展示区域" },
      { title: "双方确认后开放联系方式" },
    ],
  },
];

export const BRIDGE_PROGRESS: FlowStep[] = [
  { label: "识别你的意图", done: true },
  { label: "寻找对方 Offer", active: true },
  { label: "检查双方收益" },
  { label: "生成桥的理由" },
];

export const CANDIDATES = [
  { name: "品牌摄影师阿杰", desc: "拍摄空间互换 × 品牌曝光", score: 92, tone: "blue" },
  { name: "设计师小林", desc: "空间互换 × 曝光支持", score: 88, tone: "green" },
  { name: "创意团队「光合」", desc: "空间互换 × 联合内容共创", score: 85, tone: "warm" },
];

export const BRIDGE_DETAIL = {
  you: { name: "你", role: "空间使用者", share: "空间", avatar: "小" },
  other: { name: "品牌摄影师阿杰", role: "创意团队", share: "拍摄", avatar: "杰" },
  exchange: [
    { label: "你会得到什么", title: "一组品牌照片 + 基础修图", icon: Camera, tone: "green" },
    { label: "对方会得到什么", title: "周末两天工作室使用权", icon: Home, tone: "warm" },
  ],
  reasons: ["时间匹配：你周末空闲，他周末拍摄", "地点合适：你的工作室符合拍摄需求", "双向互助：需求互补，交换意愿明确"],
  unknowns: ["拍摄时长（预计）", "设备需求（灯光 / 背景等）", "成片交付时间"],
  next: "先发 3 张场地参考图，再确认拍摄时间",
};

export const CONFIRM_INFO = {
  opened: [
    ["所在地区", "你的周末工作室"],
    ["昵称", "小天"],
    ["基础联系方式", "微信号（部分可见）"],
  ],
  protected: ["详细地址（在完成桥约约定前不会公开）"],
};

export const SCHEDULE_ITEMS = [
  { title: "我提供", desc: "周末工作室使用权（周六-周日 10:00-18:00）", icon: Gift, tone: "green" },
  { title: "我获得", desc: "一组品牌照片（含基础修图）", icon: Star, tone: "blue" },
  { title: "地点", desc: "温州龙湾（确认后显示详细地址）", icon: MapPin, tone: "warm" },
  { title: "第一步行动", desc: "今晚 20:00 前互发参考图，明天中午确认排期", icon: Zap, tone: "purple" },
  { title: "完成标准", desc: "交付 12 张精选照片 + 3 张精修", icon: ShieldCheck, tone: "green" },
  { title: "退出方式", desc: "如一方无法履约，需提前 24 小时告知", icon: MessageCircle, tone: "danger" },
];
