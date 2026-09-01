import Link from "next/link";
import { BoxerDirectory } from "@/features/boxers/components/boxer-directory";
import { loadBoxers } from "@/lib/ringops/load-boxers";

type SearchParams = { division?: string; class?: string; rounds?: string; stance?: string; minWeight?: string; maxWeight?: string; minBouts?: string; maxBouts?: string; competition?: string };

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, { boxers, databaseConnected, industryMode, reviewMode, loadError }] = await Promise.all([searchParams, loadBoxers()]);
  const matchDataMode = industryMode || reviewMode;
  const selectedCompetition = params.competition === "men" ? "男子" : params.competition === "women" ? "女子" : "すべて";
  const visibleBoxers = selectedCompetition === "すべて" ? boxers : boxers.filter((boxer) => boxer.competitionCategory === selectedCompetition);

  if (loadError) return <main className="mx-auto max-w-[900px] px-4 py-12 lg:px-7"><section className="border-y border-[var(--ringops-line-strong)] bg-white px-5 py-10 text-center"><p className="text-lg font-black">現在、選手データを表示できません</p><p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">{loadError}</p><Link className="ops-primary mt-5" href="/">再読み込み</Link></section></main>;

  return <>
    <div className="mx-auto flex max-w-[1440px] items-center gap-1 px-4 pt-3 lg:px-7">
      <span className="mr-2 text-[9px] font-black uppercase tracking-[.1em] text-slate-400">競技区分</span>
      {(["すべて", "男子", "女子"] as const).map((label) => {
        const value = label === "男子" ? "men" : label === "女子" ? "women" : "";
        const active = selectedCompetition === label;
        return <Link className={`border-b-2 px-3 py-2 text-[11px] font-black ${active ? "border-[var(--ringops-accent)] text-[var(--ringops-ink)]" : "border-transparent text-slate-400 hover:text-slate-700"}`} href={competitionHref(params, value)} key={label}>{label}</Link>;
      })}
    </div>
    <BoxerDirectory
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
    />
  </>;
}

function competitionHref(params: SearchParams, competition: string) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (key !== "competition" && value) query.set(key, value);
  if (competition) query.set("competition", competition);
  const value = query.toString();
  return value ? `/?${value}` : "/";
}