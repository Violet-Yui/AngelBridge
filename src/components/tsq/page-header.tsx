"use client";

// 内页统一顶部标题栏（桥约/消息/我/创建）
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header
      data-el="page-header"
      className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[color:var(--bg-canvas)]/90 px-4 pb-3 pt-1 backdrop-blur-md"
    >
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}
