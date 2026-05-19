# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Commands

```bash
# Web (primary for local testing — opens at http://localhost:8081)
npx expo start --web

# Mobile
npx expo start --android
npx expo start --ios

# TypeScript check (no separate lint script exists)
npx tsc --noEmit
```

Node.js must be in PATH. On Windows, refresh after install:
```powershell
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
```

## Architecture

### Auth — `store/AuthContext.tsx`
Wraps `AppProvider` in `app/_layout.tsx`. Persists to `AsyncStorage` (web = localStorage) under three keys:
- `@yoink_it/auth_user` — user JSON (never includes `profilePhoto`)
- `@yoink_it/registered_users` — array of registered user JSON (no photos)
- `@yoink_it/profile_photo` — photo stored separately to avoid 5 MB localStorage quota

The mock users (phones `+15555550101`–`0104`) bypass OTP and log in directly. All other numbers go through phone → OTP (`1234` always works) → name → contacts flow. The routing guard in `app/_layout.tsx` uses `useSegments` + `useEffect` to redirect unauthenticated users to `/(auth)/welcome` and authenticated users away from auth screens. During the one-frame gap while auth resolves, `AppContext` uses a stub user `{ id: '', name: '', ... }` to prevent a `useApp must be within AppProvider` crash.

### App state — `store/AppContext.tsx`
All non-auth state in a single React Context accessed via `useApp()`. No Redux/Zustand.

- `store/types.ts` — canonical types. Read `Item`, `User`, `ItemVisibility`, `SearchNotification` before touching any feature.
- `store/mockData.ts` — 4 seed users, 5 give items, 10 borrow items. Mock users all have `itemVisibility: 'both'` so any user who adds them as a friend can see their listings.
- Key mutations — give flow: `claimItem`, `joinWaitlist`, `leaveWaitlist`, `releaseClaim`, `markPickedUp`, `confirmPickup`, `markDisposed`, `createItem`, `updateItem`, `deleteItem`; borrow flow: `createBorrowRequest`, `cancelBorrowRequest`, `approveBorrowRequest`, `rejectBorrowRequest`, `markBorrowReturned`, `confirmBorrowReturn`, `addBlockedPeriod`, `removeBlockedPeriod`
- `processExpiredClaims` runs on a 30-second `setInterval` — promotes `waitlist[0]` to claimant when `claimDeadline` passes, or resets to `available`.
- **Dismissed items**: `dismissed` (Set<string>), `dismissItem`, `restoreItem`, `restoreAll` — per-user, persisted to AsyncStorage at `@yoink_it/dismissed/<userId>`. These must be declared **after** `currentUser` in the provider body since `dismissedKey` depends on `currentUser.id`.

### Item visibility
`getFriendItems()` in `AppContext` enforces two-layer filtering:
1. Current user must have added the donor as a friend (`currentUser.friends` includes `donorId`)
2. Donor's `itemVisibility` setting: `'added'` (default) = donor must have added the viewer too; `'both'` = anyone who added the donor can see their items.

Mock users are set to `'both'` so newly registered users can see listings immediately after adding friends.

### Routing — Expo Router (file-based)
```
app/
  _layout.tsx              Root stack. Auth guard lives here. Loads BricolageGrotesque_800ExtraBold font.
  (auth)/
    welcome.tsx            Animated welcome screen — sticker peel entry + stagger fades. First screen for unauthenticated users.
    phone.tsx              Phone entry → sends OTP
    verify.tsx             OTP entry (always "1234") → existing user → tabs, new user → name
    name.tsx               Name entry for new users
    contacts.tsx           Friend discovery from device contacts
  (tabs)/
    _layout.tsx            Tab bar + headerRight profile icon on Browse and My Items
    index.tsx              Browse — fuzzy search, listing type + status filters, distance filter, swipe-to-dismiss, search alerts
    my-items.tsx           My Items — Listing / Claimed / Waitlisted / Lending tabs + FAB
    profile.tsx            Profile — reached via header icon, not tab bar
  item/
    [id].tsx               Item detail — claim, waitlist, pickup, dispose, edit, SMS, lightbox, distance, borrow request
    new.tsx                New listing form (modal)
    edit/[id].tsx          Edit listing form (modal)
  items-list.tsx           Sectioned listing view — ?filter=listed|active|claimed
  add-friends.tsx          Friend discovery — contacts section + others section
  edit-profile.tsx         Edit name, email, photo, default address, item visibility
```

