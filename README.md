# Donate App

A mobile app for giving unneeded items to friends. Built with Expo Router and React Native.

## What it does

**As a donor** you photograph and list items you no longer need, set a pickup window and location, choose where unclaimed items go (Goodwill, Salvation Army, Habitat for Humanity, trash, etc.), and optionally restrict who can claim an item (e.g. "foster care placements only").

**As a donee** you browse your friends' listings, claim items you want, and join a waitlist if something is already claimed. If the current claimant doesn't pick up within the donor's timeframe, the next person on the waitlist is automatically offered the item.

## Features

- Photo listings with condition rating and optional restrictions
- Real-time address autocomplete (OpenStreetMap / Nominatim — no API key needed)
- One-tap driving directions from item detail screen
- Claim + waitlist queue with configurable pickup deadline
- Automatic waitlist promotion when a claim expires
- Disposal deadline countdown with urgency highlighting
- Browse, search, and filter friends' available items

## Tech stack

- [Expo](https://expo.dev) ~54 / React Native 0.81
- [Expo Router](https://expo.github.io/router) v6 — file-based navigation
- React 19 with Context API for state
- TypeScript (strict mode)
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
store/          State layer (Context, types, mock data)
app/(tabs)/     Three tabs: Browse · My Items · Profile
app/item/       Item detail ([id].tsx) and new listing form (new.tsx)
components/     ItemCard, AddressInput (reusable)
```

## Current state

State is in-memory only — all data resets on refresh. The logged-in user is hardcoded as Adam Baker with three friends pre-populated as demo data. Backend, auth, and persistence are not yet implemented.
