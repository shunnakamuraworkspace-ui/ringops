const DEFAULT_SUPABASE_URL = "https://hwhavzxkpgpjnqhzebgl.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_79Qi9EsZOcQ-Gtt6n6GseQ_1fCzrv0O";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = SUPABASE_URL.startsWith("https://") && SUPABASE_PUBLISHABLE_KEY.length > 0;

export function requireSupabaseConfig() {
  if (!isSupabaseConfigured) throw new Error("RINGOPS専用Supabaseへ接続できません。公開設定を確認してください。");
  return { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY };
}
