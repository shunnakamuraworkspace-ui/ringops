"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { OpsHeader, StatusMark } from "@/components/ops-ui";
import { CandidateSaveButton } from "./candidate-save-button";
import { divisions, type BoxerPreview } from "../data/preview-boxers";

type Props = {
  boxers: BoxerPreview[];
  databaseConnected: boolean;
  industryMode: boolean;
  initialDivision?: string;
  initialClass?: string;
  initialRounds?: string;
  initialStance?: string;
  initialMinWeight?: string;
  initialMaxWeight?: string;
  initialMinBouts?: string;
  initialMaxBouts?: string;
};

export function BoxerDirectory({
  boxers,
  databaseConnected,
  industryMode,
  initialDivision,
  initialClass,
  initialRounds,
  initialStance,
  initialMinWeight,
  initialMaxWeight,
}: Props) {
  const [q, setQ] = useState("");
  const [division, setDivision] = useState(initialDivision && divisions.includes(initialDivision) ? initialDivision : "すべて");
  const [klass, setKlass] = useState(initialClass && ["A級", "B級", "C級"].includes(initialClass) ? initialClass : "すべて");
  const [status, setStatus] = useState(industryMode ? "相談可" : "すべて");
  const [month, setMonth] = useState("");
  const [targetWeight, setTargetWeight] = useState(initialTargetWeight(initialMinWeight, initialMaxWeight));
  const [stance, setStance] = useState(initialStance && ["右", "左"].includes(initialStance) ? initialStance : "すべて");
  const [rounds, setRounds] = useState(normalizeRounds(initialRounds));
  const [moreOpen, setMoreOpen] = useState(Boolean(initialRounds || initialStance));
  const [sort, setSort] = useState(industryMode ? "受付優先" : "ランキング上位");

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const weight = targetWeight ? Number(targetWeight) : null;
    const list = boxers.filter((boxer) => {
      const queryOk = !text || [boxer.name, boxer.kana, boxer.gym, boxer.division].some((value) => value.toLowerCase().includes(text));
      const statusOk = !industryMode || status === "すべて" || (status === "相談可" ? boxer.status !== "受付停止" : boxer.status === status);
      const monthOk = !industryMode || !month || Boolean(boxer.availableMonth && boxer.availableMonth <= month);
      const weightOk = !industryMode || weight === null || (boxer.minWeight > 0 && boxer.maxWeight > 0 && boxer.minWeight <= weight && boxer.maxWeight >= weight);
      const roundsOk = !industryMode || rounds === "すべて" || boxer.rounds.includes(Number(rounds));
      return queryOk
        && (division === "すべて" || boxer.division === division)
        && (klass === "すべて" || boxer.boxerClass === klass)
        && (stance === "すべて" || boxer.stance === stance)
        && statusOk && monthOk && weightOk && roundsOk;
    });
    return [...list].sort((a, b) => compareBoxers(a, b, sort, industryMode));
  }, [boxers, q, division, klass, status, month, targetWeight, stance, rounds, sort, industryMode]);

  const activeCount = [q, division !== "すべて", klass !== "すべて", industryMode && status !== "相談可", month, targetWeight, stance !== "すべて", rounds !== "すべて"].filter(Boolean).length;

  function reset() {
    setQ("");
    setDivision("すべて");
    setKlass("すべて");
    setStatus(industryMode ? "相談可" : "すべて");
    setMonth("");
    setTargetWeight("");
    setStance("すべて");
    setRounds("すべて");
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-8 lg:px-7">
      <OpsHeader
        title="選手を探す"
        description="階級・時期・契約条件から、今相談できる選手を探します。"
        meta={<span>{filtered.length} / {boxers.length} 名</span>}
      />

      <section className="border-b border-[var(--ringops-line-strong)] bg-white">
        <div className="grid gap-0 lg:grid-cols-[minmax(260px,1.4fr)_repeat(5,minmax(110px,.7fr))]">
          <label className="border-b border-[var(--ringops-line)] p-3 lg:border-b-0 lg:border-r">
            <span className="ops-label mb-1.5 block">選手 / ジム</span>
            <input className="input" value={q} onChange={(event) => setQ(event.target.value)} placeholder="名前または所属ジム" />
          </label>
          <FilterCell label="階級"><select className="input" value={division} onChange={(event) => setDivision(event.target.value)}><option>すべて</option>{divisions.map((value) => <option key={value}>{value}</option>)}</select></FilterCell>
          <FilterCell label="クラス"><select className="input" value={klass} onChange={(event) => setKlass(event.target.value)}>{["すべて", "A級", "B級", "C級"].map((value) => <option key={value}>{value}</option>)}</select></FilterCell>
          {industryMode ? <FilterCell label="受付"><select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>{["相談可", "受付中", "条件次第", "受付停止", "すべて"].map((value) => <option key={value}>{value}</option>)}</select></FilterCell> : <div className="hidden lg:block" />}
          {industryMode ? <FilterCell label="試合可能月"><input className="input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></FilterCell> : <div className="hidden lg:block" />}
          {industryMode ? <FilterCell label="契約kg"><input className="input" inputMode="decimal" type="number" min="35" max="150" step="0.1" value={targetWeight} onChange={(event) => setTargetWeight(event.target.value)} placeholder="55.0" /></FilterCell> : <div className="hidden lg:block" />}
        </div>
        <div className="flex min-h-11 flex-wrap items-center gap-3 border-t border-[var(--ringops-line)] px-3 py-2">
          <button className="text-[11px] font-black text-[var(--ringops-accent)]" onClick={() => setMoreOpen((value) => !value)} type="button">{moreOpen ? "− 追加条件を閉じる" : "+ 条件を追加"}</button>
          {moreOpen ? <>
            <span className="h-5 w-px bg-[var(--ringops-line)]" />
            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500">構え <select className="h-8 border border-[var(--ringops-line-strong)] bg-white px-2 text-[11px] font-bold" value={stance} onChange={(event) => setStance(event.target.value)}>{["すべて", "右", "左"].map((value) => <option key={value}>{value}</option>)}</select></label>
            {industryMode ? <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500">希望R <select className="h-8 border border-[var(--ringops-line-strong)] bg-white px-2 text-[11px] font-bold" value={rounds} onChange={(event) => setRounds(event.target.value)}>{["すべて", "4", "6", "8", "10", "12"].map((value) => <option key={value} value={value}>{/^\d+$/.test(value) ? `${value}R` : value}</option>)}</select></label> : null}
          </> : null}
          {activeCount > 0 ? <button className="ml-auto text-[10px] font-bold text-slate-400 underline underline-offset-4 hover:text-slate-700" onClick={reset} type="button">条件をクリア</button> : null}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 py-3">
        <p className="text-[11px] font-bold text-slate-500"><b className="text-[var(--ringops-ink)]">{filtered.length}名</b> が条件に一致</p>
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400">並び順<select className="h-8 border border-[var(--ringops-line)] bg-white px-2 text-[11px] font-bold text-slate-700" value={sort} onChange={(event) => setSort(event.target.value)}>{(industryMode ? ["受付優先", "ランキング上位", "最終試合が新しい", "名前順"] : ["ランキング上位", "最終試合が新しい", "名前順"]).map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>

      {filtered.length === 0 ? (
        <div className="border-y border-[var(--ringops-line-strong)] bg-white px-5 py-14 text-center">
          <p className="font-black">該当する選手がいません</p>
          <p className="mt-2 text-sm text-slate-500">階級か契約ウェイトを広げてください。</p>
          <button className="ops-secondary mt-4" onClick={reset} type="button">条件をクリア</button>
        </div>
      ) : (
        <section className="ops-table">
          <div className="hidden grid-cols-[1.55fr_.8fr_.85fr_1.05fr_1.25fr_110px] gap-4 border-b border-[var(--ringops-line-strong)] bg-[#f8f8f5] px-4 py-2.5 text-[9px] font-black uppercase tracking-[.06em] text-slate-400 lg:grid">
            <span>選手</span><span>戦績</span><span>次戦</span><span>受付</span><span>条件</span><span className="text-right">操作</span>
          </div>
          {filtered.map((boxer) => (
            <article className="ops-row grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 px-3 py-3 lg:grid-cols-[1.55fr_.8fr_.85fr_1.05fr_1.25fr_110px] lg:items-center lg:gap-4 lg:px-4" key={boxer.id}>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <Link className="truncate text-[14px] font-black hover:text-[var(--ringops-accent)]" href={`/boxers/${boxer.id}`}>{boxer.name}</Link>
                  <span className="shrink-0 text-[9px] font-black text-slate-400">{boxer.division}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{boxer.gym}</p>
                <p className="mt-1 text-[10px] text-slate-400 lg:hidden">{boxer.boxerClass} · {boxer.stance}構え · {boxer.wins}-{boxer.losses}{boxer.draws ? `-${boxer.draws}` : ""}</p>
              </div>

              <div className="hidden lg:block"><p className="text-xs font-black">{boxer.wins}-{boxer.losses}{boxer.draws ? `-${boxer.draws}` : ""}</p><p className="mt-1 text-[10px] text-slate-400">{boxer.koWins}KO / {boxer.totalBouts}戦</p>{boxer.rankings[0] ? <p className="mt-1 text-[9px] font-bold text-[var(--ringops-accent)]">{formatRanking(boxer.rankings[0])}</p> : null}</div>
              <div className="hidden lg:block"><p className="text-[11px] font-bold">{boxer.nextBout ?? "未定"}</p><p className="mt-1 text-[9px] text-slate-400">最終 {boxer.lastBout}</p></div>
              <div className="col-start-1 row-start-2 lg:col-auto lg:row-auto">
                {industryMode ? <StatusMark label={boxer.status} tone={statusTone(boxer.status)} compact /> : <span className="text-[10px] text-slate-400">公開情報</span>}
                {industryMode ? <p className="mt-1 text-[10px] font-semibold text-slate-500">{boxer.available}</p> : null}
              </div>
              <div className="col-start-2 row-start-2 text-right lg:col-auto lg:row-auto lg:text-left">
                {industryMode ? <><p className="text-[11px] font-black">{contractLabel(boxer)}</p><p className="mt-1 text-[9px] text-slate-400">{boxer.rounds.length ? boxer.rounds.map((value) => `${value}R`).join(" / ") : "R要確認"}</p></> : null}
              </div>
              <div className="col-start-2 row-start-1 flex items-center justify-end gap-1.5 lg:col-auto lg:row-auto">
                {industryMode && boxer.status !== "受付停止" ? <Link className="ops-primary h-8 px-3" href={`/matchmaking/new?boxer=${boxer.id}`}>相談</Link> : <Link className="ops-secondary h-8 px-3" href={`/boxers/${boxer.id}`}>詳細</Link>}
                {industryMode ? <CandidateSaveButton boxerId={boxer.id} databaseConnected={databaseConnected} compact /> : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function FilterCell({ label, children }: { label: string; children: ReactNode }) {
  return <label className="border-b border-[var(--ringops-line)] p-3 lg:border-b-0 lg:border-r last:lg:border-r-0"><span className="ops-label mb-1.5 block">{label}</span>{children}</label>;
}

function statusTone(status: BoxerPreview["status"]): "open" | "conditional" | "paused" {
  if (status === "受付中") return "open";
  if (status === "条件次第") return "conditional";
  return "paused";
}

function normalizeRounds(value?: string) {
  if (!value) return "すべて";
  const normalized = value.replace("R", "");
  return ["4", "6", "8", "10", "12"].includes(normalized) ? normalized : "すべて";
}

function initialTargetWeight(min?: string, max?: string) {
  const minValue = min && Number.isFinite(Number(min)) ? Number(min) : null;
  const maxValue = max && Number.isFinite(Number(max)) ? Number(max) : null;
  if (minValue !== null && maxValue !== null) return ((minValue + maxValue) / 2).toFixed(1);
  if (minValue !== null) return String(minValue);
  if (maxValue !== null) return String(maxValue);
  return "";
}

function parseBoutDate(value: string) {
  const timestamp = new Date(`${value.replaceAll(".", "-")}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function bestRank(boxer: BoxerPreview) {
  const ranks = boxer.rankings.map((item) => item.rank).filter((value): value is number => value !== null);
  return ranks.length ? Math.min(...ranks) : 9999;
}

function compareBoxers(a: BoxerPreview, b: BoxerPreview, sort: string, industryMode: boolean) {
  if (sort === "受付優先" && industryMode) {
    const order: Record<BoxerPreview["status"], number> = { "受付中": 0, "条件次第": 1, "受付停止": 2 };
    return order[a.status] - order[b.status] || (a.availableMonth || "9999-99").localeCompare(b.availableMonth || "9999-99");
  }
  if (sort === "ランキング上位") return bestRank(a) - bestRank(b);
  if (sort === "最終試合が新しい") return parseBoutDate(b.lastBout) - parseBoutDate(a.lastBout);
  return a.name.localeCompare(b.name, "ja");
}

function formatRanking(item: { body: string; rank: number | null; title?: string }) {
  return `${item.body} ${item.rank ? `${item.rank}位` : item.title ?? ""}`.trim();
}

function contractLabel(boxer: BoxerPreview) {
  if (!boxer.minWeight || !boxer.maxWeight) return "契約kg 要確認";
  return `${boxer.minWeight.toFixed(1)}–${boxer.maxWeight.toFixed(1)}kg`;
}
