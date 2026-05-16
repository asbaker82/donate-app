# Donate App

A mobile app for giving unneeded items to friends. Built with Expo Router and React Native.

## What it does

**As a donor** you photograph and list items you no longer need, set a pickup window and location, choose where unclaimed items go (Goodwill, Salvation Army, Habitat for Humanity, trash, etc.), and optionally restrict who can claim an item (e.g. "foster care placements only"). You can edit or remove listings at any time.

**As a donee** you browse your friends' listings, claim items you want, and join a waitlist if something is already claimed. If the current claimant doesn't pick up within the donor's timeframe, the next person on the waitlist is automatically offered the item. Claiming triggers a confetti celebration; joining the waitlist shows a confirmation toast.

## Features

- Photo listings with up to 6 images, condition rating, and optional restrictions
- Tap-to-expand image lightbox with swipe navigation, dot indicators, and thumbnail strip
- Real-time address autocomplete (OpenStreetMap / Nominatim — no API key needed)
- One-tap driving directions from item detail screen
- Claim + waitlist queue with configurable pickup deadline
- Automatic waitlist promotion when a claim expires
- Disposal deadline countdown with urgency highlighting
- Fuzzy search with typo tolerance across title, description, and restrictions
- Search history dropdown with recent terms
- Search alerts — save a keyword and get notified when a matching item is posted
- Text Donor button — compose an SMS to the donor directly from the item detail screen
- Celebratory animation + haptic feedback on claim
- Slide-up toast + haptic feedback on joining waitlist
- Donor can edit or delete their own listings
- Profile stat tiles (Listed / Active / Claimed by You) link to filtered item lists
- Search alert management in Profile — add, edit, and delete keyword alerts
- Custom tab bar that renders correctly across all viewport sizes

## Tech stack

- [Expo](https://expo.dev) ~54 / React Native 0.81
- [Expo Router](https://expo.github.io/router) v6 — file-based navigation
- React Native Reanimated ~4.1 + core `Animated` API for animations
- Expo Haptics for native tactile feedback
- React 19 with Context API for state (no Redux / Zustand)
- TypeScript
- React Native Web for browser testing

## Getting started

```bash
npm install
npx expo start --web      # browser at http://localhost:8081
npx expo start --android
npx expo start --ios      # macOS only
```

## Project structure

```
store/            State layer — Context, types, mock data
app/(tabs)/       Three tabs: Browse · My Items · Profile
app/item/         Detail ([id].tsx), new listing (new.tsx), edit listing (edit/[id].tsx)
app/items-list    Filtered item list (linked from profile stat tiles)
components/       ItemCard, AddressInput, DatePickerInput, ImageLightbox,
                  CustomTabBar, ClaimCelebration, WaitlistToast
```

## Current state

State is in-memory only — all data resets on refresh. The logged-in user is hardcoded as Adam Baker with three friends pre-populated as demo data. Backend, auth, and persistence are not yet implemented.