Path alias `@/` maps to the repo root.

### Navigation structure
- Only **Browse** and **My Items** appear in the bottom tab bar (`CustomTabBar.tsx` TABS array).
- **Profile** is reached via `ProfileHeaderButton` in the header right of Browse and My Items. It is registered as a tab screen with `href: null` so routing works but it stays off the bar.
- **Do not switch back to the default tab bar** — it clips labels on web due to `overflow: hidden` in framework CSS. Add tabs by editing `TABS` in `CustomTabBar.tsx` and adding a `<Tabs.Screen>` in `app/(tabs)/_layout.tsx`.
- `CustomTabBar` renders the hidden-items trash icon (bottom-right, `position: 'absolute'`) and owns the hidden-items bottom sheet. It reads `dismissed`, `restoreItem`, `restoreAll`, and `getFriendItems` from `useApp()`.

### Key business logic
- **Claim flow**: `available → claimed` (sets `claimDeadline = now + claimPickupHours * 3600000`). Deadline passes → `processExpiredClaims` promotes next waiter or resets to `available`. CTA button label is "Claim →".
- **Give lifecycle**: `available → claimed → pending_pickup → picked_up` (happy path) or any state `→ disposed`. The `pending_pickup` step is a two-party confirmation: donee calls `markPickedUp` (sets `pending_pickup`), donor calls `confirmPickup` (sets `picked_up`). Either party can call `releaseClaim` to revert.
- **Borrow lifecycle**: Donee selects a date range via `DateRangePicker` → `createBorrowRequest` → donor approves (auto-rejects overlapping pending requests via `datesOverlap`) → item status `borrowed` with `borrowedBy`/`borrowedUntil`. Return is two-party: donee calls `markBorrowReturned` (sets `pending_return`), donor calls `confirmBorrowReturn` (clears borrow fields, resets to `available`). Donors can block periods via `addBlockedPeriod`/`removeBlockedPeriod`. Borrow items use `disposalDate: '2099-12-31'` and `claimPickupHours: 0` as sentinels — do not show disposal UI for them.
- **Cancel borrow request**: `cancelBorrowRequest` removes the request from the array entirely. This differs from `rejectBorrowRequest` (donor action) which marks status as `'rejected'` and keeps it in the array.
- **Swipe-to-dismiss**: `SwipeableCard` wraps each `ItemCard` in Browse. Swiping left past 100 px (or fast flick) calls `dismissItem` from AppContext. Dismissed items are filtered out of `sortedFiltered` before the FlatList. The trash icon in `CustomTabBar` opens a restore sheet; it only appears when `dismissed.size > 0`.
- **Validation**: When creating or editing a listing, `claimPickupHours` must be less than the hours remaining until `disposalDate` — enforced in both `new.tsx` and `edit/[id].tsx`.
- **Supabase constraint**: The `items.status` check constraint must include `'pending_pickup'`, `'borrowed'`, and `'pending_return'`. Migration for a live DB:
  ```sql
  ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_status_check;
  ALTER TABLE public.items ADD CONSTRAINT items_status_check
    CHECK (status IN ('available','claimed','pending_pickup','picked_up','disposed','borrowed','pending_return'));
  ALTER TABLE public.items
    ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'give',
    ADD COLUMN IF NOT EXISTS borrow_requests jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS blocked_periods jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS borrowed_by text,
    ADD COLUMN IF NOT EXISTS borrowed_until timestamptz;
  ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_listing_type_check;
  ALTER TABLE public.items ADD CONSTRAINT items_listing_type_check CHECK (listing_type IN ('give','borrow'));
  ```

