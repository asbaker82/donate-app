import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './types';
import { MOCK_USERS } from './mockData';

const STORAGE_KEY_CURRENT    = '@donate_app/auth_user';
const STORAGE_KEY_REGISTERED = '@donate_app/registered_users';
// Profile photo stored separately so it never bloats the user JSON arrays.
const STORAGE_KEY_PHOTO      = '@donate_app/profile_photo';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

// Strip the photo before writing to any user-list key.
function withoutPhoto(u: User): User {
  const { profilePhoto: _, ...rest } = u;
  return rest;
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
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [stored, regJson, photo] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_CURRENT),
          AsyncStorage.getItem(STORAGE_KEY_REGISTERED),
          AsyncStorage.getItem(STORAGE_KEY_PHOTO),
        ]);
        if (regJson) setRegisteredUsers(JSON.parse(regJson));
        if (stored) {
          const user: User = JSON.parse(stored);
          // Reattach photo stored in its own key
          if (photo) user.profilePhoto = photo;
          setAuthUser(user);
        }
      } catch {
        // ignore storage errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const allKnownUsers = (): User[] => [...MOCK_USERS, ...registeredUsers];

  const sendOTP = async (rawPhone: string) => {
    const phone = normalizePhone(rawPhone);
    setPendingPhone(phone);
    const existing = allKnownUsers().find(u => u.phone === phone);
    setIsExistingUser(!!existing);
  };

  const verifyOTP = async (code: string): Promise<boolean> => {
    if (code !== '1234') return false;
    if (!pendingPhone) return false;

    const existing = allKnownUsers().find(u => u.phone === pendingPhone);
    if (existing) {
      // Reattach saved photo when logging back in
      const photo = await AsyncStorage.getItem(STORAGE_KEY_PHOTO);
      const userWithPhoto = photo ? { ...existing, profilePhoto: photo } : existing;
      setAuthUser(userWithPhoto);
      await AsyncStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(withoutPhoto(existing)));
    }
    return true;
  };

  const completeRegistration = async (name: string) => {
    if (!pendingPhone) return;
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: '',
      phone: pendingPhone,
      friends: [],
    };
    const updatedReg = [...registeredUsers, newUser];
    setRegisteredUsers(updatedReg);
    setAuthUser(newUser);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(withoutPhoto(newUser))),
      AsyncStorage.setItem(STORAGE_KEY_REGISTERED, JSON.stringify(updatedReg.map(withoutPhoto))),
    ]);
  };

  const logout = async () => {
    setAuthUser(null);
    setPendingPhone(null);
    await AsyncStorage.removeItem(STORAGE_KEY_CURRENT);
    // Keep the photo so it's restored on next login
  };

  const updateAuthUser = async (updates: Partial<User>) => {
    if (!authUser) return;
    const updated = { ...authUser, ...updates };
    setAuthUser(updated);

    // Save photo separately; save everything else in the user JSON
    const { profilePhoto, ...userWithoutPhoto } = updated;
    await AsyncStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(userWithoutPhoto));
    if (profilePhoto) {
      await AsyncStorage.setItem(STORAGE_KEY_PHOTO, profilePhoto);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_PHOTO);
    }

    // Keep registered_users list current (photos never go in here)
    const isMock = MOCK_USERS.some(u => u.id === updated.id);
    if (!isMock) {
      const updatedReg = registeredUsers.map(u =>
        u.id === updated.id ? withoutPhoto(updated) : u
      );
      setRegisteredUsers(updatedReg);
      await AsyncStorage.setItem(STORAGE_KEY_REGISTERED, JSON.stringify(updatedReg));
    }
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
