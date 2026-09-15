import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Falls back to a placeholder so the app (and web builds) start even before
// the real keys are set. Real values come from EXPO_PUBLIC_* env vars.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(url, anon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
