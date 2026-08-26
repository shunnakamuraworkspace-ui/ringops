export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const isSupabaseConfigured = SUPABASE_URL.startsWith("https://") && SUPABASE_PUBLISHABLE_KEY.length > 0;

export function requireSupabaseConfig() {
  if (!isSupabaseConfigured) throw new Error("Supabaseの公開環境変数が設定されていません。");
  return { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY };
}
