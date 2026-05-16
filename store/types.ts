export type DisposalMethod =
  | 'goodwill'
  | 'salvation_army'
  | 'habitat'
  | 'food_bank'
  | 'other_charity'
  | 'trash'
  | 'keep';

export type ItemCondition = 'excellent' | 'good' | 'fair' | 'poor';
export type ItemStatus = 'available' | 'claimed' | 'picked_up' | 'disposed';

export interface Item {
  id: string;
  donorId: string;
  title: string;
  description: string;
  photos: string[];
  condition: ItemCondition;
  restrictions?: string;
  pickupLocation: string;
  pickupWindow: string;
  disposalDate: string;
  disposalMethod: DisposalMethod;
  disposalMethodNote?: string;
  claimPickupHours: number;
  status: ItemStatus;
  claimedBy?: string;
  claimDeadline?: string;
  waitlist: string[];
  createdAt: string;
}

export interface SearchNotification {
  id: string;
  keyword: string;
  createdAt: string;
}

export type ItemVisibility = 'added' | 'both';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  friends: string[];
  profilePhoto?: string;
  defaultAddress?: string;
  /** Who can see this user's listings.
   *  'added' (default) = only people this user has added as friends.
   *  'both' = people this user added OR anyone who has added this user. */
  itemVisibility?: ItemVisibility;
}

export const DISPOSAL_METHOD_LABELS: Record<DisposalMethod, string> = {
  goodwill: 'Goodwill',
  salvation_army: 'Salvation Army',
  habitat: 'Habitat for Humanity',
  food_bank: 'Food Bank',
  other_charity: 'Other Charity',
  trash: 'Trash',
  keep: 'Keep / Donate Later',
};

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export const CONDITION_COLORS: Record<ItemCondition, string> = {
  excellent: '#c6f6d5',
  good: '#bee3f8',
  fair: '#fefcbf',
  poor: '#fed7d7',
};
