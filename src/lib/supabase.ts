// Supabase client for React Native (Expo).
// Session persistence uses a global `localStorage`:
//   • native: install expo-sqlite's localStorage shim (no async-storage needed)
//   • web: the browser already provides window.localStorage
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

if (Platform.OS !== 'web') {
  require('expo-sqlite/localStorage/install');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Surface a clear message during the demo if .env wasn't filled in.
  console.warn(
    '[BAMX] Missing Supabase env vars. Copy .env.example to .env and set ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
