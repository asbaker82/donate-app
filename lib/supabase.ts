import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// On web, use localStorage directly with a guard for SSR (window is undefined in Node.js).
// On native, use AsyncStorage.
const storage = Platform.OS === 'web'
  ? {
      getItem: (key: string): Promise<string | null> => {
        if (typeof window === 'undefined') return Promise.resolve(null);
        return Promise.resolve(window.localStorage.getItem(key));
      },
      setItem: (key: string, value: string): Promise<void> => {
        if (typeof window === 'undefined') return Promise.resolve();
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string): Promise<void> => {
        if (typeof window === 'undefined') return Promise.resolve();
        window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    }
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});
