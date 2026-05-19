import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { QUERY_KEYS } from '@/lib/queryClient';
import {
  fetchAllItems,
  fetchAllProfiles,
  fetchNotifications,
  insertItem,
  updateItemFields,
  deleteItem as dbDeleteItem,
  insertNotification,
  deleteNotification as dbDeleteNotification,
  updateProfile,
} from './db';
import type { Item, User, SearchNotification, BorrowRequest, BlockedPeriod } from './types';
import { useAuth } from './AuthContext';

interface AppContextType {
  currentUser: User;
  users: User[];
  items: Item[];
  getUserById: (id: string) => User | undefined;
  getFriendItems: () => Item[];
  getMyItems: () => Item[];
  createItem: (data: Omit<Item, 'id' | 'donorId' | 'status' | 'waitlist' | 'createdAt' | 'borrowRequests' | 'borrowedBy' | 'borrowedUntil'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  claimItem: (itemId: string) => Promise<void>;
  joinWaitlist: (itemId: string) => Promise<void>;
  leaveWaitlist: (itemId: string) => Promise<void>;
  releaseClaim: (itemId: string) => Promise<void>;
  markPickedUp: (itemId: string) => Promise<void>;
  confirmPickup: (itemId: string) => Promise<void>;
  markDisposed: (itemId: string) => Promise<void>;
  // Borrow flow
  createBorrowRequest: (itemId: string, startDate: string, endDate: string) => Promise<void>;
  cancelBorrowRequest: (itemId: string, requestId: string) => Promise<void>;
  approveBorrowRequest: (itemId: string, requestId: string) => Promise<void>;
  rejectBorrowRequest: (itemId: string, requestId: string) => Promise<void>;
  markBorrowReturned: (itemId: string) => Promise<void>;
  confirmBorrowReturn: (itemId: string) => Promise<void>;
  addBlockedPeriod: (itemId: string, period: BlockedPeriod) => Promise<void>;
  removeBlockedPeriod: (itemId: string, index: number) => Promise<void>;
  // Dismissed items (local, per-user)
  dismissed: Set<string>;
  dismissItem: (itemId: string) => void;
  restoreItem: (itemId: string) => void;
  restoreAll: () => void;
  // Search history (local only)
  searchHistory: string[];
  addToSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
  // Search notifications (Supabase-backed)
  searchNotifications: SearchNotification[];
  addSearchNotification: (keyword: string) => Promise<boolean>;
  updateSearchNotification: (id: string, keyword: string) => Promise<void>;
  deleteSearchNotification: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function itemToUpdateFields(updates: Partial<Item>) {
  const f: Record<string, unknown> = {};
  if (updates.title               !== undefined) f.title               = updates.title;
  if (updates.description         !== undefined) f.description         = updates.description;
  if (updates.photos              !== undefined) f.photos              = updates.photos;
  if (updates.condition           !== undefined) f.condition           = updates.condition;
  if (updates.restrictions        !== undefined) f.restrictions        = updates.restrictions ?? null;
  if (updates.pickupLocation      !== undefined) f.pickup_location     = updates.pickupLocation;
  if (updates.pickupWindow        !== undefined) f.pickup_window       = updates.pickupWindow;
  if (updates.disposalDate        !== undefined) f.disposal_date       = updates.disposalDate;
  if (updates.disposalMethod      !== undefined) f.disposal_method     = updates.disposalMethod;
  if (updates.disposalMethodNote  !== undefined) f.disposal_method_note = updates.disposalMethodNote ?? null;
  if (updates.claimPickupHours    !== undefined) f.claim_pickup_hours  = updates.claimPickupHours;
  if (updates.status              !== undefined) f.status              = updates.status;
  if (updates.claimedBy           !== undefined) f.claimed_by          = updates.claimedBy ?? null;
  if (updates.claimDeadline       !== undefined) f.claim_deadline      = updates.claimDeadline ?? null;
  if (updates.waitlist            !== undefined) f.waitlist            = updates.waitlist;
  if (updates.borrowRequests      !== undefined) f.borrow_requests     = updates.borrowRequests;
  if (updates.blockedPeriods      !== undefined) f.blocked_periods     = updates.blockedPeriods;
  if (updates.borrowedBy          !== undefined) f.borrowed_by         = updates.borrowedBy ?? null;
  if (updates.borrowedUntil       !== undefined) f.borrowed_until      = updates.borrowedUntil ?? null;
  return f as Parameters<typeof updateItemFields>[1];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { authUser } = useAuth();
  const qc = useQueryClient();

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const currentUser: User = authUser ?? { id: '', name: '', email: '', phone: '', friends: [] };

  const dismissedKey = currentUser.id ? `@yoink_it/dismissed/${currentUser.id}` : null;

  useEffect(() => {
    if (!dismissedKey) return;
    AsyncStorage.getItem(dismissedKey).then(raw => {
      if (raw) setDismissed(new Set(JSON.parse(raw)));
      else setDismissed(new Set());
    });
  }, [dismissedKey]);

  const dismissItem = useCallback((itemId: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(itemId);
      if (dismissedKey) AsyncStorage.setItem(dismissedKey, JSON.stringify([...next]));
      return next;
    });
  }, [dismissedKey]);

