import { supabase } from '@/lib/supabase';
import type { Item, User, SearchNotification, ItemStatus } from './types';

// ─── Row types (snake_case from Postgres) ────────────────────────────────────

interface ItemRow {
  id: string;
  donor_id: string;
  title: string;
  description: string;
  photos: string[];
  condition: string;
  restrictions: string | null;
  pickup_location: string;
  pickup_window: string;
  disposal_date: string;
  disposal_method: string;
  disposal_method_note: string | null;
  claim_pickup_hours: number;
  status: string;
  claimed_by: string | null;
  claim_deadline: string | null;
  waitlist: string[];
  created_at: string;
}

interface ProfileRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  default_address: string | null;
  item_visibility: string;
  profile_photo: string | null;
  friends: string[];
  created_at: string;
  updated_at: string;
}

interface NotificationRow {
  id: string;
  user_id: string;
  keyword: string;
  created_at: string;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

export function rowToItem(row: ItemRow): Item {
  return {
    id:                 row.id,
    donorId:            row.donor_id,
    title:              row.title,
    description:        row.description,
    photos:             row.photos ?? [],
    condition:          row.condition as Item['condition'],
    restrictions:       row.restrictions ?? undefined,
    pickupLocation:     row.pickup_location,
    pickupWindow:       row.pickup_window,
    disposalDate:       row.disposal_date,
    disposalMethod:     row.disposal_method as Item['disposalMethod'],
    disposalMethodNote: row.disposal_method_note ?? undefined,
    claimPickupHours:   row.claim_pickup_hours,
    status:             row.status as ItemStatus,
    claimedBy:          row.claimed_by ?? undefined,
    claimDeadline:      row.claim_deadline ?? undefined,
    waitlist:           row.waitlist ?? [],
    createdAt:          row.created_at,
  };
}

export function rowToUser(row: ProfileRow): User {
  return {
    id:              row.id,
    name:            row.name,
    email:           row.email ?? '',
    phone:           row.phone ?? undefined,
    friends:         row.friends ?? [],
    profilePhoto:    row.profile_photo ?? undefined,
    defaultAddress:  row.default_address ?? undefined,
    itemVisibility:  (row.item_visibility as User['itemVisibility']) ?? 'added',
  };
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function fetchAllItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ItemRow[]).map(rowToItem);
}

export async function insertItem(
  item: Omit<Item, 'id' | 'createdAt' | 'status' | 'claimedBy' | 'claimDeadline' | 'waitlist'>
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert({
      donor_id:            item.donorId,
      title:               item.title,
      description:         item.description,
      photos:              item.photos,
      condition:           item.condition,
      restrictions:        item.restrictions ?? null,
      pickup_location:     item.pickupLocation,
      pickup_window:       item.pickupWindow,
      disposal_date:       item.disposalDate,
      disposal_method:     item.disposalMethod,
      disposal_method_note: item.disposalMethodNote ?? null,
      claim_pickup_hours:  item.claimPickupHours,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToItem(data as ItemRow);
}

export async function updateItemFields(
  itemId: string,
  fields: Partial<{
    title:               string;
    description:         string;
    photos:              string[];
    condition:           string;
    restrictions:        string | null;
    pickup_location:     string;
    pickup_window:       string;
    disposal_date:       string;
    disposal_method:     string;
    disposal_method_note: string | null;
    claim_pickup_hours:  number;
    status:              string;
    claimed_by:          string | null;
    claim_deadline:      string | null;
    waitlist:            string[];
  }>
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update(fields)
    .eq('id', itemId)
    .select()
    .single();
  if (error) throw error;
  return rowToItem(data as ItemRow);
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', itemId);
  if (error) throw error;
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function fetchAllProfiles(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return (data as ProfileRow[]).map(rowToUser);
}

export async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToUser(data as ProfileRow) : null;
}

export async function upsertProfile(user: Partial<User> & { id: string }): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id:              user.id,
      name:            user.name,
      email:           user.email ?? null,
      phone:           user.phone ?? null,
      default_address: user.defaultAddress ?? null,
      item_visibility: user.itemVisibility ?? 'added',
      profile_photo:   user.profilePhoto ?? null,
      friends:         user.friends ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return rowToUser(data as ProfileRow);
}

export async function updateProfile(
  userId: string,
  fields: Partial<{
    name:            string;
    email:           string | null;
    default_address: string | null;
    item_visibility: string;
    profile_photo:   string | null;
    friends:         string[];
  }>
): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return rowToUser(data as ProfileRow);
}

// ─── Search Notifications ─────────────────────────────────────────────────────

export async function fetchNotifications(userId: string): Promise<SearchNotification[]> {
  const { data, error } = await supabase
    .from('search_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as NotificationRow[]).map(r => ({
    id:        r.id,
    keyword:   r.keyword,
    createdAt: r.created_at,
  }));
}

export async function insertNotification(
  userId: string,
  keyword: string
): Promise<SearchNotification> {
  const { data, error } = await supabase
    .from('search_notifications')
    .insert({ user_id: userId, keyword })
    .select()
    .single();
  if (error) throw error;
  const r = data as NotificationRow;
  return { id: r.id, keyword: r.keyword, createdAt: r.created_at };
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('search_notifications')
    .delete()
    .eq('id', notificationId);
  if (error) throw error;
}
