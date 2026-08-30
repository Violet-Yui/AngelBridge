"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// 用户画像 + 我发布的帖子（全局持久化，供个人主页 / 首页弹窗 / 我的帖子详情共享）

export type PostFormField = {
  key: string;
  label: string;
  value: string;
  required?: boolean;
};

export type MyPost = {
  id: string;
  intent: "have" | "want"; // 我拥有 / 我想要
  channelKey: string; // 二级层级选项 key
  channelLabel: string; // 二级层级选项中文名
  kind: "green" | "warm" | "purple";
  emoji: string;
  title: string;
  text: string;
  formFields?: PostFormField[];
  images: string[]; // 本地预览图 url（原型）
  place: string;
  time: string; // 展示用时间文案
  likes: number;
  favorites: number;
  status?: "published" | "matching" | "completed" | "deleted";
  matchedAt?: string;
  completedCount?: number;
  needsPostResolution?: boolean;
  matchClosed?: boolean;
  publicDisplay?: boolean;
  discoveryVisible?: boolean;
  comments: {
    id: string;
    author: string;
    authorHandle?: string;
    emoji: string;
    text: string;
    time: string;
    likes?: number;
    replies?: MyPost["comments"];
  }[];
};

export type Persona = {
  // —— 新版基本资料（两步引导采集）——
  avatar?: string; // 头像（本地预览 url / emoji）
  nickname?: string; // 昵称
  gender?: string; // 性别
  ageRange?: string; // 出生年月 / 年龄段
  city?: string; // 所在城市
  bio?: string; // 一句话介绍（可选）
  interests?: string[]; // 兴趣标签（可选，3-5 个）
  // —— 兼容旧字段（个人主页仍会读取，无值时不展示）——
  traits?: string[]; // 个性特质
  needs?: string[]; // 需求（中文标签）
  needNote?: string; // 需求补充说明
  resources?: string[]; // 资源（拆分后的条目）
  resourceText?: string; // 资源原文
};

export type GrowthLogItem = {
  id: string;
  title: string;
  date: string;
  delta: number;
};

type ProfileState = {
  persona: Persona | null;
  setPersona: (p: Persona) => void;
  growthBonus: number;
  vitalityBonus: number;
  bridgeCompletions: number;
  growthLogs: GrowthLogItem[];
  completeBridgeGrowth: () => void;
  myPosts: MyPost[];
  addPost: (p: MyPost) => void;
  updatePostStatus: (id: string, patch: Partial<Pick<MyPost, "status" | "matchedAt" | "completedCount" | "needsPostResolution" | "matchClosed" | "publicDisplay" | "discoveryVisible">>) => void;
  findMyPost: (id: string) => MyPost | undefined;
  // —— 人生树编辑 ——
  tree: TreeData;
  setTree: (tree: TreeData) => void;
  reDiagnose: () => void;
  addTreeItem: (section: TreeSectionKey, label: string, detail?: string) => void;
  deleteTreeItem: (section: TreeSectionKey, id: string) => void;
  toggleTreeItem: (section: TreeSectionKey, id: string) => void;
  updateTreeItem: (section: TreeSectionKey, id: string, patch: Partial<TreeItem>) => void;
};

export type TreeSectionKey = "have" | "refine" | "want" | "explore";

export type TreeItem = {
  id: string;
  label: string; // 标题
  detail?: string; // 详情说明
  hidden?: boolean; // 是否被隐藏
};

export type TreeData = {
  care: number; // 资料用心程度 %
  completeness: number; // 完成度 %
  comment: string; // 小天点评
  have: TreeItem[];
  refine: TreeItem[];
  want: TreeItem[];
  explore: TreeItem[];
};

