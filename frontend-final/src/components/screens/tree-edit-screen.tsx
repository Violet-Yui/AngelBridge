"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useProfileStore,
  type TreeSectionKey,
  type TreeItem,
  type TreeData,
} from "@/stores/profile-store";
import { cn } from "@/utils/utils";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import type { LifeTreeRecord } from "@/lib/angelbridge-types";
import { clearDashboardCache } from "@/hooks/use-dashboard";

type SectionMeta = {
  key: TreeSectionKey;
  title: string;
  note: string;
  tone: "green" | "warm" | "purple";
};

const SECTIONS: SectionMeta[] = [
  {
    key: "have",
    title: "我拥有的",
    note: "小天根据你填写的资料整理，不准确的可以点击隐藏。",
    tone: "green",
  },
  {
    key: "want",
    title: "我需要的（我的心愿）",
    note: "小天根据你的资料整理，不准确的可以点击隐藏。",
    tone: "purple",
  },
  {
    key: "explore",
    title: "我想探索的",
    note: "生成的方向仅供参考，点进详情页可继续完善。",
    tone: "green",
  },
];

const toneChip: Record<SectionMeta["tone"], string> = {
  green: "bg-[#e8f4e0] text-[#4c8a37]",
  warm: "bg-[#fdeede] text-[#bd7c10]",
  purple: "bg-[#eee8ff] text-[color:var(--purple)]",
};

const EXPLORE_PRESETS = ["新职业", "新技能", "新城市", "新兴趣", "创业项目", "社会议题"];
const HAVE_PRESETS = ["技能", "经验", "资源", "闲置物品", "人脉", "时间", "陪伴能力", "专业资质"];
const WANT_PRESETS = ["成长指导", "情绪陪伴", "技能学习", "资源支持", "合作伙伴", "招聘或求职帮助", "生活服务", "兴趣交流"];

function presetList(section: TreeSectionKey) {
  if (section === "have") return HAVE_PRESETS;
  if (section === "want") return WANT_PRESETS;
  if (section === "explore") return EXPLORE_PRESETS;
  return [];
}

function toTreeData(record: LifeTreeRecord | null): TreeData {
  const items = (tags: LifeTreeRecord["offers"], prefix: string): TreeItem[] =>
    tags.map((tag, index) => ({
      id: `${prefix}-${index}-${tag.label}`,
      label: tag.label,
      hidden: !tag.visible,
    }));
  return {
    care: record?.diagnosis?.matchClarity ?? 0,
    completeness: record?.diagnosis?.completeness ?? 0,
    comment: record?.diagnosis?.review ?? "补充你的拥有、心愿和探索方向后，小天会给出整体诊断。",
    have: items(record?.offers ?? [], "have"),
    refine: [],
    want: items(record?.needs ?? [], "want"),
    explore: items(record?.explorations ?? [], "explore"),
  };
}

