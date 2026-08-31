import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { boxerPreviewData, type BoxerPreview, type Ranking } from "@/features/boxers/data/preview-boxers";

const divisions: Record<string, string> = {
  atom: "アトム級",
  mini_fly: "ミニフライ級",
  minimum: "ミニマム級",
  light_fly: "ライトフライ級",
  fly: "フライ級",
  super_fly: "スーパーフライ級",
  bantam: "バンタム級",
  super_bantam: "スーパーバンタム級",
  feather: "フェザー級",
  super_feather: "スーパーフェザー級",
  light: "ライト級",
  super_light: "スーパーライト級",
  welter: "ウェルター級",
  super_welter: "スーパーウェルター級",
  middle: "ミドル級",
  super_middle: "スーパーミドル級",
  light_heavy: "ライトヘビー級",
  cruiser: "クルーザー級",
  heavy: "ヘビー級",
};

const prefectures: Record<string, string> = {
  "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県", "06": "山形県", "07": "福島県",
  "08": "茨城県", "09": "栃木県", "10": "群馬県", "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県",
  "15": "新潟県", "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
  "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県",
  "25": "滋賀県", "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県",
  "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県",
  "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県",
  "40": "福岡県", "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県", "46": "鹿児島県", "47": "沖縄県",
};

const statusLabels = { accepting: "受付中", conditional: "条件次第", paused: "受付停止" } as const;

type LoadResult = {
  boxers: BoxerPreview[];
  databaseConnected: boolean;
  industryMode: boolean;
  reviewMode: boolean;
  loadError: string | null;
};

export async function loadBoxers(): Promise<LoadResult> {
  if (!isSupabaseConfigured) {
    return {
      boxers: boxerPreviewData,
      databaseConnected: false,
      industryMode: true,
      reviewMode: true,
      loadError: null,
    };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  let industryMode = false;
  let reviewMode = false;

  if (user) {
    const { data: memberships, error: membershipError } = await supabase
      .schema("ringops")
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    if (membershipError) {
      return {
        boxers: [],
        databaseConnected: true,
        industryMode: false,
        reviewMode: false,
        loadError: "業界アカウント情報を読み込めませんでした。",
      };
    }

    industryMode = Boolean(memberships?.length);
  }

  const { data: boxerRows, error: boxerError } = await supabase
    .schema("ringops")
    .from("boxers")
    .select("id,organization_id,name,name_kana,nationality,country_code,residence_country_code,domestic_or_international,competition_category,prefecture_code,birth_date,height_cm,reach_cm,division_code,boxer_class,stance,total_bouts,wins,losses,draws,ko_wins,last_bout_date,next_bout_date,next_venue_name")
    .eq("is_public", true)
    .order("name_kana");

  if (boxerError) {
    return {
      boxers: [],
      databaseConnected: true,
      industryMode,
      reviewMode,
      loadError: "選手データを読み込めませんでした。時間をおいて再度お試しください。",
    };
  }

  if (!boxerRows?.length) {
    return {
      boxers: [],
      databaseConnected: true,
      industryMode,
      reviewMode,
      loadError: null,
    };
  }

  const boxerIds = boxerRows.map((row) => row.id);
  const organizationIds = [...new Set(boxerRows.map((row) => row.organization_id))];
  const [organizationResult, rankingResult, statusResult] = await Promise.all([
    supabase.schema("ringops").from("organizations").select("id,display_name").in("id", organizationIds),
    supabase.schema("ringops").from("rankings").select("boxer_id,ranking_body,rank,champion_status,ranking_date").in("boxer_id", boxerIds).order("ranking_date", { ascending: false }),
    industryMode
      ? supabase.schema("ringops").from("boxer_match_statuses").select("boxer_id,status,available_from,min_contract_weight_kg,max_contract_weight_kg,desired_rounds,travel_condition,verified_at").in("boxer_id", boxerIds)
      : !user
        ? supabase.schema("ringops").rpc("get_demo_match_statuses")
        : Promise.resolve({ data: [] as Array<Record<string, unknown>>, error: null }),
  ]);

  if (organizationResult.error || rankingResult.error || statusResult.error) {
    return {
      boxers: [],
      databaseConnected: true,
      industryMode,
      reviewMode,
      loadError: "選手関連データの読み込みに失敗しました。管理者へお問い合わせください。",
    };
  }

  reviewMode = !industryMode && !user && Boolean(statusResult.data?.length);
  const canViewMatchData = industryMode || reviewMode;

  const orgMap = new Map((organizationResult.data ?? []).map((item) => [item.id, item.display_name]));
  const statusMap = new Map((statusResult.data ?? []).map((item: any) => [item.boxer_id, item]));
  const rankingMap = new Map<string, Ranking[]>();
  const seenRankingBody = new Set<string>();

  for (const row of rankingResult.data ?? []) {
    const key = `${row.boxer_id}:${row.ranking_body}`;
    if (seenRankingBody.has(key)) continue;
    seenRankingBody.add(key);
    const list = rankingMap.get(row.boxer_id) ?? [];
    list.push({
      body: row.ranking_body,
      rank: row.rank,
      title: row.champion_status !== "none" ? row.champion_status : undefined,
    });
    rankingMap.set(row.boxer_id, list);
  }

  const boxers: BoxerPreview[] = boxerRows.map((row) => {
    const status: any = statusMap.get(row.id);
    const domesticOrInternational: BoxerPreview["domesticOrInternational"] =
      row.domestic_or_international === "international" ? "海外" : "国内";
    const competitionCategory: BoxerPreview["competitionCategory"] =
      row.competition_category === "women" ? "女子" : row.competition_category === "men" ? "男子" : undefined;

    return {
      id: row.id,
      name: row.name,
      kana: row.name_kana,
      gym: orgMap.get(row.organization_id) ?? "所属ジム",
      prefecture: prefectures[row.prefecture_code ?? ""] ?? (domesticOrInternational === "海外" ? "海外" : "—"),
      nationality: row.nationality ?? row.country_code ?? "—",
      countryCode: row.country_code ?? undefined,
      domesticOrInternational,
      competitionCategory,
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
      available: canViewMatchData ? formatAvailable(status?.available_from) : "—",
      availableMonth: canViewMatchData && status?.available_from ? String(status.available_from).slice(0, 7) : "",
      rounds: canViewMatchData ? (status?.desired_rounds ?? []) : [],
      minWeight: canViewMatchData && status?.min_contract_weight_kg != null ? Number(status.min_contract_weight_kg) : 0,
      maxWeight: canViewMatchData && status?.max_contract_weight_kg != null ? Number(status.max_contract_weight_kg) : 0,
      travel: canViewMatchData ? (status?.travel_condition ?? "—") : "—",
      verified: canViewMatchData ? relativeDate(status?.verified_at) : "—",
      heightCm: Number(row.height_cm ?? 0),
      reachCm: Number(row.reach_cm ?? 0),
      birthDate: row.birth_date ?? "",
    };
  });

  return {
    boxers,
    databaseConnected: true,
    industryMode,
    reviewMode,
    loadError: null,
  };
}

export async function loadBoxer(id: string) {
  const result = await loadBoxers();
  return {
    ...result,
    boxer: result.boxers.find((item) => item.id === id) ?? null,
  };
}

function formatDate(value: string | null) {
  return value ? value.replaceAll("-", ".") : "—";
}

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
