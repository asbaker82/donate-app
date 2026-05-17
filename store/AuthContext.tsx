import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProfile, upsertProfile } from './db';
import type { User } from './types';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

const DEV_BYPASS = process.env.EXPO_PUBLIC_DEV_OTP_BYPASS === 'true';
const DEV_PASS   = 'YoinkItDev2025!';

function devEmail(phone: string): string {
  return `dev_${phone.replace(/\D/g, '')}@yoinkit.dev`;
}

interface AuthContextType {
  authUser: User | null;
  isLoading: boolean;
  pendingPhone: string | null;
  isExistingUser: boolean;
  sendOTP: (rawPhone: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<boolean>;
  completeRegistration: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAuthUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser]             = useState<User | null>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [pendingPhone, setPendingPhone]     = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setAuthUser(profile);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setAuthUser(null);
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const profile = await fetchProfile(session.user.id);
          setAuthUser(profile);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const sendOTP = async (rawPhone: string): Promise<void> => {
    const phone = normalizePhone(rawPhone);
    setPendingPhone(phone);

    if (DEV_BYPASS) {
      const email = devEmail(phone);
      // Try signing in first (existing dev account)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: DEV_PASS,
      });
      if (signInError) {
        // New dev account — sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: DEV_PASS,
        });
        if (signUpError) throw signUpError;
        setIsExistingUser(false);
      } else {
        // Check if a profile exists for this phone
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', phone)
          .maybeSingle();
        setIsExistingUser(!!data);
      }
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: 'sms' },
    });
    if (error) throw error;
  };

  const verifyOTP = async (code: string): Promise<boolean> => {
    if (DEV_BYPASS) {
      // Session was already established in sendOTP — any code works
      return code.length === 4;
    }

    if (!pendingPhone) return false;
    const { data, error } = await supabase.auth.verifyOtp({
      phone: pendingPhone,
      token: code,
      type:  'sms',
    });
    if (error || !data.session) return false;
    return true;
  };

  const completeRegistration = async (name: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const profile = await upsertProfile({
      id:    session.user.id,
      name:  name.trim(),
      email: session.user.email ?? '',
      phone: pendingPhone ?? session.user.phone ?? '',
    });
    setAuthUser(profile);
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setPendingPhone(null);
  };

  const updateAuthUser = async (updates: Partial<User>): Promise<void> => {
    if (!authUser) return;

    const { updateProfile } = await import('./db');
    const fieldMap: Record<string, unknown> = {};

    if (updates.name           !== undefined) fieldMap.name            = updates.name;
    if (updates.email          !== undefined) fieldMap.email           = updates.email;
    if (updates.defaultAddress !== undefined) fieldMap.default_address = updates.defaultAddress ?? null;
    if (updates.itemVisibility !== undefined) fieldMap.item_visibility = updates.itemVisibility;
    if (updates.profilePhoto   !== undefined) fieldMap.profile_photo   = updates.profilePhoto ?? null;
    if (updates.friends        !== undefined) fieldMap.friends         = updates.friends;

    const updated = await updateProfile(authUser.id, fieldMap as Parameters<typeof updateProfile>[1]);
    setAuthUser(updated);
  };

  return (
    <AuthContext.Provider value={{
      authUser,
      isLoading,
      pendingPhone,
      isExistingUser,
      sendOTP,
      verifyOTP,
      completeRegistration,
      logout,
      updateAuthUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { normalizePhone };
export type { AuthContextType };