  const restoreItem = useCallback((itemId: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      if (dismissedKey) AsyncStorage.setItem(dismissedKey, JSON.stringify([...next]));
      return next;
    });
  }, [dismissedKey]);

  const restoreAll = useCallback(() => {
    setDismissed(new Set());
    if (dismissedKey) AsyncStorage.removeItem(dismissedKey);
  }, [dismissedKey]);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: items = [] } = useQuery({
    queryKey: QUERY_KEYS.items,
    queryFn:  fetchAllItems,
    enabled:  !!authUser,
  });

  const { data: users = [] } = useQuery({
    queryKey: QUERY_KEYS.profiles,
    queryFn:  fetchAllProfiles,
    enabled:  !!authUser,
  });

  const { data: searchNotifications = [] } = useQuery({
    queryKey: QUERY_KEYS.myNotifications(currentUser.id),
    queryFn:  () => fetchNotifications(currentUser.id),
    enabled:  !!authUser?.id,
  });

  // ── Realtime subscription for items ───────────────────────────────────────

  useEffect(() => {
    if (!authUser) return;
    const channel = supabase
      .channel('items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.items });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [!!authUser]);

  // ── Expired-claim processor ────────────────────────────────────────────────
  // Runs locally every 30 s, writes to Supabase so Realtime propagates to all clients.

  const processExpiredClaims = useCallback(async () => {
    const snapshot: Item[] = qc.getQueryData(QUERY_KEYS.items) ?? [];
    const now = Date.now();
    for (const item of snapshot) {
      if (item.status !== 'claimed' || !item.claimDeadline) continue;
      if (new Date(item.claimDeadline).getTime() > now) continue;

      if (item.waitlist.length > 0) {
        const [nextUp, ...rest] = item.waitlist;
        await updateItemFields(item.id, {
          claimed_by:     nextUp,
          claim_deadline: new Date(now + item.claimPickupHours * 3600000).toISOString(),
          waitlist:       rest,
        });
      } else {
        await updateItemFields(item.id, {
          status:        'available',
          claimed_by:    null,
          claim_deadline: null,
        });
      }
    }
  }, [qc]);

  useEffect(() => {
    if (!authUser) return;
    processExpiredClaims();
    const interval = setInterval(processExpiredClaims, 30000);
    return () => clearInterval(interval);
  }, [authUser, processExpiredClaims]);

  // ── Mutation helpers ───────────────────────────────────────────────────────

  const optimisticItemUpdate = (itemId: string, patch: Partial<Item>) => {
    qc.setQueryData<Item[]>(QUERY_KEYS.items, prev =>
      (prev ?? []).map(i => (i.id === itemId ? { ...i, ...patch } : i))
    );
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createItemMutation = useMutation({
    mutationFn: (data: Omit<Item, 'id' | 'donorId' | 'status' | 'waitlist' | 'createdAt' | 'borrowRequests' | 'borrowedBy' | 'borrowedUntil'>) =>
      insertItem({ ...data, donorId: currentUser.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Item> }) =>
      updateItemFields(id, itemToUpdateFields(updates)),
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      optimisticItemUpdate(id, updates);
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => dbDeleteItem(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      qc.setQueryData<Item[]>(QUERY_KEYS.items, prev => (prev ?? []).filter(i => i.id !== id));
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  // ── Item status mutations (all optimistic) ─────────────────────────────────

  type ClaimVars = { itemId: string; claimDeadline: string };
  const claimItemMutation = useMutation({
    mutationFn: ({ itemId, claimDeadline }: ClaimVars) =>
      updateItemFields(itemId, {
        status:         'claimed',
        claimed_by:     currentUser.id,
        claim_deadline: claimDeadline,
      }),
    onMutate: async ({ itemId, claimDeadline }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      optimisticItemUpdate(itemId, {
        status:        'claimed',
        claimedBy:     currentUser.id,
        claimDeadline,
      });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  type WaitlistVars = { itemId: string; newWaitlist: string[] };
  const joinWaitlistMutation = useMutation({
    mutationFn: ({ itemId, newWaitlist }: WaitlistVars) =>
      updateItemFields(itemId, { waitlist: newWaitlist }),
    onMutate: async ({ itemId, newWaitlist }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      optimisticItemUpdate(itemId, { waitlist: newWaitlist });
      return { snapshot };
    },
    onError: (e, _v, ctx) => {
      console.error('[joinWaitlist] Supabase error:', e);
      if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  const leaveWaitlistMutation = useMutation({
    mutationFn: ({ itemId, newWaitlist }: WaitlistVars) =>
      updateItemFields(itemId, { waitlist: newWaitlist }),
    onMutate: async ({ itemId, newWaitlist }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      optimisticItemUpdate(itemId, { waitlist: newWaitlist });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  type ReleaseVars = { itemId: string } & (
    | { hasWaiter: true;  nextUp: string; rest: string[]; claimDeadline: string; claimPickupHours: number }
    | { hasWaiter: false }
  );
  const releaseClaimMutation = useMutation({
    mutationFn: (vars: ReleaseVars) => {
      if (vars.hasWaiter) {
        return updateItemFields(vars.itemId, {
          claimed_by:     vars.nextUp,
          claim_deadline: vars.claimDeadline,
          waitlist:       vars.rest,
        });
      }
      return updateItemFields(vars.itemId, {
        status:        'available',
        claimed_by:    null,
        claim_deadline: null,
      });
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      if (vars.hasWaiter) {
        optimisticItemUpdate(vars.itemId, {
          claimedBy:     vars.nextUp,
          claimDeadline: vars.claimDeadline,
          waitlist:      vars.rest,
        });
      } else {
        optimisticItemUpdate(vars.itemId, {
          status:        'available',
          claimedBy:     undefined,
          claimDeadline: undefined,
        });
      }
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  const markPickedUpMutation = useMutation({
    mutationFn: (itemId: string) => updateItemFields(itemId, { status: 'pending_pickup' }),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      optimisticItemUpdate(itemId, { status: 'pending_pickup' });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  const confirmPickupMutation = useMutation({
    mutationFn: (itemId: string) => updateItemFields(itemId, { status: 'picked_up' }),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      optimisticItemUpdate(itemId, { status: 'picked_up' });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  const markDisposedMutation = useMutation({
    mutationFn: (itemId: string) => updateItemFields(itemId, { status: 'disposed' }),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      optimisticItemUpdate(itemId, { status: 'disposed' });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  // ── Borrow mutations ───────────────────────────────────────────────────────

  const borrowRequestMutation = useMutation({
    mutationFn: ({ itemId, requests }: { itemId: string; requests: BorrowRequest[] }) =>
      updateItemFields(itemId, { borrow_requests: requests }),
    onMutate: async ({ itemId, requests }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      optimisticItemUpdate(itemId, { borrowRequests: requests });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => { if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot); },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  const blockedPeriodMutation = useMutation({
    mutationFn: ({ itemId, periods }: { itemId: string; periods: BlockedPeriod[] }) =>
      updateItemFields(itemId, { blocked_periods: periods }),
    onMutate: async ({ itemId, periods }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.items });
      const snapshot = qc.getQueryData<Item[]>(QUERY_KEYS.items);
      optimisticItemUpdate(itemId, { blockedPeriods: periods });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => { if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.items, ctx.snapshot); },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.items }),
  });

  // ── Derived helpers ────────────────────────────────────────────────────────

  const getUserById = (id: string) =>
    users.find(u => u.id === id) ?? (currentUser.id === id ? currentUser : undefined);

  const getFriendItems = (): Item[] => {
    const myFriendIds = new Set(currentUser.friends);
    return items.filter(item => {
      // Give items: hide once picked up / disposed. Borrow items: hide only when returned (picked_up maps to returned)
      if (item.listingType === 'give' && (item.status === 'picked_up' || item.status === 'disposed')) return false;
      if (item.listingType === 'borrow' && item.status === 'picked_up') return false;
      if (!myFriendIds.has(item.donorId)) return false;
      const donor = getUserById(item.donorId);
      if (!donor) return false;
      const visibility = donor.itemVisibility ?? 'added';
      if (visibility === 'both') return true;
      return (donor.friends ?? []).includes(currentUser.id);
    });
  };

  const getMyItems = (): Item[] => items.filter(item => item.donorId === currentUser.id);

  // ── Search history ─────────────────────────────────────────────────────────

  const addToSearchHistory = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setSearchHistory(prev => {
      const deduped = prev.filter(h => h.toLowerCase() !== t.toLowerCase());
      return [t, ...deduped].slice(0, 10);
    });
  };

  const clearSearchHistory = () => setSearchHistory([]);

  // ── Search notification mutations ──────────────────────────────────────────

  const addNotifMutation = useMutation({
    mutationFn: (keyword: string) => insertNotification(currentUser.id, keyword),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.myNotifications(currentUser.id) }),
  });

  const deleteNotifMutation = useMutation({
    mutationFn: (id: string) => dbDeleteNotification(id),
    onMutate: async (id) => {
      const snapshot = qc.getQueryData<SearchNotification[]>(QUERY_KEYS.myNotifications(currentUser.id));
      qc.setQueryData<SearchNotification[]>(
        QUERY_KEYS.myNotifications(currentUser.id),
        prev => (prev ?? []).filter(n => n.id !== id)
      );
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QUERY_KEYS.myNotifications(currentUser.id), ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.myNotifications(currentUser.id) }),
  });

  const addSearchNotification = async (keyword: string): Promise<boolean> => {
    const k = keyword.trim().toLowerCase();
    if (!k) return false;
    const exists = searchNotifications.some(n => n.keyword.toLowerCase() === k);
    if (exists) return true;
    await addNotifMutation.mutateAsync(keyword.trim());
    return false;
  };

  const updateSearchNotification = async (id: string, keyword: string): Promise<void> => {
    // Update optimistically in cache then re-insert (delete+insert to handle unique constraint)
    await dbDeleteNotification(id);
    await insertNotification(currentUser.id, keyword.trim());
    qc.invalidateQueries({ queryKey: QUERY_KEYS.myNotifications(currentUser.id) });
  };

  const deleteSearchNotification = async (id: string): Promise<void> => {
    await deleteNotifMutation.mutateAsync(id);
  };

  // ── Context value ──────────────────────────────────────────────────────────

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        items,
        getUserById,
        getFriendItems,
        getMyItems,
        createItem:  async (data) => { await createItemMutation.mutateAsync(data as Parameters<typeof createItemMutation.mutateAsync>[0]); },
        updateItem:  async (id, updates) => { await updateItemMutation.mutateAsync({ id, updates }); },
        deleteItem:  async (id) => { await deleteItemMutation.mutateAsync(id); },
        claimItem: async (id) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === id);
          if (!item) return;
          const claimDeadline = new Date(Date.now() + item.claimPickupHours * 3600000).toISOString();
          await claimItemMutation.mutateAsync({ itemId: id, claimDeadline });
        },
        joinWaitlist: async (id) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === id);
          if (!item || item.waitlist.includes(currentUser.id)) return;
          await joinWaitlistMutation.mutateAsync({ itemId: id, newWaitlist: [...item.waitlist, currentUser.id] });
        },
        leaveWaitlist: async (id) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === id);
          if (!item) return;
          await leaveWaitlistMutation.mutateAsync({ itemId: id, newWaitlist: item.waitlist.filter(uid => uid !== currentUser.id) });
        },
        releaseClaim: async (id) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === id);
          if (!item) return;
          if (item.waitlist.length > 0) {
            const [nextUp, ...rest] = item.waitlist;
            const claimDeadline = new Date(Date.now() + item.claimPickupHours * 3600000).toISOString();
            await releaseClaimMutation.mutateAsync({ itemId: id, hasWaiter: true, nextUp, rest, claimDeadline, claimPickupHours: item.claimPickupHours });
          } else {
            await releaseClaimMutation.mutateAsync({ itemId: id, hasWaiter: false });
          }
        },
        markPickedUp:   async (id) => { await markPickedUpMutation.mutateAsync(id); },
        confirmPickup:  async (id) => { await confirmPickupMutation.mutateAsync(id); },
        markDisposed:   async (id) => { await markDisposedMutation.mutateAsync(id); },
        createBorrowRequest: async (itemId, startDate, endDate) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === itemId);
          if (!item) return;
          const newReq: BorrowRequest = {
            id: `${Date.now()}_${currentUser.id}`,
            requesterId: currentUser.id,
            startDate,
            endDate,
            status: 'pending',
            createdAt: new Date().toISOString(),
          };
          await borrowRequestMutation.mutateAsync({ itemId, requests: [...item.borrowRequests, newReq] });
        },
        approveBorrowRequest: async (itemId, requestId) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === itemId);
          if (!item) return;
          const req = item.borrowRequests.find(r => r.id === requestId);
          if (!req) return;
          const updatedRequests = item.borrowRequests.map(r =>
            r.id === requestId ? { ...r, status: 'approved' as const } :
            // Auto-reject others with overlapping dates
            (r.status === 'pending' && datesOverlap(r.startDate, r.endDate, req.startDate, req.endDate))
              ? { ...r, status: 'rejected' as const }
              : r
          );
          await updateItemFields(itemId, {
            borrow_requests: updatedRequests,
            status: 'borrowed',
            borrowed_by: req.requesterId,
            borrowed_until: req.endDate,
          });
          qc.invalidateQueries({ queryKey: QUERY_KEYS.items });
        },
        cancelBorrowRequest: async (itemId, requestId) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === itemId);
          if (!item) return;
          const updatedRequests = item.borrowRequests.filter(r => r.id !== requestId);
          await borrowRequestMutation.mutateAsync({ itemId, requests: updatedRequests });
        },
        rejectBorrowRequest: async (itemId, requestId) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === itemId);
          if (!item) return;
          const updatedRequests = item.borrowRequests.map(r =>
            r.id === requestId ? { ...r, status: 'rejected' as const } : r
          );
          await borrowRequestMutation.mutateAsync({ itemId, requests: updatedRequests });
        },
        markBorrowReturned: async (itemId) => {
          await updateItemFields(itemId, { status: 'pending_return' });
          qc.invalidateQueries({ queryKey: QUERY_KEYS.items });
        },
        confirmBorrowReturn: async (itemId) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === itemId);
          if (!item) return;
          const updatedRequests = item.borrowRequests.map(r =>
            r.status === 'approved' ? { ...r, status: 'returned' as const } : r
          );
          await updateItemFields(itemId, {
            status: 'available',
            borrow_requests: updatedRequests,
            borrowed_by: null,
            borrowed_until: null,
          });
          qc.invalidateQueries({ queryKey: QUERY_KEYS.items });
        },
        addBlockedPeriod: async (itemId, period) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === itemId);
          if (!item) return;
          await blockedPeriodMutation.mutateAsync({ itemId, periods: [...item.blockedPeriods, period] });
        },
        removeBlockedPeriod: async (itemId, index) => {
          const snap = qc.getQueryData<Item[]>(QUERY_KEYS.items) ?? [];
          const item = snap.find(i => i.id === itemId);
          if (!item) return;
          await blockedPeriodMutation.mutateAsync({ itemId, periods: item.blockedPeriods.filter((_, i) => i !== index) });
        },
        dismissed,
        dismissItem,
        restoreItem,
        restoreAll,
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
