"use client";

import { toast } from "sonner";

const REPORT_REASONS = ["垃圾广告 / 营销", "涉嫌欺诈", "不实信息", "骚扰 / 辱骂", "其他"];

export function ReportSheet({ title = "举报这条内容", onClose }: { title?: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[var(--app-max-width)] items-end bg-black/40" onClick={onClose}>
      <div className="w-full rounded-t-3xl bg-white p-4 pb-8 shadow-[0_-18px_48px_rgba(0,0,0,.16)]" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-1 text-[16px] font-semibold text-[#20351d]">{title}</h3>
        <p className="mb-3 text-[13px] text-muted-foreground">请选择举报原因，我们会尽快核实处理。</p>
        <div className="space-y-1">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => { onClose(); toast("举报已提交，感谢你的反馈～"); }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[14px] active:bg-[color:var(--soft)]/50"
            >
              {reason}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 w-full rounded-full bg-[color:var(--soft)]/60 py-3 text-[14px] font-medium text-neutral-600">
          取消
        </button>
      </div>
    </div>
  );
}
