import type { ReactNode } from "react";

export function OpsHeader({
  title,
  description,
  meta,
  action,
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="ops-header">
      <div className="min-w-0">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <h1 className="ops-title">{title}</h1>
          {meta ? <div className="pb-0.5 text-[11px] font-bold text-[var(--ringops-muted)]">{meta}</div> : null}
        </div>
        {description ? <p className="ops-description">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function StatusMark({
  label,
  tone = "neutral",
  compact = false,
}: {
  label: string;
  tone?: "open" | "conditional" | "paused" | "negotiating" | "pending" | "confirmed" | "neutral";
  compact?: boolean;
}) {
  const toneClass = {
    open: "bg-emerald-500",
    conditional: "bg-amber-500",
    paused: "bg-slate-400",
    negotiating: "bg-sky-600",
    pending: "bg-amber-500",
    confirmed: "bg-emerald-700",
    neutral: "bg-slate-400",
  }[tone];

  return (
    <span className={`inline-flex items-center gap-2 font-bold text-slate-700 ${compact ? "text-[11px]" : "text-xs"}`}>
      <span className={`size-2 shrink-0 rounded-full ${toneClass}`} />
      {label}
    </span>
  );
}

export function StatusTrack({
  steps,
  current,
}: {
  steps: string[];
  current: string;
}) {
  const activeIndex = steps.indexOf(current);

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, index) => {
        const done = activeIndex >= 0 && index <= activeIndex;
        const active = index === activeIndex;
        return (
          <div key={step} className="min-w-0">
            <div className={`h-0.5 ${done ? "bg-[var(--ringops-accent)]" : "bg-[#dfe2e3]"}`} />
            <p className={`mt-1 truncate text-[9px] font-bold ${active ? "text-[var(--ringops-ink)]" : done ? "text-slate-500" : "text-slate-300"}`}>
              {step}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function BoutNumber({ value }: { value: number | string }) {
  const text = String(value).padStart(2, "0");
  return <span className="font-mono text-[28px] font-black leading-none tracking-[-0.06em] text-[#b7b9bb]">{text}</span>;
}

export function ContextPanel({
  title,
  kicker,
  children,
  footer,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <aside className="border-l border-[var(--ringops-line)] bg-[#fbfbfa] lg:sticky lg:top-16 lg:max-h-[calc(100vh-64px)] lg:overflow-y-auto">
      <div className="border-b border-[var(--ringops-line)] px-5 py-4">
        {kicker ? <p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{kicker}</p> : null}
        <h2 className="mt-1 text-base font-black tracking-tight text-[var(--ringops-ink)]">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
      {footer ? <div className="border-t border-[var(--ringops-line)] px-5 py-4">{footer}</div> : null}
    </aside>
  );
}

export function SectionRule({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {label ? <span className="shrink-0 text-[10px] font-black uppercase tracking-[.1em] text-slate-400">{label}</span> : null}
      <span className="h-px flex-1 bg-[var(--ringops-line)]" />
    </div>
  );
}
