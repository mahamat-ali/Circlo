import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { useSession } from "@clerk/clerk-expo";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublicKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabasePublicKey) {
  throw new Error("Missing Supabase URL or Public Key");
}

export const useClerkSupabaseClient = () => {
  const { session } = useSession();

  return createClient(supabaseUrl, supabasePublicKey, {
    accessToken: async () => {
      return session ? await session.getToken() : null;
    },

    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });
};
