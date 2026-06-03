@AGENTS.md

# Jotji

A local-first, **Android-only** (phones + tablets), donation-supported note-taking app.
Editorial "Living Archive" design language. No accounts, no cloud, no analytics — everything
stays in an encrypted on-device database.

## Stack
- Expo SDK 56 · React Native 0.85 · React 19 · TypeScript (strict)
- **Custom dev client required** (op-sqlite + native modules; Expo Go is NOT supported)
- Encrypted SQLite via **@op-engineering/op-sqlite + SQLCipher** (key in expo-secure-store)
- Rich text via **@10play/tentap-editor** (TipTap in a sandboxed WebView)
- State: **Zustand** (one store per feature) · Nav: React Navigation v7 (tabs + native stack)
- Reanimated 4 (worklets) · Gesture Handler · FlashList · expo-image-picker/file-system

## Run / verify
Node 20 is required (use the nvm install, not the system node 12):
```
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
npx tsc --noEmit        # typecheck (must be clean)
npx jest                # unit tests (sanitizer + FTS query builder)
npx expo run:android    # build + launch the dev client (needs Android SDK + JDK 17)
```
Building the APK needs **JDK 17+** (the box currently has JDK 11) and the Android SDK.

## Architecture (feature-first + shared core)
- `src/core/db/` — the ONLY place SQL runs. `database.ts` exposes `run/all/first/transaction`
  with **bound params**; repositories use these exclusively. `migrations.ts` (PRAGMA
  user_version), `fts.ts` (safe FTS5 MATCH builder), `repositories/*`.
- `src/core/security/` — `keystore.ts` (DB key), `htmlSanitizer.ts` (allowlist; XSS boundary
  for editor HTML), `appLock.ts` (biometric/passcode gate).
- `src/core/theme/` — light+dark M3 tokens, fonts (Manrope display + user-selectable body
  family/size), `ThemeProvider`/`useTheme`.
- `src/core/components/` — shared primitives (Text, Screen, Button, FAB, BottomSheet, …).
- `src/features/{notes,notebooks,tags,search,profile,donations}/` — screens/components/store/types.
- `src/navigation/` — `RootNavigator` + `AppTabNavigator`. App bootstrap in `src/core/bootstrap.ts`.

## Security rules (non-negotiable)
- **Never** concatenate user input into SQL. Static query string + params array, always
  (an ESLint guard flags template-literal SQL).
- Sanitize note HTML on save (`sanitizeHtml`) before persistence.
- Search input goes through `buildFtsMatchQuery` before any FTS `MATCH`.
- DB encryption key lives only in expo-secure-store; never in source/.env/AsyncStorage.

## Deferred (not in MVP)
AI (Claude Haiku, isolated + prompt-injection-safe), checklists, reminders, voice notes,
document scanner, iOS, cloud sync. Donation URL in `SupportScreen.tsx` is a placeholder.