const DEFAULT_TREE: TreeData = {
  care: 88,
  completeness: 82,
  comment:
    "整体资料很用心，人生画像已经比较立体。若把资产与心愿再补充一些细节，小天能帮你匹配到更契合的人和机会。",
  have: [
    { id: "h1", label: "技能", detail: "可用于交换、合作或创造价值的个人能力。" },
    { id: "h2", label: "经验", detail: "过去积累的经历、项目与解决问题的方法。" },
    { id: "h3", label: "资源", detail: "可被连接、共享或转化的现实资源。" },
    { id: "h4", label: "闲置物品", detail: "暂时不用但仍有交换价值的物品。" },
    { id: "h5", label: "人脉", detail: "可以互相介绍、协作和支持的人际连接。" },
    { id: "h6", label: "时间", detail: "可以投入陪伴、协作、学习或服务的时间。" },
    { id: "h7", label: "陪伴能力", detail: "倾听、支持和持续同行的能力。" },
    { id: "h8", label: "专业资质", detail: "证书、资格、专业背书或行业认可。" },
  ],
  refine: [
    { id: "r1", label: "资产 20 套", detail: "点进来补充位置、估值等细节。" },
    { id: "r2", label: "个人技能", detail: "把你的专业技能与作品补充上来。" },
  ],
  want: [
    { id: "w1", label: "成长指导", detail: "希望获得方向判断、经验建议或长期成长反馈。" },
    { id: "w2", label: "情绪陪伴", detail: "需要被倾听、理解、支持和稳定陪伴。" },
    { id: "w3", label: "技能学习", detail: "想找到课程、老师、搭子或练习机会。" },
    { id: "w4", label: "资源支持", detail: "需要资金、空间、设备、信息或渠道支持。" },
    { id: "w5", label: "合作伙伴", detail: "寻找能一起做事、共创项目的人。" },
    { id: "w6", label: "招聘或求职帮助", detail: "需要岗位、人选、内推或职业机会。" },
    { id: "w7", label: "生活服务", detail: "需要与日常生活相关的服务、照护或便利支持。" },
    { id: "w8", label: "兴趣交流", detail: "希望找到同频兴趣伙伴，一起交流和参与。" },
  ],
  explore: [
    { id: "e1", label: "新职业", detail: "探索新的职业方向、行业机会与可迁移能力。" },
    { id: "e2", label: "新技能", detail: "尝试学习能提升个人成长与资源交换能力的新技能。" },
    { id: "e3", label: "新城市", detail: "关注适合生活、工作、连接资源的新城市。" },
    { id: "e4", label: "新兴趣", detail: "发掘能带来能量、社交和长期投入感的新兴趣。" },
    { id: "e5", label: "创业项目", detail: "观察值得验证的小项目、合作机会和商业灵感。" },
    { id: "e6", label: "社会议题", detail: "关注与个人价值观相关、值得参与或贡献的公共议题。" },
  ],
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      persona: null,
      setPersona: (persona) => set({ persona }),
      growthBonus: 0,
      vitalityBonus: 0,
      bridgeCompletions: 0,
      growthLogs: [],
      completeBridgeGrowth: () =>
        set((s) => ({
          growthBonus: s.growthBonus + 20,
          vitalityBonus: s.vitalityBonus + 10,
          bridgeCompletions: s.bridgeCompletions + 1,
          growthLogs: [
            {
              id: `bridge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              title: "完成一次桥约闭环",
              date: "刚刚",
              delta: 20,
            },
            ...s.growthLogs,
          ],
        })),
      myPosts: [],
      addPost: (p) => set((s) => ({ myPosts: [{ status: "published", matchClosed: false, publicDisplay: true, discoveryVisible: true, ...p }, ...s.myPosts] })),
      updatePostStatus: (id, patch) => set((s) => ({ myPosts: s.myPosts.map((post) => post.id === id ? { ...post, ...patch } : post) })),
      findMyPost: (id) => get().myPosts.find((x) => x.id === id),
      tree: DEFAULT_TREE,
      setTree: (tree) => set({ tree }),
      reDiagnose: () =>
        set((s) => {
          const jitter = () =>
            Math.min(99, Math.max(78, Math.round(80 + Math.random() * 18)));
          return { tree: { ...s.tree, care: jitter(), completeness: jitter() } };
        }),
      addTreeItem: (section, label, detail = "") =>
        set((s) => ({
          tree: {
            ...s.tree,
            [section]: [
              ...s.tree[section],
              {
                id: `${section}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                label,
                detail,
              },
            ],
          },
        })),
      deleteTreeItem: (section, id) =>
        set((s) => ({
          tree: {
            ...s.tree,
            [section]: s.tree[section].filter((it) => it.id !== id),
          },
        })),
      toggleTreeItem: (section, id) =>
        set((s) => ({
          tree: {
            ...s.tree,
            [section]: s.tree[section].map((it) =>
              it.id === id ? { ...it, hidden: !it.hidden } : it,
            ),
          },
        })),
      updateTreeItem: (section, id, patch) =>
        set((s) => ({
          tree: {
            ...s.tree,
            [section]: s.tree[section].map((it) =>
              it.id === id ? { ...it, ...patch } : it,
            ),
          },
        })),
    }),
    {
      name: "tsq-profile",
      partialize: (state) => ({
        persona: state.persona,
        growthBonus: state.growthBonus,
        vitalityBonus: state.vitalityBonus,
        bridgeCompletions: state.bridgeCompletions,
        growthLogs: state.growthLogs,
        myPosts: state.myPosts,
        tree: state.tree,
      }),
    },
  ),
);
