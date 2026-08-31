"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
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

const statusStyle: Record<BoxerPreview["status"], string> = {
  "受付中": "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  "条件次第": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  "受付停止": "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
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
  const [nextOpen, setNextOpen] = useState(false);
  const [rankedOnly, setRankedOnly] = useState(false);
  const [moreOpen, setMoreOpen] = useState(Boolean(initialRounds || initialStance));
  const [sort, setSort] = useState(industryMode ? "受付優先" : "ランキング上位");

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const weight = targetWeight ? Number(targetWeight) : null;
    const list = boxers.filter((boxer) => {
      const queryOk = !text || [boxer.name, boxer.kana, boxer.gym, boxer.prefecture, boxer.nationality, boxer.division]
        .some((value) => value.toLowerCase().includes(text));
      const statusOk = !industryMode || status === "すべて" || (status === "相談可" ? boxer.status !== "受付停止" : boxer.status === status);
      const monthOk = !industryMode || !month || Boolean(boxer.availableMonth && boxer.availableMonth <= month);
      const weightOk = !industryMode || weight === null || (boxer.minWeight > 0 && boxer.maxWeight > 0 && boxer.minWeight <= weight && boxer.maxWeight >= weight);
      const roundsOk = !industryMode || rounds === "すべて" || boxer.rounds.includes(Number(rounds));
      return queryOk
        && (division === "すべて" || boxer.division === division)
        && (klass === "すべて" || boxer.boxerClass === klass)
        && (stance === "すべて" || boxer.stance === stance)
        && statusOk
        && monthOk
        && weightOk
        && roundsOk
        && (!nextOpen || !boxer.nextBout)
        && (!rankedOnly || boxer.rankings.length > 0);
    });
    return [...list].sort((a, b) => compareBoxers(a, b, sort, industryMode));
  }, [boxers, q, division, klass, status, month, targetWeight, stance, rounds, nextOpen, rankedOnly, sort, industryMode]);

  const activeCount = [
    q,
    division !== "すべて",
    klass !== "すべて",
    industryMode && status !== "相談可",
    month,
    targetWeight,
    stance !== "すべて",
    rounds !== "すべて",
    nextOpen,
    rankedOnly,
  ].filter(Boolean).length;

  function reset() {
    setQ("");
    setDivision("すべて");
    setKlass("すべて");
    setStatus(industryMode ? "相談可" : "すべて");
    setMonth("");
    setTargetWeight("");
    setStance("すべて");
    setRounds("すべて");
    setNextOpen(false);
    setRankedOnly(false);
  }

  return <main className="mx-auto max-w-[1380px] px-4 py-5 lg:px-7">
    <section className="rounded-xl border border-[#e0e5ea] bg-white shadow-[0_1px_2px_rgba(15,23,42,.035)]">
      <div className="border-b border-[#edf0f2] p-4 sm:p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-600">選手・ジムを検索</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            <input className="input h-12 pl-9 text-[15px]" value={q} onChange={(event) => setQ(event.target.value)} placeholder="選手名、所属ジム" />
          </div>
        </label>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[1.3fr_.8fr_.9fr_1fr_.8fr]">
        <FilterSelect label="階級" value={division} onChange={setDivision} values={["すべて", ...divisions]} />
        <FilterSelect label="クラス" value={klass} onChange={setKlass} values={["すべて", "A級", "B級", "C級"]} />
        {industryMode ? <FilterSelect label="受付状況" value={status} onChange={setStatus} values={["相談可", "受付中", "条件次第", "受付停止", "すべて"]} /> : <div />}
        {industryMode ? <Field label="試合可能月"><input className="input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></Field> : <div />}
        {industryMode ? <Field label="契約kg"><div className="relative"><input className="input pr-9" inputMode="decimal" min="35" max="150" step="0.1" type="number" value={targetWeight} onChange={(event) => setTargetWeight(event.target.value)} placeholder="55.0" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">kg</span></div></Field> : <div />}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[#edf0f2] px-4 py-3 sm:px-5">
        <QuickButton active={industryMode && status === "受付中"} onClick={() => industryMode && setStatus(status === "受付中" ? "相談可" : "受付中")}>受付中だけ</QuickButton>
        <QuickButton active={nextOpen} onClick={() => setNextOpen((value) => !value)}>次戦未定</QuickButton>
        <QuickButton active={rankedOnly} onClick={() => setRankedOnly((value) => !value)}>ランカー</QuickButton>
        <button className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800" onClick={() => setMoreOpen((value) => !value)} type="button">{moreOpen ? "追加条件を閉じる" : "＋ 条件を追加"}</button>
        {activeCount > 0 && <button className="ml-auto rounded-lg px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-700" onClick={reset} type="button">条件をクリア</button>}
      </div>

      {moreOpen && <div className="grid gap-3 border-t border-[#edf0f2] bg-[#fafbfc] p-4 sm:grid-cols-2 sm:p-5 lg:max-w-xl">
        <FilterSelect label="構え" value={stance} onChange={setStance} values={["すべて", "右", "左"]} />
        {industryMode && <FilterSelect label="ラウンド" value={rounds} onChange={setRounds} values={["すべて", "4", "6", "8", "10", "12"]} render={(value) => /^\d+$/.test(value) ? `${value}R` : value} />}
      </div>}
    </section>

    <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-xl font-black tracking-tight text-slate-950">{filtered.length}名</h2><p className="mt-1 text-xs text-slate-500">条件に合う選手</p></div>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-500"><span>並び順</span><select className="h-9 rounded-lg border border-[#d5dbe1] bg-white px-3 text-xs font-bold text-slate-700 outline-none" value={sort} onChange={(event) => setSort(event.target.value)}>{(industryMode ? ["受付優先", "ランキング上位", "最終試合が新しい", "名前順"] : ["ランキング上位", "最終試合が新しい", "名前順"]).map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>

    {filtered.length === 0 ? <section className="mt-3 rounded-xl border border-[#e0e5ea] bg-white px-5 py-14 text-center"><p className="font-black text-slate-900">該当する選手がいません</p><p className="mt-2 text-sm text-slate-500">階級か契約ウェイトを広げてください。</p><button className="mt-4 rounded-lg border border-[#ccd4dc] px-4 py-2 text-xs font-bold text-slate-700" onClick={reset} type="button">条件をクリア</button></section> : <section className="mt-3 overflow-hidden rounded-xl border border-[#e0e5ea] bg-white shadow-[0_1px_2px_rgba(15,23,42,.035)]">
      <div className="hidden grid-cols-[1.65fr_1fr_1fr_1.15fr_190px] gap-4 border-b border-[#e6eaee] bg-[#fafbfc] px-5 py-3 text-[10px] font-bold text-slate-400 lg:grid"><span>選手</span><span>戦績</span><span>試合予定</span><span>受付・条件</span><span>操作</span></div>
      {filtered.map((boxer) => <article className="grid gap-4 border-b border-[#edf0f2] px-4 py-4 last:border-0 hover:bg-[#fcfdfe] sm:px-5 lg:grid-cols-[1.65fr_1fr_1fr_1.15fr_190px] lg:items-center" key={boxer.id}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#173b5e] text-sm font-black text-white">{boxer.name.slice(0, 1)}</div>
          <div className="min-w-0"><Link className="block truncate text-[15px] font-black text-slate-950 hover:text-[#1f537d]" href={`/boxers/${boxer.id}`}>{boxer.name}</Link><p className="mt-0.5 truncate text-xs font-medium text-slate-500">{boxer.gym}</p><p className="mt-1 text-[11px] font-medium text-slate-400">{boxer.division} · {boxer.boxerClass} · {boxer.stance}構え</p></div>
        </div>
        <div><p className="text-sm font-black text-slate-800">{boxer.wins}勝 {boxer.losses}敗{boxer.draws ? ` ${boxer.draws}分` : ""}</p><p className="mt-1 text-[11px] font-medium text-slate-400">{boxer.koWins}KO / {boxer.totalBouts}戦</p>{boxer.rankings[0] && <p className="mt-1.5 text-[10px] font-bold text-[#315b7c]">{formatRanking(boxer.rankings[0])}</p>}</div>
        <div><p className="text-xs font-bold text-slate-700">最終 {boxer.lastBout}</p><p className="mt-1 text-xs font-medium text-slate-500">次戦 {boxer.nextBout ?? "未定"}</p></div>
        {industryMode ? <div><span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-black ${statusStyle[boxer.status]}`}>{boxer.status}</span><p className="mt-1.5 text-xs font-bold text-slate-700">{boxer.available}</p><p className="mt-1 text-[11px] font-medium text-slate-400">{contractLabel(boxer)}{boxer.rounds.length ? ` · ${boxer.rounds.map((value) => `${value}R`).join("/")}` : ""}</p></div> : <div className="text-xs text-slate-400">公開情報</div>}
        <div className="flex items-center gap-2 lg:justify-end">
          {industryMode && boxer.status !== "受付停止" ? <Link className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#173b5e] px-4 text-xs font-black text-white shadow-sm hover:bg-[#102f4b] lg:flex-none" href={`/matchmaking/new?boxer=${boxer.id}`}>相談する</Link> : <Link className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[#cbd3da] px-4 text-xs font-black text-slate-700 hover:bg-slate-50 lg:flex-none" href={`/boxers/${boxer.id}`}>詳細</Link>}
          {industryMode && <CandidateSaveButton boxerId={boxer.id} databaseConnected={databaseConnected} compact />}
        </div>
      </article>)}
    </section>}
  </main>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-500">{label}</span>{children}</label>;
}

function FilterSelect({ label, value, onChange, values, render }: { label: string; value: string; onChange: (value: string) => void; values: string[]; render?: (value: string) => string }) {
  return <Field label={label}><select className="input" value={value} onChange={(event) => onChange(event.target.value)}>{values.map((item) => <option key={item} value={item}>{render ? render(item) : item}</option>)}</select></Field>;
}

function QuickButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button className={active ? "rounded-lg bg-[#e9f1f7] px-3 py-2 text-xs font-black text-[#244f70] ring-1 ring-inset ring-[#c9d9e6]" : "rounded-lg border border-[#d8dee4] bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-[#aebbc6] hover:bg-slate-50"} onClick={onClick} type="button">{children}</button>;
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
  if (!boxer.minWeight || !boxer.maxWeight) return "契約ウェイト要確認";
  return `${boxer.minWeight.toFixed(1)}〜${boxer.maxWeight.toFixed(1)}kg`;
}
