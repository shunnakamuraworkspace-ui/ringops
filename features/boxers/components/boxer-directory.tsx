"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { CandidateSaveButton } from "./candidate-save-button";
import { divisions, type BoxerPreview } from "../data/preview-boxers";

const statusStyle: Record<BoxerPreview["status"], string> = {
  "受付中": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "条件次第": "border-amber-200 bg-amber-50 text-amber-900",
  "受付停止": "border-slate-200 bg-slate-100 text-slate-600",
};

type SearchFilters = {
  q: string;
  division: string;
  klass: string;
  stance: string;
  scope: string;
  prefecture: string;
  nationality: string;
  status: string;
  rounds: string;
  ranking: string;
  rankMax: string;
  nextBout: string;
  month: string;
  minWeight: string;
  maxWeight: string;
  minBouts: string;
  maxBouts: string;
  minWins: string;
  minKoWins: string;
  undefeated: string;
  lastBoutAge: string;
  travel: string;
  sort: string;
};

type SavedSearch = {
  id: string;
  name: string;
  filters: SearchFilters;
};

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

const defaultFilters: SearchFilters = {
  q: "",
  division: "すべて",
  klass: "すべて",
  stance: "すべて",
  scope: "すべて",
  prefecture: "すべて",
  nationality: "すべて",
  status: "相談可",
  rounds: "すべて",
  ranking: "すべて",
  rankMax: "",
  nextBout: "すべて",
  month: "",
  minWeight: "",
  maxWeight: "",
  minBouts: "",
  maxBouts: "",
  minWins: "",
  minKoWins: "",
  undefeated: "すべて",
  lastBoutAge: "すべて",
  travel: "すべて",
  sort: "受付優先",
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
  initialMinBouts,
  initialMaxBouts,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [q, setQ] = useState("");
  const [division, setDivision] = useState(initialDivision && divisions.includes(initialDivision) ? initialDivision : "すべて");
  const [klass, setKlass] = useState(initialClass && ["A級", "B級", "C級"].includes(initialClass) ? initialClass : "すべて");
  const [stance, setStance] = useState(initialStance && ["右", "左"].includes(initialStance) ? initialStance : "すべて");
  const [scope, setScope] = useState("すべて");
  const [prefecture, setPrefecture] = useState("すべて");
  const [nationality, setNationality] = useState("すべて");
  const [status, setStatus] = useState("相談可");
  const [rounds, setRounds] = useState(initialRounds && ["4", "6", "8", "10", "12", "4R", "6R", "8R", "10R", "12R"].includes(initialRounds) ? initialRounds.replace("R", "") : "すべて");
  const [ranking, setRanking] = useState("すべて");
  const [rankMax, setRankMax] = useState("");
  const [nextBout, setNextBout] = useState("すべて");
  const [month, setMonth] = useState("");
  const [minWeight, setMinWeight] = useState(validNumberString(initialMinWeight));
  const [maxWeight, setMaxWeight] = useState(validNumberString(initialMaxWeight));
  const [minBouts, setMinBouts] = useState(validNumberString(initialMinBouts));
  const [maxBouts, setMaxBouts] = useState(validNumberString(initialMaxBouts));
  const [minWins, setMinWins] = useState("");
  const [minKoWins, setMinKoWins] = useState("");
  const [undefeated, setUndefeated] = useState("すべて");
  const [lastBoutAge, setLastBoutAge] = useState("すべて");
  const [travel, setTravel] = useState("すべて");
  const [sort, setSort] = useState("受付優先");

  const prefectures = useMemo(
    () => [...new Set(boxers.map((boxer) => boxer.prefecture).filter(Boolean))].sort(),
    [boxers],
  );
  const nationalities = useMemo(
    () => [...new Set(boxers.map((boxer) => boxer.nationality).filter(Boolean))].sort(),
    [boxers],
  );

  const currentFilters: SearchFilters = {
    q,
    division,
    klass,
    stance,
    scope,
    prefecture,
    nationality,
    status,
    rounds,
    ranking,
    rankMax,
    nextBout,
    month,
    minWeight,
    maxWeight,
    minBouts,
    maxBouts,
    minWins,
    minKoWins,
    undefeated,
    lastBoutAge,
    travel,
    sort,
  };

  const filtered = useMemo(() => {
    const list = boxers.filter((boxer) => {
      const text = q.trim().toLowerCase();
      const queryOk =
        !text ||
        [boxer.name, boxer.kana, boxer.gym, boxer.prefecture, boxer.nationality].some((value) =>
          value.toLowerCase().includes(text),
        );

      const scopeOk =
        scope === "すべて" ||
        (scope === "国内" ? boxer.nationality === "日本" : boxer.nationality !== "日本");
      const prefectureOk = prefecture === "すべて" || boxer.prefecture === prefecture;
      const nationalityOk = nationality === "すべて" || boxer.nationality === nationality;

      const rankLimit = rankMax ? Number(rankMax) : null;
      const rankingOk =
        ranking === "すべて" ||
        boxer.rankings.some((item) => {
          const bodyOk = ranking === "ランカー" || item.body === ranking;
          const rankOk = rankLimit === null || (item.rank !== null && item.rank <= rankLimit);
          return bodyOk && rankOk;
        });

      const nextOk =
        nextBout === "すべて" ||
        (nextBout === "次戦あり" ? Boolean(boxer.nextBout) : !boxer.nextBout);

      const minB = minBouts ? Number(minBouts) : null;
      const maxB = maxBouts ? Number(maxBouts) : null;
      const minWn = minWins ? Number(minWins) : null;
      const minKo = minKoWins ? Number(minKoWins) : null;
      const recordOk =
        (minB === null || boxer.totalBouts >= minB) &&
        (maxB === null || boxer.totalBouts <= maxB) &&
        (minWn === null || boxer.wins >= minWn) &&
        (minKo === null || boxer.koWins >= minKo) &&
        (undefeated === "すべて" || boxer.losses === 0);

      const lastBoutOk = matchesLastBoutAge(boxer.lastBout, lastBoutAge);
      const commonOk =
        queryOk &&
        (division === "すべて" || boxer.division === division) &&
        (klass === "すべて" || boxer.boxerClass === klass) &&
        (stance === "すべて" || boxer.stance === stance) &&
        scopeOk &&
        prefectureOk &&
        nationalityOk &&
        rankingOk &&
        nextOk &&
        recordOk &&
        lastBoutOk;

      if (!industryMode) return commonOk;

      const statusOk =
        status === "すべて" ||
        (status === "相談可" ? boxer.status !== "受付停止" : boxer.status === status);
      const monthOk = !month || Boolean(boxer.availableMonth && boxer.availableMonth <= month);
      const minW = minWeight ? Number(minWeight) : null;
      const maxW = maxWeight ? Number(maxWeight) : null;
      const weightOk =
        (minW === null || boxer.maxWeight >= minW) &&
        (maxW === null || boxer.minWeight <= maxW);
      const travelOk = travel === "すべて" || matchesTravel(boxer.travel, travel);
      const roundsOk = rounds === "すべて" || boxer.rounds.includes(Number(rounds));

      return commonOk && statusOk && monthOk && weightOk && travelOk && roundsOk;
    });

    return [...list].sort((a, b) => compareBoxers(a, b, sort, industryMode));
  }, [
    boxers,
    q,
    division,
    klass,
    stance,
    scope,
    prefecture,
    nationality,
    status,
    rounds,
    ranking,
    rankMax,
    nextBout,
    month,
    minWeight,
    maxWeight,
    minBouts,
    maxBouts,
    minWins,
    minKoWins,
    undefeated,
    lastBoutAge,
    travel,
    sort,
    industryMode,
  ]);

  function applyFilters(filters: SearchFilters) {
    const value = { ...defaultFilters, ...filters };
    setQ(value.q);
    setDivision(value.division);
    setKlass(value.klass);
    setStance(value.stance);
    setScope(value.scope);
    setPrefecture(value.prefecture);
    setNationality(value.nationality);
    setStatus(value.status);
    setRounds(value.rounds);
    setRanking(value.ranking);
    setRankMax(value.rankMax);
    setNextBout(value.nextBout);
    setMonth(value.month);
    setMinWeight(value.minWeight);
    setMaxWeight(value.maxWeight);
    setMinBouts(value.minBouts);
    setMaxBouts(value.maxBouts);
    setMinWins(value.minWins);
    setMinKoWins(value.minKoWins);
    setUndefeated(value.undefeated);
    setLastBoutAge(value.lastBoutAge);
    setTravel(value.travel);
    setSort(value.sort);
  }

  const reset = () => applyFilters(defaultFilters);
  const inherited = Boolean(
    initialDivision ||
      initialClass ||
      initialRounds ||
      initialStance ||
      initialMinWeight ||
      initialMaxWeight ||
      initialMinBouts ||
      initialMaxBouts,
  );

  const activeFilters = [
    q ? { label: `検索：${q}`, clear: () => setQ("") } : null,
    division !== "すべて" ? { label: division, clear: () => setDivision("すべて") } : null,
    klass !== "すべて" ? { label: klass, clear: () => setKlass("すべて") } : null,
    stance !== "すべて" ? { label: `${stance}構え`, clear: () => setStance("すべて") } : null,
    scope !== "すべて" ? { label: scope, clear: () => setScope("すべて") } : null,
    prefecture !== "すべて" ? { label: prefecture, clear: () => setPrefecture("すべて") } : null,
    nationality !== "すべて" ? { label: `国籍：${nationality}`, clear: () => setNationality("すべて") } : null,
    ranking !== "すべて" ? { label: rankMax ? `${ranking} ${rankMax}位以内` : ranking, clear: () => { setRanking("すべて"); setRankMax(""); } } : null,
    nextBout !== "すべて" ? { label: nextBout, clear: () => setNextBout("すべて") } : null,
    minBouts ? { label: `${minBouts}戦以上`, clear: () => setMinBouts("") } : null,
    maxBouts ? { label: `${maxBouts}戦以下`, clear: () => setMaxBouts("") } : null,
    minWins ? { label: `${minWins}勝以上`, clear: () => setMinWins("") } : null,
    minKoWins ? { label: `KO ${minKoWins}以上`, clear: () => setMinKoWins("") } : null,
    undefeated !== "すべて" ? { label: "無敗", clear: () => setUndefeated("すべて") } : null,
    lastBoutAge !== "すべて" ? { label: `最終試合 ${lastBoutAge}`, clear: () => setLastBoutAge("すべて") } : null,
    industryMode && status !== "相談可" ? { label: `受付：${status}`, clear: () => setStatus("相談可") } : null,
    industryMode && rounds !== "すべて" ? { label: `${rounds}R`, clear: () => setRounds("すべて") } : null,
    industryMode && month ? { label: `${month.replace("-", "年")}月までに可`, clear: () => setMonth("") } : null,
    industryMode && minWeight ? { label: `${minWeight}kg以上`, clear: () => setMinWeight("") } : null,
    industryMode && maxWeight ? { label: `${maxWeight}kg以下`, clear: () => setMaxWeight("") } : null,
    industryMode && travel !== "すべて" ? { label: travel, clear: () => setTravel("すべて") } : null,
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <>
      <section className="border-b border-slate-300 bg-[#eef2f5]">
        <div className="mx-auto max-w-[1480px] px-4 py-4 lg:px-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <label className="mb-1.5 block text-[11px] font-black text-slate-700">選手を検索</label>
              <input
                className="input h-12 border-slate-400 bg-white pr-4 text-[15px] font-bold placeholder:font-medium placeholder:text-slate-400"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="選手名・所属ジム・都道府県・国籍"
              />
            </div>
            <div className="flex flex-wrap gap-2 lg:pt-5">
              <QuickButton active={industryMode && status === "受付中"} onClick={() => industryMode && setStatus(status === "受付中" ? "相談可" : "受付中")}>
                受付中
              </QuickButton>
              <QuickButton active={nextBout === "次戦未定"} onClick={() => setNextBout(nextBout === "次戦未定" ? "すべて" : "次戦未定")}>
                次戦未定
              </QuickButton>
              <QuickButton active={klass === "B級"} onClick={() => setKlass(klass === "B級" ? "すべて" : "B級")}>
                B級
              </QuickButton>
              <QuickButton active={stance === "左"} onClick={() => setStance(stance === "左" ? "すべて" : "左")}>
                左構え
              </QuickButton>
              <QuickButton active={ranking === "日本"} onClick={() => setRanking(ranking === "日本" ? "すべて" : "日本")}>
                日本ランカー
              </QuickButton>
            </div>
          </div>

          {inherited && (
            <div className="mt-3 border-l-4 border-slate-950 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              対戦相手募集の条件を引き継いでいます。必要な条件だけ変更してください。
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-[1480px] px-4 py-5 lg:px-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 lg:hidden">
          <button
            className="h-11 border border-slate-950 bg-white px-4 text-sm font-black text-slate-950"
            onClick={() => setFiltersOpen((value) => !value)}
            type="button"
          >
            条件検索 {activeFilters.length > 0 ? `(${activeFilters.length})` : ""}
          </button>
          <span className="text-sm font-black text-slate-900">候補 {filtered.length}名</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
            <div className="border border-slate-300 bg-white lg:sticky lg:top-20">
              <div className="flex items-center justify-between border-b border-slate-300 bg-slate-950 px-4 py-3 text-white">
                <div>
                  <p className="text-[10px] font-black tracking-[.14em] text-slate-400">FILTER</p>
                  <h2 className="mt-0.5 text-base font-black">条件検索</h2>
                </div>
                <button className="text-xs font-bold text-slate-300 hover:text-white" onClick={reset} type="button">
                  全解除
                </button>
              </div>

              <FilterSection title="基本条件" description="まず選手像を絞る">
                <Select label="階級" value={division} onChange={setDivision} values={["すべて", ...divisions]} />
                <div className="grid grid-cols-2 gap-2">
                  <Select label="クラス" value={klass} onChange={setKlass} values={["すべて", "A級", "B級", "C級"]} />
                  <Select label="構え" value={stance} onChange={setStance} values={["すべて", "右", "左"]} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select label="国内 / 海外" value={scope} onChange={setScope} values={["すべて", "国内", "海外"]} />
                  <Select label="都道府県" value={prefecture} onChange={setPrefecture} values={["すべて", ...prefectures]} />
                </div>
                <Select label="国籍" value={nationality} onChange={setNationality} values={["すべて", ...nationalities]} />
              </FilterSection>

              <FilterSection title="戦績・ランキング" description="実力と活動状況を見る">
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="戦数 下限" value={minBouts} onChange={setMinBouts} placeholder="5" />
                  <NumberField label="戦数 上限" value={maxBouts} onChange={setMaxBouts} placeholder="12" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="勝数 下限" value={minWins} onChange={setMinWins} placeholder="4" />
                  <NumberField label="KO勝 下限" value={minKoWins} onChange={setMinKoWins} placeholder="2" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select label="無敗" value={undefeated} onChange={setUndefeated} values={["すべて", "無敗のみ"]} />
                  <Select label="次戦" value={nextBout} onChange={setNextBout} values={["すべて", "次戦あり", "次戦未定"]} />
                </div>
                <Select
                  label="最終試合"
                  value={lastBoutAge}
                  onChange={setLastBoutAge}
                  values={["すべて", "90日以内", "180日以内", "365日以内", "180日以上", "365日以上"]}
                />
                <div className="grid grid-cols-[1fr_92px] gap-2">
                  <Select
                    label="ランキング"
                    value={ranking}
                    onChange={setRanking}
                    values={["すべて", "ランカー", "日本", "OPBF", "WBO Asia Pacific", "WBA", "WBC", "IBF", "WBO"]}
                  />
                  <NumberField label="順位以内" value={rankMax} onChange={setRankMax} placeholder="15" disabled={ranking === "すべて"} />
                </div>
              </FilterSection>

              {industryMode && (
                <FilterSection title="試合条件" description="今、組めるかを絞る">
                  <Select label="MATCH STATUS" value={status} onChange={setStatus} values={["相談可", "受付中", "条件次第", "受付停止", "すべて"]} />
                  <div className="grid grid-cols-2 gap-2">
                    <Select label="希望R" value={rounds} onChange={setRounds} values={["すべて", "4", "6", "8", "10", "12"]} />
                    <Select label="遠征" value={travel} onChange={setTravel} values={["すべて", "遠征可", "要相談", "地域限定"]} />
                  </div>
                  <Field label="試合可能月">
                    <input className="input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <DecimalField label="契約kg 下限" value={minWeight} onChange={setMinWeight} placeholder="53.0" />
                    <DecimalField label="契約kg 上限" value={maxWeight} onChange={setMaxWeight} placeholder="55.0" />
                  </div>
                </FilterSection>
              )}

              {industryMode && (
                <div className="border-t border-slate-300 p-4">
                  <SavedSearchControls databaseConnected={databaseConnected} filters={currentFilters} onApply={applyFilters} />
                </div>
              )}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-slate-300 pb-3">
              <div>
                <p className="text-[11px] font-black tracking-[.12em] text-slate-500">検索結果</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <h2 className="text-2xl font-black text-slate-950">候補 {filtered.length}名</h2>
                  <span className="text-xs font-bold text-slate-600">
                    {industryMode ? "公式情報 + ジム確認情報" : "一般公開情報"}
                  </span>
                </div>
              </div>
              <label className="block min-w-48">
                <span className="mb-1 block text-[10px] font-black text-slate-600">並び順</span>
                <select className="input h-10" value={sort} onChange={(event) => setSort(event.target.value)}>
                  {(industryMode
                    ? ["受付優先", "ランキング上位", "最終試合が新しい", "戦数が多い", "KOが多い", "名前順"]
                    : ["ランキング上位", "最終試合が新しい", "戦数が多い", "KOが多い", "名前順"]
                  ).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {activeFilters.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {activeFilters.map((item) => (
                  <button
                    className="border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-800 hover:border-slate-900"
                    key={item.label}
                    onClick={item.clear}
                    type="button"
                  >
                    {item.label} ×
                  </button>
                ))}
                <button className="px-2 py-1.5 text-[11px] font-black text-slate-600 underline underline-offset-4" onClick={reset} type="button">
                  すべて解除
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="border-y-2 border-slate-950 bg-white px-5 py-14 text-center">
                <p className="text-lg font-black text-slate-950">該当する選手がいません</p>
                <p className="mt-2 text-sm font-medium text-slate-600">階級・戦数・ウェイトのどれかを1つ緩めると候補を広げられます。</p>
                <button className="mt-5 h-10 border border-slate-950 px-4 text-xs font-black" onClick={reset} type="button">
                  条件をリセット
                </button>
              </div>
            ) : (
              <div className="overflow-hidden border-y-2 border-slate-950 bg-white">
                <div className={`hidden gap-3 border-b border-slate-300 bg-[#f3f5f7] px-4 py-2.5 text-[10px] font-black text-slate-700 xl:grid ${industryMode ? "grid-cols-[1.7fr_.8fr_1.25fr_1.2fr_1.3fr_150px]" : "grid-cols-[1.8fr_.85fr_1.35fr_1.2fr_150px]"}`}>
                  <span>選手</span>
                  <span>クラス / 構え</span>
                  <span>戦績 / ランキング</span>
                  <span>最終 / 次戦</span>
                  {industryMode && <span>MATCH STATUS / 条件</span>}
                  <span>操作</span>
                </div>

                {filtered.map((boxer) => (
                  <article
                    className={`grid gap-3 border-b border-slate-200 px-4 py-4 last:border-0 hover:bg-[#fafbfc] xl:items-center ${industryMode ? "xl:grid-cols-[1.7fr_.8fr_1.25fr_1.2fr_1.3fr_150px]" : "xl:grid-cols-[1.8fr_.85fr_1.35fr_1.2fr_150px]"}`}
                    key={boxer.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center bg-slate-900 text-base font-black text-white">
                        {boxer.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <Link className="block truncate text-[15px] font-black text-slate-950 hover:underline" href={`/boxers/${boxer.id}`}>
                          {boxer.name}
                        </Link>
                        <p className="mt-0.5 truncate text-[11px] font-bold text-slate-600">{boxer.gym}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {boxer.division} · {boxer.prefecture} · {boxer.nationality}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-950">{boxer.boxerClass}</p>
                      <p className="mt-1 text-xs font-bold text-slate-600">{boxer.stance}構え</p>
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {boxer.wins}勝 {boxer.losses}敗 {boxer.draws}分
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-600">{boxer.koWins}KO / {boxer.totalBouts}戦</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {boxer.rankings.length === 0 ? (
                          <span className="text-[10px] font-bold text-slate-400">ランキングなし</span>
                        ) : (
                          boxer.rankings.slice(0, 3).map((item) => (
                            <span className="border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-700" key={`${item.body}-${item.rank}`}>
                              {item.body} {item.title ?? (item.rank ? `${item.rank}位` : "")}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-black text-slate-900">最終 {boxer.lastBout}</p>
                      <p className="mt-1 text-xs font-bold text-slate-600">
                        次戦 {boxer.nextBout ? boxer.nextBout : "未定"}
                      </p>
                      {boxer.nextVenue && <p className="mt-0.5 text-[10px] text-slate-500">{boxer.nextVenue}</p>}
                    </div>

                    {industryMode && (
                      <div>
                        <span className={`inline-flex border px-2 py-1 text-[11px] font-black ${statusStyle[boxer.status]}`}>
                          {boxer.status}
                        </span>
                        <p className="mt-1.5 text-[11px] font-black text-slate-900">{boxer.available}</p>
                        <p className="mt-1 text-[11px] font-bold text-slate-600">
                          {boxer.minWeight.toFixed(1)}〜{boxer.maxWeight.toFixed(1)}kg · {boxer.rounds.map((value) => `${value}R`).join(" / ")}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-slate-500">ジム確認済み：{boxer.verified}</p>
                      </div>
                    )}

                    <div className="flex gap-2 xl:block">
                      <Link
                        className="flex h-10 flex-1 items-center justify-center border border-slate-950 bg-slate-950 px-3 text-xs font-black text-white hover:bg-slate-800 xl:w-full"
                        href={`/boxers/${boxer.id}`}
                      >
                        詳細を見る
                      </Link>
                      {industryMode && <CandidateSaveButton boxerId={boxer.id} databaseConnected={databaseConnected} compact />}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function QuickButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={`h-10 border px-3 text-xs font-black ${
        active
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-400 bg-white text-slate-800 hover:border-slate-950"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function FilterSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-slate-300 p-4 last:border-b-0">
      <div className="mb-3">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        <p className="mt-0.5 text-[10px] font-bold text-slate-500">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  values,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  values: string[];
}) {
  return (
    <Field label={label}>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option key={item} value={item}>
            {/^\d+$/.test(item) ? `${item}R` : item}
          </option>
        ))}
      </select>
    </Field>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        className="input"
        disabled={disabled}
        inputMode="numeric"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="number"
        value={value}
      />
    </Field>
  );
}

function DecimalField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Field label={label}>
      <input
        className="input"
        inputMode="decimal"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step="0.1"
        type="number"
        value={value}
      />
    </Field>
  );
}

function SavedSearchControls({
  databaseConnected,
  filters,
  onApply,
}: {
  databaseConnected: boolean;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}) {
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!databaseConnected) {
        try {
          const raw = localStorage.getItem("ringops_saved_searches");
          if (active && raw) setItems(JSON.parse(raw) as SavedSearch[]);
        } catch {
          if (active) setNotice("保存条件を読み込めませんでした");
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        const { data, error } = await supabase
          .schema("ringops")
          .from("saved_searches")
          .select("id,name,filters")
          .eq("user_id", userData.user.id)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        if (active) setItems((data ?? []) as SavedSearch[]);
      } catch {
        if (active) setNotice("保存条件を読み込めませんでした");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [databaseConnected]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNotice("保存名を入力してください");
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      if (!databaseConnected) {
        const existing = items.find((item) => item.name === trimmed);
        const nextItem: SavedSearch = {
          id: existing?.id ?? `local-${crypto.randomUUID()}`,
          name: trimmed,
          filters,
        };
        const next = [nextItem, ...items.filter((item) => item.name !== trimmed)];
        localStorage.setItem("ringops_saved_searches", JSON.stringify(next));
        setItems(next);
        setSelected(nextItem.id);
        setName("");
        setNotice("検索条件を保存しました");
        return;
      }

      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("not authenticated");
      const { data, error } = await supabase
        .schema("ringops")
        .from("saved_searches")
        .upsert(
          { user_id: userData.user.id, name: trimmed, filters },
          { onConflict: "user_id,name" },
        )
        .select("id,name,filters")
        .single();
      if (error) throw error;

      const saved = data as SavedSearch;
      setItems([saved, ...items.filter((item) => item.id !== saved.id && item.name !== saved.name)]);
      setSelected(saved.id);
      setName("");
      setNotice("検索条件を保存しました");
    } catch {
      setNotice("検索条件を保存できませんでした");
    } finally {
      setBusy(false);
    }
  }

  function apply(id: string) {
    setSelected(id);
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    onApply({ ...defaultFilters, ...item.filters });
    setNotice(`${item.name}を反映しました`);
  }

  async function remove() {
    if (!selected) return;
    const current = items.find((item) => item.id === selected);
    if (!current) return;

    setBusy(true);
    setNotice("");

    try {
      if (databaseConnected) {
        const supabase = createClient();
        const { error } = await supabase.schema("ringops").from("saved_searches").delete().eq("id", selected);
        if (error) throw error;
      }

      const next = items.filter((item) => item.id !== selected);
      if (!databaseConnected) localStorage.setItem("ringops_saved_searches", JSON.stringify(next));
      setItems(next);
      setSelected("");
      setNotice("保存条件を削除しました");
    } catch {
      setNotice("保存条件を削除できませんでした");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-black text-slate-950">検索条件を保存</p>
      <p className="mt-0.5 text-[10px] font-bold text-slate-500">よく使う条件を再利用できます。</p>

      {items.length > 0 && (
        <label className="mt-3 block">
          <span className="mb-1 block text-[10px] font-black text-slate-600">保存した条件</span>
          <select className="input h-9" value={selected} onChange={(event) => apply(event.target.value)}>
            <option value="">選択</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-2 flex gap-2">
        <input
          className="input h-9 min-w-0 flex-1 text-xs"
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          placeholder="例：11月Sバンタム"
          value={name}
        />
        <button
          className="h-9 border border-slate-950 bg-slate-950 px-3 text-xs font-black text-white disabled:opacity-40"
          disabled={busy}
          onClick={save}
          type="button"
        >
          保存
        </button>
      </div>

      {selected && (
        <button
          className="mt-2 text-[10px] font-bold text-slate-500 underline underline-offset-4 disabled:opacity-40"
          disabled={busy}
          onClick={remove}
          type="button"
        >
          選択中の条件を削除
        </button>
      )}

      {notice && <p className="mt-2 text-[10px] font-bold text-slate-600">{notice}</p>}
    </div>
  );
}

function validNumberString(value?: string) {
  if (!value) return "";
  return Number.isFinite(Number(value)) ? value : "";
}

function parseBoutDate(value: string) {
  const timestamp = new Date(`${value.replaceAll(".", "-")}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function matchesLastBoutAge(value: string, condition: string) {
  if (condition === "すべて") return true;
  const timestamp = parseBoutDate(value);
  if (!timestamp) return false;
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
  if (condition === "90日以内") return days <= 90;
  if (condition === "180日以内") return days <= 180;
  if (condition === "365日以内") return days <= 365;
  if (condition === "180日以上") return days >= 180;
  if (condition === "365日以上") return days >= 365;
  return true;
}

function matchesTravel(value: string, condition: string) {
  if (condition === "遠征可") return value.includes("可") && !value.includes("不可");
  if (condition === "要相談") return value.includes("相談");
  if (condition === "地域限定") return !value.includes("可") && !value.includes("相談") && value !== "—";
  return true;
}

function bestRank(boxer: BoxerPreview) {
  const ranks = boxer.rankings
    .map((item) => item.rank)
    .filter((value): value is number => value !== null);
  return ranks.length > 0 ? Math.min(...ranks) : 9999;
}

function compareBoxers(a: BoxerPreview, b: BoxerPreview, sort: string, industryMode: boolean) {
  if (sort === "受付優先" && industryMode) {
    const order: Record<BoxerPreview["status"], number> = { "受付中": 0, "条件次第": 1, "受付停止": 2 };
    const diff = order[a.status] - order[b.status];
    if (diff !== 0) return diff;
    return (a.availableMonth || "9999-99").localeCompare(b.availableMonth || "9999-99");
  }
  if (sort === "ランキング上位") return bestRank(a) - bestRank(b);
  if (sort === "最終試合が新しい") return parseBoutDate(b.lastBout) - parseBoutDate(a.lastBout);
  if (sort === "戦数が多い") return b.totalBouts - a.totalBouts;
  if (sort === "KOが多い") return b.koWins - a.koWins;
  return a.name.localeCompare(b.name, "ja");
}
