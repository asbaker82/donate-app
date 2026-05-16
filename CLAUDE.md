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

- `store/types.ts` — canonical TypeScript types (`Item`, `User`) and display-label/color maps. The `Item` type is the core domain object; understand it before touching any feature.
- `store/mockData.ts` — seed data (4 users, 5 items). The logged-in user is always `MOCK_USERS[0]` (Adam Baker, `user-1`). There is no auth layer yet.
- `store/AppContext.tsx` — all mutations (claim, waitlist, dispose, etc.) live here as plain functions passed through context. Expired claim auto-promotion runs on a 30-second `setInterval`.

### Routing — Expo Router (file-based)
```
app/
  _layout.tsx          Root stack. Wraps everything in <AppProvider>.
  (tabs)/
    _layout.tsx        Tab bar config (Browse / My Items / Profile). Tab `two` is hidden via href:null.
    index.tsx          Browse tab — donee view of friends' items
    my-items.tsx       My Items tab — donor view with FAB to create
    profile.tsx        Profile tab — stats and friend list
  item/
    [id].tsx           Item detail — claim, waitlist, pickup, dispose actions
    new.tsx            New listing form (modal presentation)
```

Path alias `@/` maps to the repo root (e.g. `@/store/AppContext`, `@/components/ItemCard`).

### Key business logic
- **Claim flow**: `available → claimed` (sets `claimDeadline = now + claimPickupHours`). If deadline passes, `processExpiredClaims` promotes `waitlist[0]` to `claimedBy`, or resets to `available`.
- **Item lifecycle**: `available → claimed → picked_up` (happy path) or `→ disposed` (donor disposes manually or deadline passes with no donee).
- **Browse visibility**: `getFriendItems()` filters to items from `currentUser.friends` that are not `picked_up` or `disposed`.

### Platform differences
`Alert.alert` callbacks don't fire on web — all confirmation dialogs use `window.confirm()` on `Platform.OS === 'web'` with an `Alert.alert` fallback for native. Follow this pattern for any new destructive actions.

### Address autocomplete — `components/AddressInput.tsx`
Calls the Nominatim (OpenStreetMap) API — no API key required. Debounced 450ms, US-only (`countrycodes=us`), deduped by formatted address. Used in `app/item/new.tsx` for the pickup location field. The `zIndex: 10` on the wrapping `<View>` is required for the dropdown to appear above sibling sections in a `ScrollView`.

### Driving directions — `app/item/[id].tsx`
`openDirections(address)` uses Apple Maps on iOS, Google Maps URL on web/Android via `Linking.openURL`. The pickup location row in the detail screen is the only tappable address in the app.

### Styling
No shared theme file. Brand color is `#2E8B57` (sea green). All styles use `StyleSheet.create` inline per file. Shadows use `shadowColor/shadowOffset/shadowOpacity/shadowRadius` (RN) — suppress the RN-web `boxShadow` deprecation warning; it's harmless.
