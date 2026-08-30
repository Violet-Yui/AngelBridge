"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, HeartHandshake, Leaf, Star, Trophy } from "lucide-react";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import type { Dashboard, MatchView, PactDetail } from "@/lib/angelbridge-types";

export default function BridgeCompletePage() {
  const matchId = useSearchParams().get("matchId") ?? "";
  const [pact, setPact] = useState<PactDetail | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [match, setMatch] = useState<MatchView | null>(null);

  useEffect(() => {
    if (!matchId) return;
    void Promise.all([angelbridgeApi.getPact(matchId), angelbridgeApi.getDashboard(), angelbridgeApi.getMatch(matchId)])
      .then(([pactDetail, dashboardDetail, matchDetail]) => { setPact(pactDetail); setDashboard(dashboardDetail); setMatch(matchDetail); });
  }, [matchId]);

  const growthEvent = dashboard?.recentGrowth.find((item) => item.matchId === matchId);

  return (
    <FlowShell title="互助完成" subtitle="人生树已记录这次成长" right="none">
      <section className="rounded-[26px] border border-[#cfecc7] bg-white/88 p-5 text-center shadow-[var(--brand-shadow-md)]">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-[#58A942] text-white shadow-[0_10px_24px_rgba(88,169,66,.28)]"><CheckCircle2 className="h-9 w-9" /></div>
        <h2 className="text-[22px] font-black text-[#071D3A]">桥约已完成 🌱</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#58708c]">小天已将这次互助沉淀到你的人生树：资源被真实使用，贡献也被记录下来。</p>
      </section>

      <section className="mt-4 rounded-[24px] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
        <div className="mb-3 flex items-center gap-2"><XiaotianAvatar size={42} /><div className="rounded-2xl rounded-tl-sm bg-[#f4faef] px-3 py-2 text-[13px] leading-relaxed text-[#24321f]">这次交换很顺利，我帮你更新了成长记录。</div></div>
        <div className="grid gap-2">
          <ResultLine icon={<Leaf className="h-4 w-4" />} label="人生树成长" value={`当前成长值 ${dashboard?.account.growthScore ?? "—"}`} />
          <ResultLine icon={<Trophy className="h-4 w-4" />} label="我方获得" value={match?.valueToYou[0] ?? "读取中"} />
          <ResultLine icon={<HeartHandshake className="h-4 w-4" />} label="我方提供" value={match?.valueToOther[0] ?? "读取中"} />
          <ResultLine icon={<HeartHandshake className="h-4 w-4" />} label="履约状态" value={pact?.status === "completed" ? "双方已确认完成" : "同步中"} />
          <ResultLine icon={<Star className="h-4 w-4" />} label="成长奖励" value={growthEvent ? `+${growthEvent.delta}` : "已记录"} />
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link href="/" className="rounded-full border border-[color:var(--primary)] bg-white py-3 text-center text-[14px] font-bold text-[color:var(--deep)] active:scale-[.98]">回到人生树</Link>
        <Link href="/bridge" className="rounded-full bg-[color:var(--primary)] py-3 text-center text-[14px] font-bold text-white shadow-[0_10px_22px_rgba(88,169,66,.24)] active:scale-[.98]">查看桥约记录</Link>
      </div>
    </FlowShell>
  );
}

function ResultLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2 rounded-2xl bg-[#f7fbf4] px-3 py-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e3f4d8] text-[#58A942]">{icon}</span><span className="flex-1 text-[13px] text-[#58708c]">{label}</span><b className="max-w-[58%] text-right text-[13px] text-[#071D3A]">{value}</b></div>;
}
