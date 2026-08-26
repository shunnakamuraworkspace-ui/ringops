import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { boxerPreviewData, type BoxerPreview, type Ranking } from "@/features/boxers/data/preview-boxers";

const divisions: Record<string, string> = {
  minimum: "ミニマム級", light_fly: "ライトフライ級", fly: "フライ級", super_fly: "スーパーフライ級",
  bantam: "バンタム級", super_bantam: "スーパーバンタム級", feather: "フェザー級", super_feather: "スーパーフェザー級",
  light: "ライト級", super_light: "スーパーライト級", welter: "ウェルター級", super_welter: "スーパーウェルター級",
  middle: "ミドル級", super_middle: "スーパーミドル級", light_heavy: "ライトヘビー級", cruiser: "クルーザー級", heavy: "ヘビー級",
};

const prefectures: Record<string, string> = { "11": "埼玉県", "13": "東京都", "14": "神奈川県" };
const statusLabels = { accepting: "受付中", conditional: "条件次第", paused: "受付停止" } as const;

type LoadResult = { boxers: BoxerPreview[]; databaseConnected: boolean; industryMode: boolean };

export async function loadBoxers(): Promise<LoadResult> {
  if (!isSupabaseConfigured) return { boxers: boxerPreviewData, databaseConnected: false, industryMode: true };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  let industryMode = false;
  if (user) {
    const { data: memberships } = await supabase.schema("ringops").from("organization_memberships")
      .select("organization_id").eq("user_id", user.id).eq("status", "active").limit(1);
    industryMode = Boolean(memberships?.length);
  }

  const { data: boxerRows, error } = await supabase.schema("ringops").from("boxers")
    .select("id,organization_id,name,name_kana,nationality,country_code,prefecture_code,birth_date,height_cm,reach_cm,division_code,boxer_class,stance,total_bouts,wins,losses,draws,ko_wins,last_bout_date,next_bout_date,next_venue_name")
    .eq("is_public", true).order("name_kana");

  if (error || !boxerRows?.length) return { boxers: boxerPreviewData, databaseConnected: false, industryMode: true };

  const boxerIds = boxerRows.map((row) => row.id);
  const organizationIds = [...new Set(boxerRows.map((row) => row.organization_id))];
  const [{ data: organizations }, { data: rankingRows }, statusResult] = await Promise.all([
    supabase.schema("ringops").from("organizations").select("id,display_name").in("id", organizationIds),
    supabase.schema("ringops").from("rankings").select("boxer_id,ranking_body,rank,champion_status,ranking_date").in("boxer_id", boxerIds).order("ranking_date", { ascending: false }),
    industryMode
      ? supabase.schema("ringops").from("boxer_match_statuses").select("boxer_id,status,available_from,min_contract_weight_kg,max_contract_weight_kg,desired_rounds,travel_condition,verified_at").in("boxer_id", boxerIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const orgMap = new Map((organizations ?? []).map((item) => [item.id, item.display_name]));
  const statusMap = new Map((statusResult.data ?? []).map((item: any) => [item.boxer_id, item]));
  const rankingMap = new Map<string, Ranking[]>();
  const seenRankingBody = new Set<string>();
  for (const row of rankingRows ?? []) {
    const key = `${row.boxer_id}:${row.ranking_body}`;
    if (seenRankingBody.has(key)) continue;
    seenRankingBody.add(key);
    const list = rankingMap.get(row.boxer_id) ?? [];
    list.push({ body: row.ranking_body, rank: row.rank, title: row.champion_status !== "none" ? row.champion_status : undefined });
    rankingMap.set(row.boxer_id, list);
  }

  const boxers: BoxerPreview[] = boxerRows.map((row) => {
    const status: any = statusMap.get(row.id);
    return {
      id: row.id,
      name: row.name,
      kana: row.name_kana,
      gym: orgMap.get(row.organization_id) ?? "所属ジム",
      prefecture: prefectures[row.prefecture_code ?? ""] ?? "—",
      nationality: row.nationality ?? row.country_code ?? "—",
      division: divisions[row.division_code] ?? row.division_code,
      boxerClass: `${row.boxer_class}級` as BoxerPreview["boxerClass"],
      stance: row.stance === "southpaw" ? "左" : "右",
      totalBouts: row.total_bouts,
      wins: row.wins,
      losses: row.losses,
      draws: row.draws,
      koWins: row.ko_wins,
      rankings: rankingMap.get(row.id) ?? [],
      lastBout: formatDate(row.last_bout_date),
      nextBout: row.next_bout_date ? formatDate(row.next_bout_date) : null,
      nextVenue: row.next_venue_name ?? null,
      status: status ? statusLabels[status.status as keyof typeof statusLabels] : "受付停止",
      available: industryMode ? formatAvailable(status?.available_from) : "—",
      availableMonth: industryMode && status?.available_from ? String(status.available_from).slice(0, 7) : "",
      rounds: industryMode ? (status?.desired_rounds ?? []) : [],
      minWeight: industryMode && status?.min_contract_weight_kg != null ? Number(status.min_contract_weight_kg) : 0,
      maxWeight: industryMode && status?.max_contract_weight_kg != null ? Number(status.max_contract_weight_kg) : 0,
      travel: industryMode ? (status?.travel_condition ?? "—") : "—",
      verified: industryMode ? relativeDate(status?.verified_at) : "—",
      heightCm: Number(row.height_cm ?? 0),
      reachCm: Number(row.reach_cm ?? 0),
      birthDate: row.birth_date ?? "",
    };
  });

  return { boxers, databaseConnected: true, industryMode };
}

export async function loadBoxer(id: string) {
  const result = await loadBoxers();
  return { ...result, boxer: result.boxers.find((item) => item.id === id) ?? null };
}

function formatDate(value: string | null) { return value ? value.replaceAll("-", ".") : "—"; }
function formatAvailable(value?: string | null) {
  if (!value) return "要確認";
  const [year, month] = value.split("-");
  return `${year}年${Number(month)}月以降`;
}
function relativeDate(value?: string | null) {
  if (!value) return "未確認";
  const diff = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  if (diff === 0) return "今日";
  if (diff === 1) return "昨日";
  return `${diff}日前`;
}
