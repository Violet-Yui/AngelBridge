"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Gift, ImagePlus, MapPin, Mic, Send, ShieldCheck, Sparkles, Star, X, Zap } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { PageHeader } from "@/components/tsq/page-header";
import { useProfileStore, type MyPost, type PostFormField } from "@/stores/profile-store";
import { WorldLocationPicker } from "@/components/tsq/world-location-picker";
import { cn } from "@/utils/utils";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import { clearDashboardCache } from "@/hooks/use-dashboard";
import type { PetOrganizeDraft } from "@/lib/angelbridge-types";

type Kind = "green" | "warm" | "purple";
type Intent = "have" | "want";
type Tone = "green" | "blue" | "warm" | "purple" | "danger";
type FormFieldConfig = { key: string; label: string; icon: React.ReactNode; required?: boolean; placeholder: string; multiline?: boolean; tone: Tone };
type SubOption = { key: string; label: string; desc: string; kind: Kind; emoji: string; fields: FormFieldConfig[] };

const HAVE_FIELDS: FormFieldConfig[] = [
  { key: "provide", label: "我提供", required: true, icon: <Gift className="h-4 w-4" />, tone: "green", placeholder: "例如：周末工作室使用权（周六-周日 10:00-18:00）" },
  { key: "receive", label: "我获得", icon: <Star className="h-4 w-4" />, tone: "blue", placeholder: "例如：一组品牌照片（含基础修图）" },
  { key: "location", label: "地点", required: true, icon: <MapPin className="h-4 w-4" />, tone: "warm", placeholder: "例如：温州龙湾，确认后显示详细地址" },
  { key: "firstAction", label: "第一步行动", icon: <Zap className="h-4 w-4" />, tone: "purple", placeholder: "例如：今晚 20:00 前互发参考图，明天中午确认排期", multiline: true },
  { key: "standard", label: "完成标准", required: true, icon: <ShieldCheck className="h-4 w-4" />, tone: "green", placeholder: "例如：交付 12 张精选照片 + 3 张精修", multiline: true },
  { key: "exit", label: "退出方式", required: true, icon: <Sparkles className="h-4 w-4" />, tone: "danger", placeholder: "例如：如一方无法履约，需提前 24 小时告知", multiline: true },
  { key: "notes", label: "其他说明", icon: <Sparkles className="h-4 w-4" />, tone: "purple", placeholder: "例如：对时间、预算、沟通方式的补充说明", multiline: true },
];

const WANT_FIELDS: FormFieldConfig[] = [
  { key: "need", label: "我想要", required: true, icon: <Star className="h-4 w-4" />, tone: "blue", placeholder: "例如：一组品牌照片（含基础修图）" },
  { key: "offer", label: "我提供", icon: <Gift className="h-4 w-4" />, tone: "green", placeholder: "例如：周末工作室使用权 / 设计建议 / 预算 300 元" },
  { key: "location", label: "地点", required: true, icon: <MapPin className="h-4 w-4" />, tone: "warm", placeholder: "例如：温州龙湾 / 线上可完成" },
  { key: "firstAction", label: "第一步行动", icon: <Zap className="h-4 w-4" />, tone: "purple", placeholder: "例如：今晚 20:00 前互发样片，明天确认是否匹配", multiline: true },
  { key: "standard", label: "完成标准", icon: <ShieldCheck className="h-4 w-4" />, tone: "green", placeholder: "例如：交付 12 张精选照片 + 3 张精修", multiline: true },
  { key: "exit", label: "退出方式", required: true, icon: <Sparkles className="h-4 w-4" />, tone: "danger", placeholder: "例如：如一方无法履约，需提前 24 小时告知", multiline: true },
  { key: "notes", label: "其他说明", icon: <Sparkles className="h-4 w-4" />, tone: "purple", placeholder: "例如：对时间、预算、沟通方式的补充说明", multiline: true },
];

