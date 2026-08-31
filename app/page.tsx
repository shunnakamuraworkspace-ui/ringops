import Link from "next/link";
import { BoxerDirectory } from "@/features/boxers/components/boxer-directory";
import { loadBoxers } from "@/lib/ringops/load-boxers";

type SearchParams = { division?: string; class?: string; rounds?: string; stance?: string; minWeight?: string; maxWeight?: string; minBouts?: string; maxBouts?: string; competition?: string };

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, { boxers, databaseConnected, industryMode, reviewMode, loadError }] = await Promise.all([searchParams, loadBoxers()]);
  const matchDataMode = industryMode || reviewMode;
  const selectedCompetition = params.competition === "men" ? "男子" : params.competition === "women" ? "女子" : "すべて";
  const visibleBoxers = selectedCompetition === "すべて" ? boxers : boxers.filter((boxer) => boxer.competitionCategory === selectedCompetition);
  const open = matchDataMode && !loadError ? visibleBoxers.filter((boxer) => boxer.status !== "受付停止").length : null;

  return <>
    <section className="border-b border-[#e5e9ed] bg-white">
      <div className="mx-auto flex max-w-[1380px] flex-wrap items-end justify-between gap-4 px-4 py-5 lg:px-7">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">選手を探す</h1>
          <p className="mt-1 text-sm text-slate-500">条件が合う選手を見つけて、そのまま所属ジムへ相談できます。</p>
        </div>
        {!loadError && <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-[#dce2e7] bg-[#fafbfc] p-1">
            {(["すべて", "男子", "女子"] as const).map((label) => {
              const value = label === "男子" ? "men" : label === "女子" ? "women" : "";
              const active = selectedCompetition === label;
              return <Link className={active ? "rounded-md bg-white px-3 py-1.5 text-xs font-black text-[#234f70] shadow-sm ring-1 ring-[#d8e0e6]" : "rounded-md px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-700"} href={competitionHref(params, value)} key={label}>{label}</Link>;
            })}
          </div>
          <div className="text-right"><p className="text-[10px] font-bold text-slate-400">表示中</p><p className="text-sm font-black text-slate-800">{visibleBoxers.length}名{open !== null ? ` / 相談可 ${open}名` : ""}</p></div>
        </div>}
      </div>
    </section>

    {loadError ? <main className="mx-auto max-w-[900px] px-4 py-12 lg:px-7"><section className="rounded-xl border border-[#e0e5ea] bg-white px-5 py-10 text-center"><p className="text-lg font-black">現在、選手データを表示できません</p><p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">{loadError}</p><Link className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#173b5e] px-4 text-xs font-black text-white" href="/">再読み込み</Link></section></main> : <BoxerDirectory
      boxers={visibleBoxers}
      databaseConnected={databaseConnected}
      industryMode={matchDataMode}
      initialDivision={params.division}
      initialClass={params.class}
      initialRounds={params.rounds}
      initialStance={params.stance}
      initialMinWeight={params.minWeight}
      initialMaxWeight={params.maxWeight}
      initialMinBouts={params.minBouts}
      initialMaxBouts={params.maxBouts}
    />}
  </>;
}

function competitionHref(params: SearchParams, competition: string) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (key !== "competition" && value) query.set(key, value);
  if (competition) query.set("competition", competition);
  const value = query.toString();
  return value ? `/?${value}` : "/";
}
