import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Item, User, SearchNotification } from './types';
import { MOCK_USERS, MOCK_ITEMS } from './mockData';

interface AppContextType {
  currentUser: User;
  users: User[];
  items: Item[];
  getUserById: (id: string) => User | undefined;
  getFriendItems: () => Item[];
  getMyItems: () => Item[];
  createItem: (data: Omit<Item, 'id' | 'donorId' | 'status' | 'waitlist' | 'createdAt'>) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  claimItem: (itemId: string) => void;
  joinWaitlist: (itemId: string) => void;
  leaveWaitlist: (itemId: string) => void;
  releaseClaim: (itemId: string) => void;
  markPickedUp: (itemId: string) => void;
  markDisposed: (itemId: string) => void;
  // Search history
  searchHistory: string[];
  addToSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
  // Search notifications
  searchNotifications: SearchNotification[];
  addSearchNotification: (keyword: string) => boolean; // returns true if keyword already exists
  updateSearchNotification: (id: string, keyword: string) => void;
  deleteSearchNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser] = useState<User>(MOCK_USERS[0]);
  const [users] = useState<User[]>(MOCK_USERS);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchNotifications, setSearchNotifications] = useState<SearchNotification[]>([]);

  const processExpiredClaims = useCallback(() => {
    setItems(prev =>
      prev.map(item => {
        if (item.status !== 'claimed' || !item.claimDeadline) return item;
        if (new Date(item.claimDeadline) > new Date()) return item;

        if (item.waitlist.length > 0) {
          const [nextUp, ...rest] = item.waitlist;
          return {
            ...item,
            claimedBy: nextUp,
            claimDeadline: new Date(
              Date.now() + item.claimPickupHours * 60 * 60 * 1000
            ).toISOString(),
            waitlist: rest,
          };
        }
        return {
          ...item,
          status: 'available' as const,
          claimedBy: undefined,
          claimDeadline: undefined,
        };
      })
    );
  }, []);

  useEffect(() => {
    processExpiredClaims();
    const interval = setInterval(processExpiredClaims, 30000);
    return () => clearInterval(interval);
  }, [processExpiredClaims]);

  const getUserById = (id: string) => users.find(u => u.id === id);

  const getFriendItems = () => {
    const friendIds = new Set(currentUser.friends);
    return items.filter(
      item =>
        friendIds.has(item.donorId) &&
        item.status !== 'picked_up' &&
        item.status !== 'disposed'
    );
  };

  const getMyItems = () => items.filter(item => item.donorId === currentUser.id);

  const createItem = (data: Omit<Item, 'id' | 'donorId' | 'status' | 'waitlist' | 'createdAt'>) => {
    const newItem: Item = {
      ...data,
      id: `item-${Date.now()}`,
      donorId: currentUser.id,
      status: 'available',
      waitlist: [],
      createdAt: new Date().toISOString(),
    };
    setItems(prev => [newItem, ...prev]);
  };

  const updateItem = (id: string, updates: Partial<Item>) =>
    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));

  const deleteItem = (id: string) =>
    setItems(prev => prev.filter(item => item.id !== id));

  const claimItem = (itemId: string) =>
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId || item.status !== 'available') return item;
        return {
          ...item,
          status: 'claimed' as const,
          claimedBy: currentUser.id,
          claimDeadline: new Date(
            Date.now() + item.claimPickupHours * 60 * 60 * 1000
          ).toISOString(),
        };
      })
    );

  const joinWaitlist = (itemId: string) =>
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId || item.waitlist.includes(currentUser.id)) return item;
        return { ...item, waitlist: [...item.waitlist, currentUser.id] };
      })
    );

  const leaveWaitlist = (itemId: string) =>
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        return { ...item, waitlist: item.waitlist.filter(id => id !== currentUser.id) };
      })
    );

  const releaseClaim = (itemId: string) =>
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId || item.claimedBy !== currentUser.id) return item;
        if (item.waitlist.length > 0) {
          const [nextUp, ...rest] = item.waitlist;
          return {
            ...item,
            claimedBy: nextUp,
            claimDeadline: new Date(
              Date.now() + item.claimPickupHours * 60 * 60 * 1000
            ).toISOString(),
            waitlist: rest,
          };
        }
        return {
          ...item,
          status: 'available' as const,
          claimedBy: undefined,
          claimDeadline: undefined,
        };
      })
    );

  const markPickedUp = (itemId: string) =>
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, status: 'picked_up' as const } : item
      )
    );

  const markDisposed = (itemId: string) =>
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, status: 'disposed' as const } : item
      )
    );

  const addToSearchHistory = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setSearchHistory(prev => {
      const deduped = prev.filter(h => h.toLowerCase() !== t.toLowerCase());
      return [t, ...deduped].slice(0, 10);
    });
  };

  const clearSearchHistory = () => setSearchHistory([]);

  const addSearchNotification = (keyword: string): boolean => {
    const k = keyword.trim().toLowerCase();
    if (!k) return false;
    const exists = searchNotifications.some(n => n.keyword.toLowerCase() === k);
    if (exists) return true;
    setSearchNotifications(prev => [
      { id: `notif-${Date.now()}`, keyword: keyword.trim(), createdAt: new Date().toISOString() },
      ...prev,
    ]);
    return false;
  };

  const updateSearchNotification = (id: string, keyword: string) =>
    setSearchNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, keyword: keyword.trim() } : n))
    );

  const deleteSearchNotification = (id: string) =>
    setSearchNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        items,
        getUserById,
        getFriendItems,
        getMyItems,
        createItem,
        updateItem,
        deleteItem,
        claimItem,
        joinWaitlist,
        leaveWaitlist,
        releaseClaim,
        markPickedUp,
        markDisposed,
        searchHistory,
        addToSearchHistory,
        clearSearchHistory,
        searchNotifications,
        addSearchNotification,
        updateSearchNotification,
        deleteSearchNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
