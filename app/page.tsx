import Link from "next/link";
import { BoxerDirectory } from "@/features/boxers/components/boxer-directory";
import { loadBoxers } from "@/lib/ringops/load-boxers";

type SearchParams={division?:string;class?:string;rounds?:string;stance?:string;minWeight?:string;maxWeight?:string;minBouts?:string;maxBouts?:string};

export default async function HomePage({searchParams}:{searchParams:Promise<SearchParams>}) {
  const [params,{ boxers, databaseConnected, industryMode, loadError }] = await Promise.all([searchParams,loadBoxers()]);
  const open = industryMode && !loadError ? boxers.filter((boxer) => boxer.status !== "受付停止").length : null;

  return <>
    <section className="border-b border-slate-300 bg-white">
      <div className="mx-auto max-w-[1480px] px-4 py-5 lg:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black tracking-[.14em] text-slate-600">選手検索</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-[28px]">対戦候補を、条件からすぐ探す。</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">階級・戦績・地域・ランキング・次戦に加えて、業界ログイン時はジム確認済みのMATCH STATUSと試合条件まで同じ画面で絞り込めます。</p>
          </div>
          {!loadError && <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-l-2 border-slate-950 pl-4 text-xs font-bold text-slate-700">
            <p>登録 <b className="text-slate-950">{boxers.length}名</b></p>
            {open !== null && <p>相談可能 <b className="text-slate-950">{open}名</b></p>}
            {databaseConnected && !industryMode && <Link className="border border-slate-950 bg-slate-950 px-3 py-2 font-black text-white" href="/login">業界ログイン</Link>}
          </div>}
        </div>
      </div>
    </section>

    {loadError ? <>
      <div className="border-b border-rose-300 bg-rose-50 px-4 py-3 text-center text-xs font-black text-rose-900">{loadError}</div>
      <main className="mx-auto max-w-[900px] px-4 py-12 lg:px-7">
        <section className="border-y-2 border-slate-950 bg-white px-5 py-10 text-center">
          <p className="text-lg font-black">現在、選手データを表示できません</p>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">架空データへ自動で切り替えず、正式データの復旧後に表示します。誤った情報を業務判断に使わせないための保護です。</p>
          <Link className="mt-5 inline-flex h-10 items-center border border-slate-950 bg-slate-950 px-4 text-xs font-black text-white" href="/">再読み込み</Link>
        </section>
      </main>
    </> : <>
      <div className="border-b border-slate-300 bg-[#f7f8fa] px-4 py-2 text-center text-[11px] font-bold text-slate-600">
        {!databaseConnected
          ? "開発プレビュー：表示中の選手は架空データです。検索・導線・MATCH STATUSの操作確認用です。"
          : industryMode
            ? "業界ログイン中：MATCH STATUS・契約ウェイト・希望R・遠征条件を含めて検索できます。"
            : "一般公開表示：MATCH STATUS・契約ウェイト等の業界情報はログイン後に表示します。"}
      </div>
      <BoxerDirectory
        boxers={boxers}
        databaseConnected={databaseConnected}
        industryMode={industryMode}
        initialDivision={params.division}
        initialClass={params.class}
        initialRounds={params.rounds}
        initialStance={params.stance}
        initialMinWeight={params.minWeight}
        initialMaxWeight={params.maxWeight}
        initialMinBouts={params.minBouts}
        initialMaxBouts={params.maxBouts}
      />
    </>}
  </>;
}