### Sounds — `utils/sounds.ts`
- `playClaimSound()` — celebratory C5→E5→G5 arpeggio on web via `AudioContext`; native builds a WAV buffer in memory and plays it via `expo-av` + `expo-file-system` (no bundled audio files).
- `playWaitlistSound()` — softer two-note ascending boop, same dual-path approach.
- Both fail silently so animations still run if audio is blocked.

### Distance — `utils/geocode.ts`
- `geocodeAddress(address)` calls Nominatim (OpenStreetMap, no API key). Module-level `Map` cache prevents duplicate calls. Rate-limit: 1100 ms delay between requests.
- `haversineMiles(a, b)` computes driving-distance proxy in miles.
- Browse screen geocodes user's `defaultAddress` + each visible item's `pickupLocation`, then filters by `maxMiles` chip selection. Distance filter chips (≤5, 10, 25, 50 mi, Any) are always visible; if the user has no `defaultAddress` set, a prompt to set one is shown instead of distances.
- Item detail screen computes and displays distance in the Pickup Details card.

### Photo grids
Photo grids in `item/new.tsx`, `item/edit/[id].tsx`, and the thumbnail strip in `item/[id].tsx` use `flexDirection: 'row', flexWrap: 'wrap', gap: 10` — **not** a horizontal `ScrollView`. The delete (×) button on each photo thumbnail is `position: 'absolute', top: 4, right: 4` so it stays inside the photo bounds, not floating outside.

### Platform differences
- `Alert.alert` callbacks don't fire on web — use `window.confirm()` / `window.alert()` on `Platform.OS === 'web'` with `Alert.alert` fallback for native. Follow this pattern for every destructive or confirmatory action.
- `Modal` must **never** be nested inside `ScrollView` on web — silently breaks rendering. Place `Modal` as a sibling of `ScrollView` inside a wrapping `View`.
- Haptics (`expo-haptics`) must be guarded: `if (Platform.OS !== 'web') Haptics.xxx()`.
- SMS deep linking: iOS uses `sms:NUMBER&body=TEXT`, Android/web use `sms:NUMBER?body=TEXT`.
- Profile photo: on web, `expo-image-picker` returns a blob URL — must be converted to a data URL via `FileReader` then compressed with canvas before storing (see `blobUrlToCompressedDataUrl` in `edit-profile.tsx`).
- **`overflow: hidden` on RN Web**: React Native Web automatically applies `overflow: hidden` to Views with `borderRadius`, which clips absolutely-positioned children (e.g. calendar dropdowns). The fix is to use a `Modal` instead of an inline absolute overlay. `DatePickerInput` uses this pattern: `dropUp` prop causes it to use a Modal even on web. Never assume an absolutely-positioned popup will escape a bordered ancestor.

### Components reference
| Component | Purpose |
|---|---|
| `HeaderLogo` | Speed-wordmark logo used as `headerTitle` on all screens. Accepts `size` prop (default 22). Uses `BricolageGrotesque_800ExtraBold` font. |
| `CustomTabBar` | Custom bottom tab bar (Browse + My Items). Also owns the hidden-items trash icon and restore sheet. Reads dismissed state from `useApp()`. |
| `ProfileHeaderButton` | Avatar/initials button (40×40) in header right → profile screen |
| `ItemCard` | Card used in Browse, My Items, and items-list. Accepts optional `distance` prop. Borrow items show a single left badge: "Borrow" (sky-blue) when available, "Borrowed" (yellow/dark text) when out. |
| `SwipeableCard` | Wraps `ItemCard` in Browse. `PanResponder`-based swipe-left-to-dismiss. Shows an `eye-slash` hint icon as the card slides. Calls `onDismiss` after animation completes. |
| `AddressInput` | Nominatim autocomplete. Wrapping `View` needs `zIndex: 10` to float above siblings. |
| `DatePickerInput` | Custom calendar for single date selection. Displays and accepts **MM-DD-YYYY** format. On web: absolute dropdown (no `dropUp`); with `dropUp` prop: Modal overlay (bypasses overflow clipping). Fixed width 276 px — never stretch. Past dates disabled. |
| `DateRangePicker` | Calendar for selecting a start+end date range (used in borrow request form). Always uses Modal overlay. First tap sets start, second tap (later date) sets end and closes. Highlights the range between selected dates. |
| `ImageLightbox` | Full-screen photo modal with keyboard nav on web. Sibling of `ScrollView`, never nested. |
| `ClaimToast` | Slide-up toast after claiming — shows pickup deadline. |
| `WaitlistToast` | Slide-up toast after joining waitlist. |
| `ConfirmSheet` | Slide-up confirmation sheet (replaces `Alert` for release-claim flow). |
| `ClaimCelebration` | Full-screen confetti (legacy, still present but replaced by ClaimToast in main flow). |
| `ImageCropModal` | **Web-only** circular crop modal. Injects a `<canvas>` imperatively into a `View` DOM node. Drag to pan, scroll/buttons to zoom. Used in `edit-profile.tsx` after image pick. |