const HAVE_OPTIONS: SubOption[] = [
  { key: "rent-out", label: "出租物品", desc: "闲置物品对外出租", kind: "warm", emoji: "🏠", fields: HAVE_FIELDS },
  { key: "swap-skill", label: "交换技能", desc: "用技能换技能/资源", kind: "green", emoji: "🤝", fields: HAVE_FIELDS },
  { key: "hire", label: "招聘工作人员", desc: "发布岗位招募", kind: "purple", emoji: "💼", fields: HAVE_FIELDS },
  { key: "give-idle", label: "转让闲置", desc: "闲置物品出手", kind: "warm", emoji: "♻️", fields: HAVE_FIELDS },
  { key: "share-exp", label: "分享经验", desc: "输出攻略与心得", kind: "green", emoji: "🧭", fields: HAVE_FIELDS },
];

const WANT_OPTIONS: SubOption[] = [
  { key: "find-people", label: "找人", desc: "找伙伴 / 搭子 / 合作", kind: "green", emoji: "🧑‍🤝‍🧑", fields: WANT_FIELDS },
  { key: "find-things", label: "找物", desc: "想找的物品 / 资源", kind: "warm", emoji: "🎁", fields: WANT_FIELDS },
  { key: "find-job", label: "找工作", desc: "求职 / 找机会", kind: "purple", emoji: "🔍", fields: WANT_FIELDS },
  { key: "find-place", label: "租场地", desc: "找场地 / 找房", kind: "warm", emoji: "📍", fields: WANT_FIELDS },
  { key: "find-exp", label: "找经验", desc: "求攻略 / 求指点", kind: "green", emoji: "📚", fields: WANT_FIELDS },
];

const KIND_TAG: Record<Kind, string> = { green: "border-[color:var(--primary)] bg-[color:var(--soft)] text-[color:var(--deep)]", warm: "border-[#f3d59a] bg-[#fff4d9] text-[#bd7c10]", purple: "border-[#cfc2f2] bg-[#eee8ff] text-[color:var(--purple)]" };
const TONE: Record<Tone, string> = { green: "bg-[#eaf8ee] text-[#27a35b]", blue: "bg-[#edf4ff] text-[#3778ff]", warm: "bg-[#fff4df] text-[#ff9e36]", purple: "bg-[#f1e9ff] text-[#8b5cf6]", danger: "bg-[#fff0ef] text-[#ff6868]" };

