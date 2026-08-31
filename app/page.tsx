import Link from "next/link";
import { BoxerDirectory } from "@/features/boxers/components/boxer-directory";
import { loadBoxers } from "@/lib/ringops/load-boxers";

type SearchParams={division?:string;class?:string;rounds?:string;stance?:string;minWeight?:string;maxWeight?:string;minBouts?:string;maxBouts?:string;competition?:string};

export default async function HomePage({searchParams}:{searchParams:Promise<SearchParams>}) {
  const [params,{ boxers, databaseConnected, industryMode, reviewMode, loadError }] = await Promise.all([searchParams,loadBoxers()]);
  const matchDataMode = industryMode || reviewMode;
  const selectedCompetition = params.competition === "men" ? "男子" : params.competition === "women" ? "女子" : "すべて";
  const visibleBoxers = selectedCompetition === "すべて" ? boxers : boxers.filter((boxer) => boxer.competitionCategory === selectedCompetition);
  const open = matchDataMode && !loadError ? visibleBoxers.filter((boxer) => boxer.status !== "受付停止").length : null;

  return <>
    <section className="border-b border-[#d9dee5] bg-white">
      <div className="mx-auto max-w-[1480px] px-4 py-4 lg:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><div className="flex items-center gap-2"><h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">選手名鑑</h1>{reviewMode&&<span className="rounded-md bg-[#edf4f8] px-2 py-1 text-[10px] font-black text-[#315d7d]">デモデータ</span>}</div><p className="mt-1 text-xs font-medium text-slate-500">条件を絞って、相談できる選手を探します。</p></div>
          {!loadError && <div className="flex items-center divide-x divide-[#dde2e7] rounded-lg border border-[#d9dee5] bg-[#fbfcfd] text-xs">
            <div className="px-3 py-2"><span className="text-slate-500">登録</span><b className="ml-2 text-slate-950">{boxers.length}名</b></div>
            {selectedCompetition !== "すべて" && <div className="px-3 py-2"><span className="text-slate-500">表示</span><b className="ml-2 text-slate-950">{visibleBoxers.length}名</b></div>}
            {open !== null && <div className="px-3 py-2"><span className="text-slate-500">相談可</span><b className="ml-2 text-[#315d7d]">{open}名</b></div>}
          </div>}
        </div>
      </div>
    </section>

    {loadError ? <>
      <div className="border-b border-rose-300 bg-rose-50 px-4 py-3 text-center text-xs font-black text-rose-900">{loadError}</div>
      <main className="mx-auto max-w-[900px] px-4 py-12 lg:px-7"><section className="rounded-xl border border-[#d9dee5] bg-white px-5 py-10 text-center"><p className="text-lg font-black">現在、選手データを表示できません</p><p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">誤った情報を業務判断に使わないよう、データ取得エラー時は自動で別データへ切り替えません。</p><Link className="mt-5 inline-flex h-10 items-center rounded-md bg-[#16324a] px-4 text-xs font-black text-white" href="/">再読み込み</Link></section></main>
    </> : <>
      <div className="border-b border-[#d9dee5] bg-[#fbfcfd]">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-2 px-4 py-2.5 lg:px-7">
          <span className="mr-1 text-[11px] font-black text-slate-500">競技区分</span>
          {(["すべて","男子","女子"] as const).map((label) => {
            const value = label === "男子" ? "men" : label === "女子" ? "women" : "";
            const active = selectedCompetition === label;
            return <Link className={active ? "rounded-md bg-[#16324a] px-3 py-2 text-xs font-black text-white" : "rounded-md border border-[#d3dae1] bg-white px-3 py-2 text-xs font-black text-slate-600 hover:border-[#9aa9b7]"} href={competitionHref(params,value)} key={label}>{label}</Link>;
          })}
          <span className="ml-auto hidden text-[10px] font-bold text-slate-400 sm:inline">{industryMode ? "業界データ表示中" : reviewMode ? "確認用MATCH STATUSを表示中" : "公開情報のみ"}</span>
        </div>
      </div>
      <BoxerDirectory boxers={visibleBoxers} databaseConnected={databaseConnected} industryMode={matchDataMode} initialDivision={params.division} initialClass={params.class} initialRounds={params.rounds} initialStance={params.stance} initialMinWeight={params.minWeight} initialMaxWeight={params.maxWeight} initialMinBouts={params.minBouts} initialMaxBouts={params.maxBouts}/>
    </>}
  </>;
}

function competitionHref(params: SearchParams, competition: string) {
  const query = new URLSearchParams();
  for (const [key,value] of Object.entries(params)) if (key !== "competition" && value) query.set(key,value);
  if (competition) query.set("competition",competition);
  const value = query.toString();
  return value ? `/?${value}` : "/";
}