Both toast components use core RN `Animated` (not Reanimated) with `useNativeDriver: true`.

### Browse screen filters — `app/(tabs)/index.tsx`
Two-level filter system:
1. **Listing type bar** (segmented control): All / Free / Borrow — styled with distinct active colors (dark / tangerine / sky). Changing this resets the status filter.
2. **Status chips** (shown only when listing type ≠ All): Free → All / Available / Claimed; Borrow → All / Available / Borrowed. The "Borrowed" chip matches both `borrowed` and `pending_return` statuses.

**Fuzzy search** — `fuzzyScore(query, item)` uses Levenshtein edit distance with strict thresholds:
- Exact phrase match → score 100
- Token substring match → score 10 per token
- Edit distance: words ≥ 6 chars allow 1 edit; words ≥ 9 chars allow 2 edits
- **Multi-word queries require ALL tokens to match** — partial hits return 0

Do not loosen thresholds without testing "can opener" does not return car seats.

### Profile screen — `app/(tabs)/profile.tsx`
- Friends list is a **collapsible card** (collapsed by default). The Add button is always visible.
- Friends sorted alphabetically by **last name**.
- Removing a friend is blocked if the current user has an active borrow (`status === 'borrowed' || 'pending_return'`) from that friend.

### Leftover Expo boilerplate
These files are unused template artifacts — do not reference or import from them:
`app/(tabs)/two.tsx`, `app/modal.tsx`, `components/EditScreenInfo.tsx`, `components/ExternalLink.tsx`, `components/StyledText.tsx`, `components/Themed.tsx`

### Styling
No shared theme file. All styles use `StyleSheet.create` inline per file. The RN-web `boxShadow` deprecation warning is harmless.

Brand tokens (defined as file-level consts in each file that needs them — no shared theme import):
| Token | Hex | Role |
|---|---|---|
| Tangerine | `#F26B3A` | Primary CTAs, active chips, badges |
| Tangerine Deep | `#D8531F` | Alert text, shadows, pressed states |
| Cream | `#FBF6EE` | Screen backgrounds, button text on dark |
| Cream 2 | `#F4ECDD` | Card backgrounds, secondary surfaces |
| Ink | `#1F1A17` | Primary text |
| Ink 2 | `#3A332E` | Secondary text |
| Mute | `#847A70` | Placeholder / label text |
| Sage | `#7FA88A` | Pickup pin, "picked up" badge |
| Butter | `#F4C95D` | "Claimed" / "Borrowed" badge background |
| Sky | `#7BA7BC` | Borrow accent color, "Borrow" badge |

**All screen backgrounds** use Cream (`#FBF6EE`) — auth screens, tab screens, and stack screens alike. Do not use `#fff` as a screen background.

**Tab headers** (Browse, My Items, Profile) use `backgroundColor: '#FBF6EE'` (Cream) with `headerShadowVisible: false` so the header blends into the page. **Stack headers** (item detail, modals, edit screens) keep the default white (`#fff`) from React Navigation. All headers use `HeaderLogo` as `headerTitle` — do not use plain string titles. All headers use `headerTitleAlign: 'center'`.

**Cards and surfaces** within a screen use Cream 2 (`#F4ECDD`) to lift above the Cream background. Destructive actions use Tangerine Deep (`#D8531F`), never `#e53e3e` or other reds.