export function TreeEditScreen() {
  const searchParams = useSearchParams();
  const focusKey = searchParams.get("focus") as TreeSectionKey | null;
  const tree = useProfileStore((s) => s.tree);
  const setTree = useProfileStore((s) => s.setTree);
  const addTreeItem = useProfileStore((s) => s.addTreeItem);
  const deleteTreeItem = useProfileStore((s) => s.deleteTreeItem);
  const toggleTreeItem = useProfileStore((s) => s.toggleTreeItem);
  const updateTreeItem = useProfileStore((s) => s.updateTreeItem);
  const sectionRefs = useRef<Record<TreeSectionKey, HTMLElement | null>>({
    have: null,
    refine: null,
    want: null,
    explore: null,
  });

  const [diagnosing, setDiagnosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{
    section: TreeSectionKey;
    item: TreeItem;
  } | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftDetail, setDraftDetail] = useState("");
  const [newDrafts, setNewDrafts] = useState<Record<TreeSectionKey, string>>({
    have: "",
    refine: "",
    want: "",
    explore: "",
  });

  useEffect(() => {
    if (!focusKey || !sectionRefs.current[focusKey]) return;
    window.setTimeout(() => {
      sectionRefs.current[focusKey]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, [focusKey]);

  useEffect(() => {
    void angelbridgeApi.getLifeTree().then((record) => {
      setTree(toTreeData(record));
    }).catch((error) => toast.error(error instanceof Error ? error.message : "人生树读取失败"));
  }, [setTree]);

  function treeInput() {
    return {
      offers: tree.have.map((item) => ({ label: item.label, visible: !item.hidden })),
      needs: tree.want.map((item) => ({ label: item.label, visible: !item.hidden })),
      explorations: tree.explore.map((item) => ({ label: item.label, visible: !item.hidden })),
    };
  }

  async function saveTree() {
    setSaving(true);
    try {
      const record = await angelbridgeApi.saveLifeTree(treeInput());
      setTree(toTreeData(record));
      clearDashboardCache();
      toast.success("人生树已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function onReDiagnose() {
    if (diagnosing) return;
    setDiagnosing(true);
    toast("小天正在重新评估你的资料…");
    try {
      await angelbridgeApi.saveLifeTree(treeInput());
      const record = await angelbridgeApi.diagnoseLifeTree();
      setTree(toTreeData(record));
      clearDashboardCache();
      toast.success("已重新诊断，指标已更新");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "诊断失败");
    } finally {
      setDiagnosing(false);
    }
  }

  function openEditor(section: TreeSectionKey, item: TreeItem) {
    setEditing({ section, item });
    setDraftLabel(item.label);
    setDraftDetail(item.detail ?? "");
  }

  function saveEditor() {
    if (!editing) return;
    updateTreeItem(editing.section, editing.item.id, {
      label: draftLabel.trim() || editing.item.label,
      detail: draftDetail.trim(),
    });
    setEditing(null);
    toast.success("已保存");
  }

  function addItem(section: TreeSectionKey) {
    const label = newDrafts[section].trim();
    if (!label) return;
    addTreeItem(section, label);
    setNewDrafts((prev) => ({ ...prev, [section]: "" }));
    toast.success("已添加标签");
  }

  function removeItem(section: TreeSectionKey, item: TreeItem) {
    deleteTreeItem(section, item.id);
    toast.success(`已删除「${item.label}」`);
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-canvas)] pb-10">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[color:var(--border)] bg-white/90 px-3 pb-3 pt-6 backdrop-blur">
        <Link
          href="/"
          aria-label="返回"
          className="grid h-9 w-9 place-items-center rounded-full active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-[17px] font-bold">编辑人生树</h1>
        <button
          onClick={() => void saveTree()}
          disabled={saving}
          className="rounded-full bg-[color:var(--primary)] px-4 py-1.5 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(88,169,66,.24)] active:scale-95"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </header>

      {/* 诊断行 */}
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--primary)]" />
          小天 AI 全局诊断分析生成
        </p>
        <button
          onClick={onReDiagnose}
          disabled={diagnosing}
          className="flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-[13px] font-medium text-[color:var(--deep)] active:scale-95 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", diagnosing && "animate-spin")} />
          重新诊断
        </button>
      </div>

      {/* 两个指标 */}
      <div className="mx-4 mt-3 grid grid-cols-2 overflow-hidden rounded-[20px] glass-card">
        <div className="border-r border-[#f0f1ec] py-4 text-center">
          <div className="text-3xl font-bold text-[color:var(--primary)]">{tree.care}%</div>
          <p className="mt-1 text-[12px] text-muted-foreground">匹配清晰度</p>
        </div>
        <div className="py-4 text-center">
          <div className="text-3xl font-bold text-[color:var(--warm)]">{tree.completeness}%</div>
          <p className="mt-1 text-[12px] text-muted-foreground">资料完整度</p>
        </div>
      </div>

      {/* 小天点评 */}
      <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-[18px] bg-[#f4faef] p-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-lg shadow-[var(--brand-shadow-sm)]">
          🌱
        </span>
        <p className="text-[13px] leading-relaxed text-[color:var(--deep)]">{tree.comment}</p>
      </div>

      {/* 四个板块 */}
      <div className="mt-4 space-y-5 px-4">
        {SECTIONS.map((sec) => {
          const items = tree[sec.key];
          return (
            <section
              key={sec.key}
              ref={(node) => { sectionRefs.current[sec.key] = node; }}
              className={cn(
                "scroll-mt-24 rounded-[22px] p-3 transition-all",
                focusKey === sec.key && "bg-white/72 shadow-[0_12px_28px_rgba(76,128,49,.12)] ring-1 ring-[color:var(--primary)]/35",
              )}
            >
              <h2 className="text-[16px] font-bold">{sec.title}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {sec.key === "explore"
                  ? "默认保留六类探索方向，也可以继续添加、删除或修改。"
                  : sec.key === "have"
                    ? "默认保留八类你可交换、可连接、可沉淀的资源，也可以继续添加、删除或修改。"
                    : sec.key === "want"
                      ? "默认保留八类你可以向外发起连接的需求，也可以继续添加、删除或修改。"
                      : focusKey === sec.key
                        ? "可在这里添加、删除、修改标签，也可以控制是否显示在首页。"
                        : sec.note}
              </p>
              {presetList(sec.key).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {presetList(sec.key).map((preset) => (
                    <span key={preset} className={cn(
                      "rounded-full bg-white/65 px-2.5 py-1 text-[11px] font-semibold ring-1",
                      sec.key === "want" ? "text-[color:var(--purple)] ring-[#e5ddff]" : "text-[#4c8a37] ring-[#dbeed0]",
                    )}>
                      {preset}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                      it.hidden
                        ? "border border-dashed border-[color:var(--border)] bg-white/60 text-muted-foreground line-through"
                        : toneChip[sec.tone],
                    )}
                  >
                    <button
                      onClick={() => openEditor(sec.key, it)}
                      className="flex items-center gap-1 active:opacity-70"
                    >
                      {it.label}
                      {!it.hidden && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                    </button>
                    <button
                      onClick={() => toggleTreeItem(sec.key, it.id)}
                      aria-label={it.hidden ? "恢复显示" : "隐藏"}
                      className="ml-0.5 active:scale-90"
                    >
                      {it.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => removeItem(sec.key, it)}
                      aria-label="删除标签"
                      className="ml-0.5 text-current/65 active:scale-90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-white/72 p-2 shadow-[var(--brand-shadow-sm)]">
                <input
                  value={newDrafts[sec.key]}
                  onChange={(e) => setNewDrafts((prev) => ({ ...prev, [sec.key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") addItem(sec.key); }}
                  placeholder={`添加${sec.title.replace(/[（）]/g, "")}标签`}
                  className="min-w-0 flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-neutral-400"
                />
                <button
                  onClick={() => addItem(sec.key)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--primary)] text-white active:scale-95"
                  aria-label="添加标签"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* 详情编辑弹窗 */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-[24px] bg-white p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-bold">编辑条目</h3>
              <button onClick={() => setEditing(null)} aria-label="关闭" className="active:scale-90">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[color:var(--deep)]">标题</label>
            <input
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[color:var(--border)] px-3.5 py-2.5 text-[15px] outline-none focus:border-[color:var(--primary)]"
            />
            <label className="mb-1.5 block text-[13px] font-semibold text-[color:var(--deep)]">详细说明</label>
            <textarea
              rows={3}
              value={draftDetail}
              onChange={(e) => setDraftDetail(e.target.value)}
              placeholder="补充更多细节，帮助小天更好地为你匹配"
              className="mb-5 w-full resize-none rounded-xl border border-[color:var(--border)] px-3.5 py-2.5 text-[14px] leading-relaxed outline-none focus:border-[color:var(--primary)]"
            />
            <button
              onClick={saveEditor}
              className="w-full rounded-full bg-[color:var(--primary)] py-3 text-[15px] font-bold text-white shadow-[0_10px_22px_rgba(88,169,66,.24)] active:scale-[.98]"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
