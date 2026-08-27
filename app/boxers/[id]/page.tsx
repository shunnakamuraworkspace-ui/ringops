import Link from "next/link";
import { notFound } from "next/navigation";
import { CandidateSaveButton } from "@/features/boxers/components/candidate-save-button";
import { loadBoxer } from "@/lib/ringops/load-boxers";

export default async function BoxerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { boxer, industryMode, reviewMode, databaseConnected, loadError } = await loadBoxer(id);

  if (loadError) {
    return <main className="mx-auto max-w-[900px] px-4 py-10 lg:px-7">
      <Link className="text-xs font-black text-slate-700 underline underline-offset-4" href="/">← 選手名鑑に戻る</Link>
      <section className="mt-6 border-y-2 border-slate-950 bg-white px-5 py-10 text-center">
        <h1 className="text-xl font-black text-slate-950">選手情報を読み込めません</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">{loadError}</p>
        <Link className="mt-5 inline-flex h-10 items-center border border-slate-950 bg-slate-950 px-4 text-xs font-black text-white" href={`/boxers/${id}`}>再読み込み</Link>
      </section>
    </main>;
  }

  if (!boxer) notFound();
  const matchDataMode = industryMode || reviewMode;
  const age = boxer.birthDate ? calculateAge(boxer.birthDate) : null;
  const record = `${boxer.totalBouts}戦 ${boxer.wins}勝${boxer.koWins ? `（${boxer.koWins}KO）` : ""} ${boxer.losses}敗${boxer.draws ? ` ${boxer.draws}分` : ""}`;
  const contractWeight = boxer.minWeight && boxer.maxWeight ? `${boxer.minWeight.toFixed(1)}〜${boxer.maxWeight.toFixed(1)}kg` : "要確認";
  const desiredRounds = boxer.rounds.length ? boxer.rounds.map((round) => `${round}R`).join(" / ") : "要確認";

  return <main className="mx-auto max-w-[1240px] px-4 py-6 lg:px-7">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Link className="text-xs font-black text-slate-700 underline underline-offset-4" href="/">← 検索結果に戻る</Link>
      {matchDataMode && <Link className="text-xs font-black text-slate-700 underline underline-offset-4" href="/candidates">候補選手を見る →</Link>}
    </div>

    <section className="border-y-2 border-slate-950 bg-white">
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex min-h-[260px] items-center justify-center bg-[#0b1825] text-6xl font-black text-white lg:min-h-[300px]">{boxer.name.slice(0,1)}</div>
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-black text-slate-600">{boxer.kana}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{boxer.name}</h1>
              <p className="mt-3 text-sm font-black text-slate-800">{boxer.division} · {boxer.boxerClass} · {boxer.stance}構え</p>
              <p className="mt-1 text-sm font-bold text-slate-600">{boxer.gym} / {boxer.prefecture} / {boxer.nationality}</p>
            </div>
            {matchDataMode && <div className="min-w-[170px] border-l-4 border-slate-950 pl-3">
              <p className="text-[10px] font-black tracking-[.12em] text-slate-600">MATCH STATUS</p>
              <span className={`mt-1.5 inline-flex border px-3 py-1.5 text-sm font-black ${boxer.status === "受付中" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : boxer.status === "条件次第" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-slate-300 bg-slate-100 text-slate-700"}`}>{boxer.status}</span>
              <p className="mt-2 text-xs font-black text-slate-800">{boxer.available}</p>
              <p className="mt-1 text-[11px] font-bold text-slate-600">ジム確認済み：{boxer.verified}</p>
            </div>}
          </div>

          <div className="mt-7 grid border-t border-slate-300 pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="戦績" value={record} />
            <Metric label="ランキング" value={formatTopRanking(boxer.rankings)} />
            <Metric label="最終試合" value={boxer.lastBout} />
            <Metric label="次戦" value={boxer.nextBout ? `${boxer.nextBout}${boxer.nextVenue ? ` / ${boxer.nextVenue}` : ""}` : "未定"} />
          </div>
        </div>
      </div>
    </section>

    {matchDataMode && <section className="mt-5 border-y-2 border-slate-950 bg-white">
      <div className="grid md:grid-cols-[1fr_1fr_1fr_auto] md:items-stretch">
        <ActionData label="試合可能時期" value={boxer.available} />
        <ActionData label="契約可能ウェイト" value={contractWeight} />
        <ActionData label="希望R / 遠征" value={`${desiredRounds} · ${boxer.travel}`} />
        <div className="flex min-w-[220px] flex-col justify-center gap-2 border-t border-slate-300 p-4 md:border-l md:border-t-0">
          <Link className="flex h-11 items-center justify-center bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800" href={`/matchmaking/new?boxer=${boxer.id}`}>所属ジムに相談</Link>
          <CandidateSaveButton boxerId={boxer.id} databaseConnected={databaseConnected} />
        </div>
      </div>
    </section>}

    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <Section title="戦績・ランキング">
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div>
              <Subhead>戦績</Subhead>
              <dl className="divide-y divide-slate-200 border-t border-slate-300">
                <Row label="総試合数" value={`${boxer.totalBouts}戦`} />
                <Row label="勝敗" value={`${boxer.wins}勝 ${boxer.losses}敗${boxer.draws ? ` ${boxer.draws}分` : ""}`} />
                <Row label="KO勝" value={`${boxer.koWins}KO`} />
                <Row label="最終試合" value={boxer.lastBout} />
              </dl>
            </div>
            <div>
              <Subhead>ランキング</Subhead>
              {boxer.rankings.length ? <div className="divide-y divide-slate-200 border-t border-slate-300">{boxer.rankings.map((ranking) => <div className="flex items-center justify-between gap-4 py-3 text-sm" key={`${ranking.body}-${ranking.rank}`}><b className="text-slate-800">{ranking.body}</b><span className="font-black text-slate-950">{ranking.rank ? `${ranking.rank}位` : ranking.title ?? "—"}</span></div>)}</div> : <p className="border-t border-slate-300 py-4 text-sm font-medium text-slate-600">現在表示できるランキングはありません。</p>}
            </div>
          </div>
        </Section>

        <Section title="試合予定">
          <div className="grid gap-0 border-t border-slate-300 sm:grid-cols-2">
            <div className="border-b border-slate-200 py-4 sm:border-b-0 sm:border-r sm:pr-5"><Data label="最終試合" value={boxer.lastBout} /></div>
            <div className="py-4 sm:pl-5"><Data label="次戦" value={boxer.nextBout ? `${boxer.nextBout}${boxer.nextVenue ? ` / ${boxer.nextVenue}` : ""}` : "未定"} /></div>
          </div>
        </Section>

        <Section title="基本情報">
          <dl className="grid border-t border-slate-300 sm:grid-cols-2">
            <Row label="所属ジム" value={boxer.gym} />
            <Row label="階級" value={boxer.division} />
            <Row label="クラス" value={boxer.boxerClass} />
            <Row label="構え" value={`${boxer.stance}構え`} />
            <Row label="身長 / リーチ" value={`${boxer.heightCm || "—"}cm / ${boxer.reachCm || "—"}cm`} />
            <Row label="国籍 / 年齢" value={`${boxer.nationality}${age !== null ? ` / ${age}歳` : ""}`} />
            <Row label="生年月日" value={boxer.birthDate || "—"} />
            <Row label="地域" value={boxer.prefecture} />
          </dl>
        </Section>
      </div>

      <aside className="space-y-6">
        {matchDataMode ? <section className="border border-slate-300 bg-white lg:sticky lg:top-20">
          <div className="bg-slate-950 px-4 py-3 text-white"><p className="text-[10px] font-black tracking-[.12em] text-slate-400">次の操作</p><h2 className="mt-0.5 text-base font-black">この選手を検討する</h2></div>
          <div className="p-4">
            <div className="space-y-4">
              <Data label="受付状況" value={boxer.status} />
              <Data label="試合可能時期" value={boxer.available} />
              <Data label="契約可能ウェイト" value={contractWeight} />
              <Data label="希望ラウンド" value={desiredRounds} />
              <Data label="遠征" value={boxer.travel} />
              <Data label="情報確認" value={`所属ジム確認：${boxer.verified}`} />
            </div>
            <div className="mt-5 border-t border-slate-300 pt-4">
              <Link className="flex h-12 items-center justify-center bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800" href={`/matchmaking/new?boxer=${boxer.id}`}>所属ジムに相談する</Link>
              <CandidateSaveButton boxerId={boxer.id} databaseConnected={databaseConnected} />
              <Link className="mt-3 flex h-10 items-center justify-center border border-slate-400 text-xs font-black text-slate-800 hover:border-slate-950" href="/open-matches">対戦相手募集を見る</Link>
            </div>
          </div>
        </section> : <section className="border border-slate-300 bg-white p-5">
          <h2 className="border-b border-slate-950 pb-3 text-sm font-black text-slate-950">業界向け情報</h2>
          <p className="mt-4 text-sm font-medium leading-6 text-slate-600">MATCH STATUS、契約ウェイト、希望R、試合可能時期は業界アカウントで表示します。</p>
          <Link className="mt-5 flex h-11 items-center justify-center border border-slate-950 bg-slate-950 text-sm font-black text-white" href={`/login?next=${encodeURIComponent(`/boxers/${boxer.id}`)}`}>業界ログイン</Link>
        </section>}

        {!databaseConnected && boxer.instagram && <section className="border border-slate-300 bg-white p-5"><h2 className="border-b border-slate-950 pb-3 text-sm font-black text-slate-950">SNS</h2><a className="mt-4 inline-block text-sm font-black text-slate-800 underline underline-offset-4" href={boxer.instagram} rel="noreferrer" target="_blank">Instagramを開く</a></section>}
      </aside>
    </div>
  </main>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border border-slate-300 bg-white p-5"><h2 className="mb-4 border-b-2 border-slate-950 pb-3 text-sm font-black text-slate-950">{title}</h2>{children}</section>;
}

function Subhead({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-xs font-black text-slate-700">{children}</h3>;
}

function Data({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-black tracking-[.04em] text-slate-600">{label}</p><p className="mt-1 text-sm font-black leading-6 text-slate-950">{value}</p></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-slate-200 py-3 pr-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0"><p className="text-[10px] font-black text-slate-600">{label}</p><p className="mt-1 text-sm font-black leading-5 text-slate-950">{value}</p></div>;
}

function ActionData({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-slate-300 p-4 last:border-b-0 md:border-b-0 md:border-r"><p className="text-[10px] font-black text-slate-600">{label}</p><p className="mt-1 text-sm font-black text-slate-950">{value}</p></div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-slate-200 py-3 text-sm sm:px-2"><dt className="font-bold text-slate-600">{label}</dt><dd className="m-0 font-black text-slate-950">{value}</dd></div>;
}

function formatTopRanking(rankings: { body: string; rank: number | null; title?: string }[]) {
  if (!rankings.length) return "—";
  return rankings.slice(0, 2).map((ranking) => `${ranking.body} ${ranking.rank ? `${ranking.rank}位` : ranking.title ?? ""}`.trim()).join(" / ");
}

function calculateAge(date: string) {
  const birth = new Date(`${date}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
