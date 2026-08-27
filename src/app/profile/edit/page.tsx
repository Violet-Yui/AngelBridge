"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/tsq/app-shell";
import { tsqApi } from "@/lib/tsq/api";
import { ME } from "@/lib/tsq/data";
export default function ProfileEditPage() {
  const [name, setName] = useState<string>(ME.name); const [bio, setBio] = useState<string>("持续创造与连接"); const [saving, setSaving] = useState(false);
  async function save(e: React.FormEvent) { e.preventDefault(); setSaving(true); try { await tsqApi.updateProfile({ name, bio }); toast("资料已保存"); } finally { setSaving(false); } }
  return <AppShell><header className="flex items-center gap-3 px-4 pb-3 pt-2"><Link href="/me" aria-label="返回我的" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"><ArrowLeft className="h-4 w-4" /></Link><h1 className="text-[22px] font-bold">编辑资料</h1></header><form onSubmit={save} className="space-y-4 px-4"><label className="block rounded-2xl border border-[color:var(--border)] bg-white p-3"><span className="text-xs text-muted-foreground">昵称</span><input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full text-[16px] outline-none" /></label><label className="block rounded-2xl border border-[color:var(--border)] bg-white p-3"><span className="text-xs text-muted-foreground">个人简介</span><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-1 w-full resize-none text-[15px] leading-relaxed outline-none" /></label><button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3.5 font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "保存中…" : "保存资料"}</button></form></AppShell>;
}
