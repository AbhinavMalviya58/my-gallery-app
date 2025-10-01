# My Gallery App

Cross-platform Expo React Native gallery with:

- Add images from library or camera (iOS/Android). On Web, library picker works.
- Captions via voice dictation (native: react-native-voice; web: Web Speech API) and manual input.
- Share images via native share or web share/fallback.
- Global dark mode toggle with instant theme switch across the app.
- Local notifications when a new image is added.
- Clean React Navigation with tabs and Add caption modal.

## Getting started

1. Install dependencies

```
pnpm i
# or
npm i
# or
yarn
```

2. Start the app

```
expo start
```

3. Platforms

- Android/iOS: use Expo Go for development or run a dev build.
- Web: press w in the terminal after starting.

## Features and structure

- `App.tsx`: wraps providers and navigation with theme-aware container.
- `src/context/ThemeContext.tsx`: global theme state with persistence.
- `src/context/GalleryContext.tsx`: gallery items persisted to AsyncStorage; triggers local notifications.
- `src/navigation/AppNavigator.tsx`: tabs (Gallery, Add, Settings) and modal (AddItem).
- `src/screens/GalleryScreen.tsx`: grid gallery, header add buttons, share.
- `src/screens/AddItemScreen.tsx`: voice/manual caption then save.
- `src/screens/SettingsScreen.tsx`: dark mode toggle, notifications permissions.
- `src/utils/speech.ts`: cross-platform speech utility.
- `src/utils/share.ts`: cross-platform share utility.
- `src/utils/notifications.ts`: local notifications helper.

## Notes

- Voice dictation requires microphone permission; on web it uses the Web Speech API if available.
- Notifications require permission; toggle in Settings to grant.
- This project uses Expo SDK 54.x dependencies. If you see version warnings, run `expo install` to align versions.
