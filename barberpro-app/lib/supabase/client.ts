import { createBrowserClient } from "@supabase/ssr";

let browserSupabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "As variaveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY sao obrigatorias.",
    );
  }

  if (!browserSupabaseClient) {
    browserSupabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserSupabaseClient;
}