import { User, Item } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Adam Baker',
    email: 'adam.seth.baker@gmail.com',
    friends: ['user-2', 'user-3', 'user-4'],
  },
  {
    id: 'user-2',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    friends: ['user-1', 'user-3'],
  },
  {
    id: 'user-3',
    name: 'Mike Chen',
    email: 'mike.c@example.com',
    friends: ['user-1', 'user-2'],
  },
  {
    id: 'user-4',
    name: 'Lisa Rodriguez',
    email: 'lisa.r@example.com',
    friends: ['user-1'],
  },
];

const d = (daysFromNow: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromNow);
  return dt.toISOString();
};

export const MOCK_ITEMS: Item[] = [
  {
    id: 'item-1',
    donorId: 'user-2',
    title: 'IKEA KALLAX Bookshelf (4x4)',
    description:
      'White 4x4 KALLAX bookshelf in great condition. Minor scratch on the lower-right side panel. Dimensions: 57" x 57". You must be able to disassemble and transport.',
    photos: [],
    condition: 'good',
    pickupLocation: '123 Maple St, Springfield',
    pickupWindow: 'Weekends, 10am–4pm',
    disposalDate: d(7),
    disposalMethod: 'goodwill',
    claimPickupHours: 72,
    status: 'available',
    waitlist: [],
    createdAt: d(-2),
  },
  {
    id: 'item-2',
    donorId: 'user-3',
    title: 'Infant Car Seat (Graco SnugRide 35)',
    description:
      'Graco SnugRide 35 infant car seat with base. Expires 2028. Never involved in an accident. Cleaned and ready to go. Fits children 4–35 lbs.',
    photos: [],
    condition: 'excellent',
    restrictions: 'For pregnant friends or families with newborns only',
    pickupLocation: '456 Oak Ave, Springfield',
    pickupWindow: 'Any evening after 6pm, Mon–Fri',
    disposalDate: d(14),
    disposalMethod: 'salvation_army',
    claimPickupHours: 48,
    status: 'available',
    waitlist: [],
    createdAt: d(-1),
  },
  {
    id: 'item-3',
    donorId: 'user-4',
    title: 'Twin Bed Frame & Mattress',
    description:
      'Metal twin bed frame + mattress. Mattress has always had a protector on it and is in great shape. Frame disassembles easily. Headboard included.',
    photos: [],
    condition: 'good',
    restrictions: 'Foster care placements only — caseworker documentation required',
    pickupLocation: '789 Pine Rd, Springfield',
    pickupWindow: 'Saturday mornings, 8am–noon',
    disposalDate: d(5),
    disposalMethod: 'habitat',
    claimPickupHours: 96,
    status: 'claimed',
    claimedBy: 'user-2',
    claimDeadline: d(2),
    waitlist: [],
    createdAt: d(-3),
  },
  {
    id: 'item-4',
    donorId: 'user-2',
    title: 'Kitchen Starter Box',
    description:
      'Assorted kitchen items — mixing bowls (set of 3), spatulas, measuring cups, colander, can opener, and a few utensils. Great for someone setting up a first kitchen.',
    photos: [],
    condition: 'fair',
    pickupLocation: '123 Maple St, Springfield',
    pickupWindow: 'Weekends, 10am–4pm',
    disposalDate: d(2),
    disposalMethod: 'goodwill',
    claimPickupHours: 24,
    status: 'available',
    waitlist: [],
    createdAt: d(-1),
  },
  {
    id: 'item-5',
    donorId: 'user-3',
    title: 'Standing Desk (adjustable height)',
    description:
      'Electric sit-stand desk. 60" x 30" surface. Control panel works perfectly. Slight scuff on the left corner. Must pick up with help — it\'s heavy.',
    photos: [],
    condition: 'good',
    pickupLocation: '456 Oak Ave, Springfield',
    pickupWindow: 'Weekends only',
    disposalDate: d(10),
    disposalMethod: 'goodwill',
    claimPickupHours: 72,
    status: 'available',
    waitlist: ['user-1'],
    createdAt: d(-4),
  },
];
