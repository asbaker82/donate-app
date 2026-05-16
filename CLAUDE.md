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
- `@donate_app/auth_user` — user JSON (never includes `profilePhoto`)
- `@donate_app/registered_users` — array of registered user JSON (no photos)
- `@donate_app/profile_photo` — photo stored separately to avoid 5 MB localStorage quota

The mock users (phones `+15555550101`–`0104`) bypass OTP and log in directly. All other numbers go through phone → OTP (`1234` always works) → name → contacts flow. The routing guard in `app/_layout.tsx` uses `useSegments` + `useEffect` to redirect unauthenticated users to `/(auth)/phone` and authenticated users away from auth screens. During the one-frame gap while auth resolves, `AppContext` uses a stub user `{ id: '', name: '', ... }` to prevent a `useApp must be within AppProvider` crash.

### App state — `store/AppContext.tsx`
All non-auth state in a single React Context accessed via `useApp()`. No Redux/Zustand.

- `store/types.ts` — canonical types. Read `Item`, `User`, `ItemVisibility`, `SearchNotification` before touching any feature.
- `store/mockData.ts` — 4 seed users, 5 seed items. Mock users all have `itemVisibility: 'both'` so any user who adds them as a friend can see their listings.
- Key mutations: `claimItem`, `joinWaitlist`, `leaveWaitlist`, `releaseClaim`, `markPickedUp`, `markDisposed`, `createItem`, `updateItem`, `deleteItem`
- `processExpiredClaims` runs on a 30-second `setInterval` — promotes `waitlist[0]` to claimant when `claimDeadline` passes, or resets to `available`.

### Item visibility
`getFriendItems()` in `AppContext` enforces two-layer filtering:
1. Current user must have added the donor as a friend (`currentUser.friends` includes `donorId`)
2. Donor's `itemVisibility` setting: `'added'` (default) = donor must have added the viewer too; `'both'` = anyone who added the donor can see their items.

Mock users are set to `'both'` so newly registered users can see listings immediately after adding friends.

### Routing — Expo Router (file-based)
```
app/
  _layout.tsx              Root stack. Auth guard lives here. White header via screenOptions.
  (auth)/
    phone.tsx              Phone entry → sends OTP
    verify.tsx             OTP entry (always "1234") → existing user → tabs, new user → name
    name.tsx               Name entry for new users
    contacts.tsx           Friend discovery from device contacts
  (tabs)/
    _layout.tsx            Tab bar + headerRight profile icon on Browse and My Items
    index.tsx              Browse — fuzzy search, status filter, distance filter, search alerts
    my-items.tsx           My Items — Listing / Claimed / Waitlisted tabs + FAB
    profile.tsx            Profile — reached via header icon, not tab bar
  item/
    [id].tsx               Item detail — claim, waitlist, pickup, dispose, edit, SMS, lightbox, distance
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

### Key business logic
- **Claim flow**: `available → claimed` (sets `claimDeadline = now + claimPickupHours * 3600000`). Deadline passes → `processExpiredClaims` promotes next waiter or resets to `available`.
- **Item lifecycle**: `available → claimed → picked_up` (happy path) or any state `→ disposed`.
- **Validation**: When creating or editing a listing, `claimPickupHours` must be less than the hours remaining until `disposalDate` — enforced in both `new.tsx` and `edit/[id].tsx`.

### Distance — `utils/geocode.ts`
- `geocodeAddress(address)` calls Nominatim (OpenStreetMap, no API key). Module-level `Map` cache prevents duplicate calls. Rate-limit: 1100 ms delay between requests.
- `haversineMiles(a, b)` computes driving-distance proxy in miles.
- Browse screen geocodes user's `defaultAddress` + each visible item's `pickupLocation`, then filters by `maxMiles` chip selection.
- Item detail screen computes and displays distance in the Pickup Details card.

### Platform differences
- `Alert.alert` callbacks don't fire on web — use `window.confirm()` / `window.alert()` on `Platform.OS === 'web'` with `Alert.alert` fallback for native. Follow this pattern for every destructive or confirmatory action.
- `Modal` must **never** be nested inside `ScrollView` on web — silently breaks rendering. Place `Modal` as a sibling of `ScrollView` inside a wrapping `View`.
- Haptics (`expo-haptics`) must be guarded: `if (Platform.OS !== 'web') Haptics.xxx()`.
- SMS deep linking: iOS uses `sms:NUMBER&body=TEXT`, Android/web use `sms:NUMBER?body=TEXT`.
- Profile photo: on web, `expo-image-picker` returns a blob URL — must be converted to a data URL via `FileReader` then compressed with canvas before storing (see `blobUrlToCompressedDataUrl` in `edit-profile.tsx`).

### Components reference
| Component | Purpose |
|---|---|
| `CustomTabBar` | Custom bottom tab bar (Browse + My Items only) |
| `ProfileHeaderButton` | Avatar/initials button in header right → profile screen |
| `ItemCard` | Card used in Browse, My Items, and items-list. Accepts optional `distance` prop. |
| `AddressInput` | Nominatim autocomplete. Wrapping `View` needs `zIndex: 10` to float above siblings. |
| `DatePickerInput` | Custom calendar. Fixed width `276px` — never stretch. Past dates disabled. |
| `ImageLightbox` | Full-screen photo modal with keyboard nav on web. Sibling of `ScrollView`, never nested. |
| `ClaimToast` | Slide-up toast after claiming — shows pickup deadline. |
| `WaitlistToast` | Slide-up toast after joining waitlist. |
| `ConfirmSheet` | Slide-up confirmation sheet (replaces `Alert` for release-claim flow). |
| `ClaimCelebration` | Full-screen confetti (legacy, still present but replaced by ClaimToast in main flow). |

Both toast components use core RN `Animated` (not Reanimated) with `useNativeDriver: true`.

### Fuzzy search — `app/(tabs)/index.tsx`
`fuzzyScore(query, item)` uses Levenshtein edit distance with strict thresholds:
- Exact phrase match → score 100
- Token substring match → score 10 per token
- Edit distance: words ≥ 6 chars allow 1 edit; words ≥ 9 chars allow 2 edits
- **Multi-word queries require ALL tokens to match** — partial hits return 0

Do not loosen thresholds without testing "can opener" does not return car seats.

### Styling
No shared theme file. Brand color `#10B981` (emerald-500). All headers are white (`#fff`) with dark `#111827` text. All styles use `StyleSheet.create` inline per file. The RN-web `boxShadow` deprecation warning is harmless.