export function CreateScreen() {
  const router = useRouter();
  const search = useSearchParams();
  const addPost = useProfileStore((s) => s.addPost);
  const [intent, setIntent] = useState<Intent>("have");
  const options = intent === "have" ? HAVE_OPTIONS : WANT_OPTIONS;
  const [subKey, setSubKey] = useState(HAVE_OPTIONS[0].key);
  const current = useMemo(() => options.find((o) => o.key === subKey) ?? options[0], [options, subKey]);
  const fields = current.fields;
  const [values, setValues] = useState<Record<string, string>>({});
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<MyPost | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canPublish = fields.filter((f) => f.required).every((f) => values[f.key]?.trim());

  useEffect(() => {
    if (search.get("source") !== "xiaotian") return;
    const raw = sessionStorage.getItem("xiaotian-create-draft");
    if (!raw) return;
    const organized = JSON.parse(raw) as PetOrganizeDraft;
    const first = organized.nodes.find((node) => node.role === "offer" || node.role === "need");
    const nextIntent: Intent = first?.role === "need" ? "want" : "have";
    const keyByDomain: Record<string, string> = nextIntent === "have"
      ? { space: "rent-out", skill: "swap-skill", opportunity: "hire", item: "give-idle", growth: "share-exp", service: "swap-skill" }
      : { service: "find-people", item: "find-things", opportunity: "find-job", space: "find-place", growth: "find-exp", skill: "find-exp" };
    const selected = organized.nodes.find((node) => node.role === (nextIntent === "have" ? "offer" : "need")) ?? first;
    const nextKey = selected ? keyByDomain[selected.domain] : undefined;
    setIntent(nextIntent);
    if (nextKey) setSubKey(nextKey);
    const offer = organized.nodes.find((node) => node.role === "offer")?.text ?? "";
    const need = organized.nodes.find((node) => node.role === "need")?.text ?? "";
    const constraints = [...organized.constraints, ...organized.nodes.filter((node) => node.role === "constraint").map((node) => node.text)];
    const location = constraints.find((value) => /地点|北京|上海|广州|深圳|区|市/.test(value)) ?? "";
    const firstAction = constraints.find((value) => /周末|时间|点|先|开始/.test(value)) ?? "";
    setValues({
      ...(nextIntent === "have" ? { provide: offer, receive: need } : { need, offer }),
      ...(location ? { location } : {}),
      ...(firstAction ? { firstAction } : {}),
    });
    sessionStorage.removeItem("xiaotian-create-draft");
  }, [search]);

  function switchIntent(next: Intent) { setIntent(next); setSubKey((next === "have" ? HAVE_OPTIONS : WANT_OPTIONS)[0].key); setValues({}); }
  function setField(key: string, value: string) { setValues((cur) => ({ ...cur, [key]: value })); }
  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) { const list = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/")); setImageFiles((cur) => [...cur, ...list].slice(0, 6)); setImages((cur) => [...cur, ...list.slice(0, 6).map((f) => URL.createObjectURL(f))].slice(0, 6)); e.target.value = ""; }
  function toggleVoice() { if (recording) return setRecording(false); setRecording(true); toast("正在聆听…（示例）"); setTimeout(() => { setRecording(false); const first = fields.find((f) => f.required)?.key ?? fields[0].key; setField(first, `${values[first] ? values[first] + " " : ""}我想尽快促成这件事，欢迎私信我～`); toast("已转成文字"); }, 1200); }
  async function publish() {
    if (!canPublish) return;
    setPublishing(true);
    const formFields: PostFormField[] = fields.map((f) => ({ key: f.key, label: f.label, value: values[f.key]?.trim() ?? "", required: f.required })).filter((f) => f.value || f.required);
    const get = (key: string) => formFields.find((f) => f.key === key)?.value.trim();
    const cleanSentenceValue = (value: string | undefined) => value?.replace(/[。．.!！?？;；，,\s]+$/u, "").trim();
    const main = formFields.find((f) => f.required && f.value) ?? formFields[0];
    const title = main?.value ? main.value.slice(0, 22) + (main.value.length > 22 ? "…" : "") : current.label;
    const needOrReceive = cleanSentenceValue(get("need") || get("receive"));
    const provideOrOffer = cleanSentenceValue(get("provide") || get("offer"));
    const location = cleanSentenceValue(get("location"));
    const firstAction = cleanSentenceValue(get("firstAction"));
    const standard = cleanSentenceValue(get("standard"));
    const exit = cleanSentenceValue(get("exit"));
    const notes = cleanSentenceValue(get("notes"));
    const text = [
      intent === "have"
        ? `我这里可以提供${provideOrOffer || current.label}${needOrReceive ? `，希望换到${needOrReceive}` : ""}${location ? `，地点在${location}` : ""}。`
        : `我想寻找${needOrReceive || current.label}${provideOrOffer ? `，我可以提供${provideOrOffer}作为交换` : ""}${location ? `，希望在${location}附近完成` : ""}。`,
      firstAction ? `可以先从「${firstAction}」开始沟通。` : "",
      standard ? `我期待的完成标准是：${standard}。` : "",
      exit ? `如果中途不合适，退出方式是：${exit}。` : "",
      notes ? `补充说明：${notes}` : "",
    ].filter(Boolean).join("\n");
    try {
      const attachments = await Promise.all(imageFiles.map((file) => angelbridgeApi.uploadImage(file)));
      const domainByChannel: Record<string, string> = {
        "rent-out": "space", "swap-skill": "skill", hire: "opportunity",
        "give-idle": "item", "share-exp": "growth", "find-people": "service",
        "find-things": "item", "find-job": "opportunity", "find-place": "space", "find-exp": "growth",
      };
      const categoryByChannel: Record<string, string> = {
        "rent-out": "space", "swap-skill": "skills", hire: "jobs", "give-idle": "idle",
        "share-exp": "experience", "find-people": "people", "find-things": "items",
        "find-job": "jobs", "find-place": "space", "find-exp": "experience",
      };
      const makeValue = (value: string, withImages: boolean) => ({
        domain: domainByChannel[current.key] ?? "service",
        title: value.slice(0, 80),
        description: value,
        keywords: [current.label, ...value.split(/[，。；、\s]+/).filter(Boolean).slice(0, 4)],
        deliverables: standard ? [standard] : [],
        visibility: "match_only",
        images: withImages ? attachments : [],
      });
      const offers = provideOrOffer ? [makeValue(provideOrOffer, intent === "have")] : [];
      const needs = needOrReceive ? [makeValue(needOrReceive, intent === "want")] : [];
      const created = await angelbridgeApi.createPublication({
        category: categoryByChannel[current.key] ?? "other",
        kind: offers.length > 0 && needs.length > 0 ? "exchange" : intent === "have" ? "offer" : "need",
        bio: text,
        offers,
        needs,
        goals: [],
        acceptedExchangeModes: offers.length > 0 && needs.length > 0 ? ["barter", "collaboration"] : ["money", "collaboration"],
        constraints: { locations: location ? [location] : [], availability: [] },
        disclosurePolicy: {
          matchLocationPrecision: "region",
          contactDisclosure: "after_mutual_consent",
          exactLocationDisclosure: "after_pact_active",
        },
        proposedPactTerms: firstAction && standard && exit ? { firstAction, completionCriteria: standard, exitRule: exit, otherNotes: notes ?? "" } : null,
      });
      await angelbridgeApi.publishPublication(created.publicationId);
      await angelbridgeApi.runPublicationMatching(created.publicationId);
      clearDashboardCache();
      const post: MyPost = { id: created.publicationId, intent, channelKey: current.key, channelLabel: current.label, kind: current.kind, emoji: current.emoji, title: created.title, text: created.content, formFields, images, place: intent === "have" ? "我发布 · 我拥有" : "我发布 · 我想要", time: "刚刚", likes: 0, favorites: 0, comments: [] };
      addPost(post); setPublished(post); setValues({}); setImages([]); setImageFiles([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发布失败");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="发布帖子" subtitle="逐项填写桥约信息，让匹配双方一眼看懂条件" />
      <div className="tsq-page-pad space-y-5 pt-4">
        <div className="flex gap-2">{(["have", "want"] as const).map((key) => <button key={key} onClick={() => switchIntent(key)} className={cn("flex-1 rounded-full py-2.5 text-sm active:scale-95", intent === key ? "bg-[color:var(--primary)] font-semibold text-white shadow-[0_6px_16px_rgba(88,169,66,0.28)]" : "border border-[color:var(--border)] bg-white text-neutral-600")}>{key === "have" ? "我拥有" : "我想要"}</button>)}</div>
        <section><h2 className="mb-2.5 text-[15px] font-semibold">{intent === "have" ? "选择你要提供的类型" : "选择你想寻找的类型"}</h2><div className="tsq-card-gap grid grid-cols-2 min-[390px]:grid-cols-3">{options.map((o) => <button key={o.key} onClick={() => { setSubKey(o.key); setValues({}); }} className={cn("rounded-2xl border p-3 text-left transition active:scale-95", subKey === o.key ? KIND_TAG[o.kind] : "border-[color:var(--border)] bg-white text-neutral-700")}><p className="text-[15px] font-semibold"><span className="mr-1">{o.emoji}</span>{o.label}</p><p className="mt-1 text-[12px] leading-snug opacity-80">{o.desc}</p></button>)}</div></section>
        <section className="rounded-[28px] bg-white/78 p-3 shadow-[0_12px_32px_rgba(55,95,42,0.08)] ring-1 ring-white/70"><div className="mb-3 px-1"><h2 className="text-[15px] font-black text-[#20351d]">填写桥约表单</h2><p className="mt-0.5 text-[12px] text-[#6b7b66]">带 * 的项目为必填，发布后会直接展示在帖子详情里。</p></div><div className="divide-y divide-[#edf1e9] overflow-hidden rounded-[22px] bg-white">{fields.map((field) => <FormRow key={`${current.key}-${field.key}`} field={field} value={values[field.key] ?? ""} onChange={(value) => setField(field.key, value)} />)}</div></section>
        {images.length > 0 && <div className="grid grid-cols-4 gap-2">{images.map((src, i) => <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-[color:var(--border)]"><img src={src} alt="" className="h-full w-full object-cover" /><button onClick={() => { setImages((cur) => cur.filter((_, idx) => idx !== i)); setImageFiles((cur) => cur.filter((_, idx) => idx !== i)); }} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/55 text-white" aria-label="移除"><X className="h-3 w-3" /></button></div>)}</div>}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickImages} />
        <div className="flex flex-wrap gap-2"><ToolBtn icon={<ImagePlus className="h-4 w-4" />} label="上传照片" onClick={() => fileRef.current?.click()} /><ToolBtn icon={<Mic className="h-4 w-4" />} label={recording ? "聆听中…" : "语音输入"} active={recording} onClick={toggleVoice} /></div>
        <button onClick={publish} disabled={!canPublish || publishing} className={cn("flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[16px] font-semibold transition active:scale-[0.98]", canPublish && !publishing ? "bg-[color:var(--primary)] text-white shadow-[0_8px_18px_rgba(88,169,66,0.32)]" : "cursor-not-allowed bg-[#d9ddd3] text-white/80")}><Send className="h-4.5 w-4.5" /> {publishing ? "小天整理并发布中…" : "发布"}</button>
      </div>
      {published && <div className="fixed inset-0 z-50 mx-auto flex max-w-[var(--app-max-width)] items-center justify-center bg-black/40 px-6"><div className="w-full rounded-3xl bg-white p-6 text-center shadow-xl"><button onClick={() => setPublished(null)} aria-label="关闭" className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 active:scale-90"><X className="h-5 w-5" /></button><span className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full bg-[color:var(--soft)] text-[color:var(--deep)]"><CheckCircle2 className="h-8 w-8" /></span><h3 className="text-[18px] font-bold">发布成功 🌱</h3><p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">你的「{published.channelLabel}」表单帖已发布，并收进了你的个人主页。</p><div className="mt-5 flex gap-2.5"><button onClick={() => setPublished(null)} className="flex-1 rounded-full border border-[color:var(--border)] bg-white py-3 text-[15px] font-semibold text-neutral-600 active:scale-95">继续编辑</button><button onClick={() => router.push(`/discover/${published.id}`)} className="flex-1 rounded-full bg-[color:var(--primary)] py-3 text-[15px] font-semibold text-white active:scale-95">查看详情</button></div></div></div>}
    </AppShell>
  );
}

function FormRow({ field, value, onChange }: { field: FormFieldConfig; value: string; onChange: (value: string) => void }) {
  const isAddress = field.key === "location";
  return <label className="flex gap-3 p-3"><span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full", TONE[field.tone])}>{field.icon}</span><span className="min-w-0 flex-1"><span className="mb-1 flex items-center gap-1 text-[14px] font-black text-[#20351d]">{field.label}{field.required && <em className="not-italic text-[#ff6868]">*</em>}</span>{isAddress ? <WorldLocationPicker value={value} onChange={onChange} includeSpecial /> : field.multiline ? <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-[#20351d] outline-none placeholder:text-[#8a9785]" /> : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className="w-full bg-transparent text-[13px] text-[#20351d] outline-none placeholder:text-[#8a9785]" />}</span></label>;
}


function ToolBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={cn("flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium active:scale-95", active ? "border-[color:var(--warm)] bg-[#fff4d9] text-[#bd7c10]" : "border-[color:var(--border)] bg-white text-neutral-600")}>{icon}{label}</button>;
}
