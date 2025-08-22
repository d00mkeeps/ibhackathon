// lib/supabaseClient.ts
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY!; // Add this to yer .env

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables, ye scallywag!");
}

// Hackathon mode: Full access, no auth needed! 🏴‍☠️
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Keep these helpers if ye need 'em, but they won't be needed for service key
export const getCurrentSession = async () => null; // No auth needed!
export const getCurrentUser = async () => null; // No auth needed!
