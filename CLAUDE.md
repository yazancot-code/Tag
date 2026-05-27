# Tag — NFC Tag Reader

Cross-platform mobile app for reading preprogrammed NFC tags using phone NFC capabilities. Stores tag info in a local database and displays scanned tags in a list.

## Tech Stack

- React Native with Expo (managed workflow + EAS Build)
- `react-native-nfc-manager` — NFC tag reading
- `expo-sqlite` — Local database with quantity tracking
- `@react-navigation/native-stack` — Screen navigation
- `expo-haptics` — Haptic feedback on scan
- TypeScript

## Project Structure

```
Tag/
├── App.tsx                    — Root component, DB init, navigation
├── app.json                   — Expo config with NFC entitlements
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx   — Stack navigator (single screen — Home)
│   ├── screens/
│   │   └── HomeScreen.tsx     — Tag list + inline NFC scanning with countdown timer; dedup by content on re-scan
│   ├── database/
│   │   └── database.ts        — SQLite init, insertTag, getAllTags, incrementQuantity, findTagByContent, deleteTag, updateQuantity
│   ├── utils/
│   │   └── nfc.ts             — NFC utility functions (extractTextPayload)
│   ├── types/
│   │   └── index.ts           — Tag interface (id, content, tag_type, scanned_at, quantity)
│   └── components/
│       └── TagListItem.tsx    — Tag row with inline quantity controls (− N +), no date
└── ...
```

## Screens

| Screen | Purpose |
|---|---|
| **HomeScreen** | Tag list with quantity controls + inline NFC scanning with 10s countdown. Auto-scans on mount; cycles: scan (10s timer) → tag found (2s pause) → auto-rescan; timeout shows Rescan button. Re-scanning a tag with the same text content increments its quantity instead of creating a duplicate. |

## Commands

- `npx expo start` — Start the Expo dev server
- `npx expo run:android` — Build and run on Android (requires connected device)
- `npx expo run:ios` — Build and run on iOS (requires Mac + Xcode)
- `npx tsc --noEmit` — TypeScript type check

## Building for NFC

Expo Go **does not support** `react-native-nfc-manager`. You need a development build:
- Android: `npx expo run:android` on a device with NFC
- iOS: `npx expo run:ios` on a device with NFC (not simulator) — requires Apple Developer account for NFC entitlements