import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { FlowShell } from "@/components/tsq/flow-shell";
import { getBridgeThreadId } from "@/lib/tsq/bridge-route";

export default async function BridgeResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const threadId = getBridgeThreadId(id);

  return (
    <FlowShell title="桥约已生效" right="none">
      <div className="flex min-h-[60dvh] flex-col items-center justify-center px-5 text-center">
        <CheckCircle2 className="h-16 w-16 text-[color:var(--primary)]" />
        <h1 className="mt-4 text-2xl font-bold">第一步已经约定好</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">双方会收到提醒，按约发送参考图后就可以继续推进。</p>
        <Link href={`/messages/${threadId ?? ''}`} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3.5 font-semibold text-white">
          <MessageCircle className="h-4 w-4" />去消息里沟通
        </Link>
        <Link href="/bridge" className="mt-3 text-sm text-[color:var(--deep)]">返回桥约列表</Link>
      </div>
    </FlowShell>
  );
}
