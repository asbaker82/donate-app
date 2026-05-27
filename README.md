# Yoink It

A React Native / Expo app for sharing household items with friends. Donors post items they no longer need — either to give away with a disposal deadline, or to lend out for a set period. Friends can claim, waitlist, borrow, and arrange pickup directly through the app.

## Stack

- **Expo SDK 54** / React Native 0.81 (Expo Router v3, file-based routing)
- **TypeScript** throughout
- **Supabase** — Postgres database, row-level security, realtime item updates, phone OTP auth
- **TanStack Query** — server state, optimistic updates, and AsyncStorage persistence via `@tanstack/react-query-persist-client`
- **React Context API** for auth state and local UI state — no Redux or Zustand
- **Nominatim (OpenStreetMap)** for address autocomplete and distance calculation — no API key required
- **Bricolage Grotesque 800** via `@expo-google-fonts/bricolage-grotesque` for the header wordmark

## Running locally

```bash
npm install

# Web — opens at http://localhost:8081
npx expo start --web

# iOS / Android
npx expo start --ios
npx expo start --android
```

## Demo login

The app uses phone + OTP auth. For local development:

| Phone | Name |
|---|---|
| (555) 000-0101 | Adam Baker |
| (555) 000-0102 | Sarah Johnson |
| (555) 000-0103 | Mike Chen |
| (555) 000-0104 | Lisa Rodriguez |

Any of these numbers skip OTP. For any other number, the OTP code is always **1234**.

## Features

**Onboarding**
- Animated welcome screen — sticker peel entry animation, idle wobble, staggered content fades
- Phone + OTP auth with friend discovery from device contacts at signup

**Browsing & discovery**
- Fuzzy search with typo tolerance across title, description, and restrictions
- Two-level filter: listing type bar (All / Free / Borrow) + conditional status chips
- Distance filter (≤ 5 / 10 / 25 / 50 mi) with distance chip on each card
- Swipe left on any card to hide it; restore hidden items from the trash icon in the tab bar
- Search alerts — save a keyword and be notified when a matching item is posted

**Give Away listings**
- Photo listings (up to 6 images) with condition rating, optional restrictions, pickup window, and disposal deadline
- Photo grid wraps to multiple rows in listing forms and on item detail — no horizontal scroll
- Configurable pickup window after claiming (donor sets hours; validated against disposal date)
- Disposal deadline countdown with urgency highlighting
- Real-time address autocomplete powered by OpenStreetMap

**Claiming & waitlist**
- Claim items directly; join a waitlist when already claimed
- Items with restrictions show a confirmation sheet before claiming — donee must accept terms
- Automatic waitlist promotion when a claim deadline passes
- Live d/h/m pickup countdown on item detail for both donor and claimant
- Donor expiry banner when pickup window passes — donor can extend by 1 day or let the claim auto-release
- Two-party pickup confirmation — donee marks picked up, donor confirms; either party can release back to claimed
- Once confirmed picked up, logistical details are hidden and the SMS pre-fill becomes a thank-you note from donee to donor
- One-tap driving directions and Text Donor (SMS) from item detail
- Pickup deadline shown in a slide-up toast after claiming

**Lend Out listings**
- Donors can list items to lend rather than give away — marked with a sky-blue "Borrow" badge (yellow "Borrowed" when out)
- Friends submit date-range borrow requests via an inline range-selection calendar; can cancel pending requests
- Donor approves or rejects inline; approving auto-rejects any overlapping pending requests
- Two-party return confirmation — borrower marks returned, donor confirms
- Borrower's item detail shows return deadline with live d/h/m countdown
- Donors can block out unavailable date ranges (vacations, reservations, etc.)

**My Items**
- Four tabs: items you're **listing**, items you've **claimed**, items you're **waitlisted** for, and items you're **lending** out
- Waitlisted tab shows your queue position
- Lending tab shows pending borrow requests with inline approve / decline, and active borrows with return confirmation
- Donors can confirm pickup, dispose, or remove their own active listings
- Action banners on the Browse screen surface all pending tasks across all four action types (pickup due, borrow request to review, pickup to confirm, return to confirm) with direct navigation to the relevant tab

**Profile & social**
- Add friends from device contacts or by browsing other app users
- Control who sees your listings: people you've added, or anyone who's added you
- Edit name, email, profile photo (with crop), and default pickup address
- Profile reached via avatar icon in the top-right header

## Project structure

```
app/
  (auth)/          Welcome → Phone → OTP → name → contacts onboarding flow
  (tabs)/          Browse, My Items, Profile (profile via header icon)
  item/            Detail, new listing, edit listing
  add-friends.tsx
  edit-profile.tsx
components/        HeaderLogo, ItemCard, DatePickerInput, DateRangePicker, AddressInput,
                   SwipeableCard, ImageLightbox, CustomTabBar, ProfileHeaderButton,
                   ClaimToast, WaitlistToast, ConfirmSheet, ClaimCelebration,
                   ImageCropModal (web-only)
store/
  AuthContext.tsx  Auth state + AsyncStorage persistence
  AppContext.tsx   All app state and mutations (TanStack Query)
  types.ts         Canonical TypeScript types
  mockData.ts      Seed users and items
  db.ts            Supabase query/mutation helpers
lib/
  queryClient.ts   TanStack QueryClient + AsyncStorage persister
utils/
  geocode.ts        Nominatim geocoding + Haversine distance
  sounds.ts         Claim / waitlist sounds (AudioContext on web, expo-av WAV on native)
  notifications.ts  Browser Notification API wrapper (web-only permission request + send)
  dates.ts          Calendar date helpers (toDateOnly, parseCalendarDate, formatCalendarDate)
supabase/
  schema.sql       Full DB schema with RLS policies
```

See [CLAUDE.md](CLAUDE.md) for architecture details.
