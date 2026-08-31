"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BoxerPreview } from "@/features/boxers/data/preview-boxers";
import { createClient } from "@/lib/supabase/client";

export function ConsultationForm({ boxer, databaseConnected }: { boxer: BoxerPreview; databaseConnected: boolean }) {
  const router = useRouter();
  const defaultWeight = boxer.minWeight && boxer.maxWeight ? ((boxer.minWeight + boxer.maxWeight) / 2).toFixed(1) : "";
  const defaultRounds = String(boxer.rounds[0] ?? 6);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [event, setEvent] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [weight, setWeight] = useState(defaultWeight);
  const [rounds, setRounds] = useState(defaultRounds);
  const [message, setMessage] = useState("");

  function fillExample() {
    setEvent("秋季プロボクシング興行");
    setDate("2026-10-24");
    setVenue("後楽園ホール");
    setWeight(defaultWeight || "55.0");
    setRounds(defaultRounds);
    setMessage("対戦候補として条件をご相談したいです。日程・ウェイトをご確認ください。");
  }

  function saveLocalCase() {
    const existing = JSON.parse(localStorage.getItem("ringops_cases") || "[]") as unknown[];
    const id = `case-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const item = {
      id,
      boxerAId: null,
      boxerA: null,
      boxerBId: boxer.id,
      boxerB: boxer.name,
      event,
      date,
      venue,
      weight: `${weight}kg`,
      rounds: Number(rounds),
      message,
      status: "相談中",
      createdAt: now,
    };
    localStorage.setItem("ringops_cases", JSON.stringify([item, ...existing]));
    const messages = JSON.parse(localStorage.getItem("ringops_case_messages") || "{}") as Record<string, unknown[]>;
    messages[id] = [{ id: `msg-${crypto.randomUUID()}`, sender: "自組織", body: message || "相談を開始しました。", createdAt: now }];
    localStorage.setItem("ringops_case_messages", JSON.stringify(messages));
    router.push(`/matchmaking?created=${encodeURIComponent(id)}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (databaseConnected) {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data, error: rpcError } = await supabase.schema("ringops").rpc("start_boxer_consultation", {
            p_boxer_id: boxer.id,
            p_event_name: event,
            p_event_date: date,
            p_contract_weight_kg: Number(weight),
            p_rounds: Number(rounds),
            p_message: message || "対戦候補として相談を開始しました。",
          });
          if (rpcError) throw rpcError;
          if (venue) {
            const { error: venueError } = await supabase.schema("ringops").from("matchmaking_cases").update({ venue_name: venue }).eq("id", data);
            if (venueError) throw venueError;
          }
          router.push(`/matchmaking?created=${encodeURIComponent(String(data))}`);
          return;
        }
      }
      saveLocalCase();
    } catch {
      setError("相談を登録できませんでした。入力内容を確認してください。");
      setSaving(false);
    }
  }

  return <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
    <aside className="h-fit rounded-xl border border-[#e0e5ea] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)] lg:sticky lg:top-20">
      <p className="text-[11px] font-bold text-slate-400">相談する選手</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-[#173b5e] text-base font-black text-white">{boxer.name.slice(0, 1)}</div>
        <div><h2 className="font-black text-slate-950">{boxer.name}</h2><p className="mt-0.5 text-xs text-slate-500">{boxer.gym}</p></div>
      </div>
      <dl className="mt-5 divide-y divide-slate-100 border-t border-slate-100 text-xs">
        <SummaryRow label="階級" value={boxer.division} />
        <SummaryRow label="戦績" value={`${boxer.wins}勝 ${boxer.losses}敗${boxer.draws ? ` ${boxer.draws}分` : ""}`} />
        <SummaryRow label="受付" value={boxer.status} />
        <SummaryRow label="契約目安" value={boxer.minWeight && boxer.maxWeight ? `${boxer.minWeight.toFixed(1)}〜${boxer.maxWeight.toFixed(1)}kg` : "要確認"} />
      </dl>
      {!databaseConnected && <button className="mt-5 w-full rounded-lg border border-[#cbd6df] bg-[#f7fafc] px-3 py-2.5 text-xs font-bold text-[#315b7c] hover:bg-[#eef4f8]" onClick={fillExample} type="button">入力例をセット</button>}
    </aside>

    <form className="rounded-xl border border-[#e0e5ea] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)] sm:p-6" onSubmit={submit}>
      <div className="mb-5"><h2 className="text-lg font-black text-slate-950">試合条件</h2><p className="mt-1 text-xs text-slate-500">決まっている項目だけ入力してください。会場とメモは後から変更できます。</p></div>
      {error && <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p>}
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="興行名"><input className="input" required value={event} onChange={(e) => setEvent(e.target.value)} placeholder="例：10月後楽園興行" /></Field>
        <Field label="試合予定日"><input className="input" required type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="契約ウェイト"><div className="relative"><input className="input pr-10" inputMode="decimal" required type="number" step="0.1" min="35" max="150" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="55.0" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span></div></Field>
        <Field label="ラウンド"><select className="input" value={rounds} onChange={(e) => setRounds(e.target.value)}>{[4, 6, 8, 10, 12].map((v) => <option value={v} key={v}>{v}R</option>)}</select></Field>
        <div className="sm:col-span-2"><Field label="会場（任意）"><input className="input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="例：後楽園ホール" /></Field></div>
        <div className="sm:col-span-2"><Field label="メッセージ（任意）"><textarea className="min-h-24 w-full rounded-lg border border-[#b8c3cd] bg-white p-3 text-sm font-medium outline-none transition focus:border-[#315b7c] focus:ring-4 focus:ring-[#315b7c]/10" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="補足条件があれば入力" /></Field></div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <p className="text-[11px] text-slate-400">送信するとマッチメイク案件に追加されます。</p>
        <button className="h-11 rounded-lg bg-[#173b5e] px-5 text-sm font-black text-white shadow-sm hover:bg-[#102f4b] disabled:opacity-50" disabled={saving} type="submit">{saving ? "登録中…" : "相談を開始する"}</button>
      </div>
    </form>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mb-4 block"><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>{children}</label>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 py-2.5"><dt className="text-slate-400">{label}</dt><dd className="m-0 text-right font-bold text-slate-700">{value}</dd></div>;
}
