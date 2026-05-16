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

### State management — `store/`
All app state lives in a single React Context (`store/AppContext.tsx`). `AppProvider` wraps the entire app in `app/_layout.tsx`. Every screen and component accesses state via the `useApp()` hook — there is no Redux, Zustand, or other library.

- `store/types.ts` — canonical TypeScript types. Understand `Item`, `User`, and `SearchNotification` before touching any feature.
- `store/mockData.ts` — seed data (4 users, 5 items). The logged-in user is always `MOCK_USERS[0]` (Adam Baker, `user-1`). There is no auth layer.
- `store/AppContext.tsx` — all mutations live here. Key areas:
  - Item lifecycle: `claimItem`, `joinWaitlist`, `leaveWaitlist`, `releaseClaim`, `markPickedUp`, `markDisposed`, `createItem`, `updateItem`, `deleteItem`
  - Expired claim auto-promotion runs on a 30-second `setInterval` (`processExpiredClaims`)
  - Search history: `searchHistory[]`, `addToSearchHistory`, `clearSearchHistory`
  - Search notifications: `searchNotifications[]`, `addSearchNotification`, `updateSearchNotification`, `deleteSearchNotification`

### Routing — Expo Router (file-based)
```
app/
  _layout.tsx            Root stack. Wraps everything in <AppProvider>.
  (tabs)/
    _layout.tsx          Tab bar — uses <CustomTabBar> (see below). Tab `two` hidden via href:null.
    index.tsx            Browse tab — fuzzy search + filter + search alerts
    my-items.tsx         My Items tab — donor view with FAB to create
    profile.tsx          Profile tab — stat tiles, search alerts management, friend list
  item/
    [id].tsx             Item detail — claim, waitlist, pickup, dispose, edit, SMS, lightbox
    new.tsx              New listing form (modal)
    edit/[id].tsx        Edit listing form (modal) — pre-populated, calls updateItem
  items-list.tsx         Filtered item list — receives ?filter=listed|active|claimed param
```

Path alias `@/` maps to the repo root.

### Key business logic
- **Claim flow**: `available → claimed` (sets `claimDeadline = now + claimPickupHours`). If deadline passes, `processExpiredClaims` promotes `waitlist[0]` to `claimedBy`, or resets to `available`.
- **Item lifecycle**: `available → claimed → picked_up` (happy path) or `→ disposed`.
- **Browse visibility**: `getFriendItems()` filters to friend-owned items that are not `picked_up` or `disposed`.

### Platform differences
- `Alert.alert` callbacks don't fire on web — all confirmation dialogs use `window.confirm()` on `Platform.OS === 'web'` with an `Alert.alert` fallback for native. Follow this pattern for every destructive action.
- `Modal` must **never** be nested inside `ScrollView` on web — it silently breaks rendering. Always place `Modal` as a sibling of `ScrollView` inside a wrapping `View`.
- Haptics (`expo-haptics`) must be guarded: `if (Platform.OS !== 'web') Haptics.xxx()`.
- SMS deep linking: iOS uses `sms:NUMBER&body=TEXT`, Android/web use `sms:NUMBER?body=TEXT`.

### Custom tab bar — `components/CustomTabBar.tsx`
The default Expo Router/React Navigation tab bar clips labels on web due to `overflow: hidden` in the framework's CSS. The app uses a fully custom `CustomTabBar` component passed via the `tabBar` prop on `<Tabs>`. **Do not switch back to the default tab bar** — the label clipping issue will return. Add new tabs by editing `TABS` in `CustomTabBar.tsx` and adding the corresponding `<Tabs.Screen>` in `app/(tabs)/_layout.tsx`.

### Fuzzy search — `app/(tabs)/index.tsx`
`fuzzyScore(query, item)` uses Levenshtein edit distance with strict thresholds:
- Exact phrase match → score 100
- Token substring match → score 10 per token
- Edit distance allowed only for words ≥ 6 chars (max 1 edit) or ≥ 9 chars (max 2 edits)
- **Multi-word queries require ALL tokens to match** — partial hits return score 0

This strictness is intentional. Do not loosen the edit distance thresholds without re-testing against "can opener" returning car seats.

### Animations & haptics — `components/`
- `ClaimCelebration.tsx` — full-screen confetti burst + checkmark overlay, triggered on claim. Uses `Animated` (core RN, not Reanimated) with `useNativeDriver: true`. 20 pre-computed particles with static angles/distances so interpolations are stable across renders.
- `WaitlistToast.tsx` — slide-up toast triggered on joining waitlist. Also uses core `Animated`.
- Both components accept `visible` + `onComplete` props and self-dismiss.

### Address autocomplete — `components/AddressInput.tsx`
Calls Nominatim (OpenStreetMap) — no API key. Debounced 450ms, US-only, deduped by formatted address. The wrapping `<View>` needs `zIndex: 10` to float the dropdown above sibling sections in a `ScrollView`.

### Date picker — `components/DatePickerInput.tsx`
Custom calendar — no library. Web: inline absolute dropdown + invisible backdrop `Pressable`. Native: centered `Modal`. Uses `toISO(y,m,d)` helper to avoid timezone shifts (never construct dates with `new Date(y, m, d)` elsewhere for display purposes).

### Image lightbox — `components/ImageLightbox.tsx`
Full-screen `Modal` with prev/next arrows, dot indicators, thumbnail strip, and keyboard nav on web (`ArrowLeft`/`ArrowRight`/`Escape`). Rendered as a sibling of `ScrollView` in `[id].tsx`.

### Driving directions — `app/item/[id].tsx`
`openDirections(address)` uses Apple Maps on iOS, Google Maps on web/Android. The `openSms` helper uses the platform-correct separator (`&` vs `?`).

### Styling
No shared theme file. Brand color `#2E8B57` (sea green). All styles use `StyleSheet.create` inline per file. The RN-web `boxShadow` deprecation warning is harmless — suppress mentally.
