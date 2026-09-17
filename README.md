# Jotji

**Private, on-device notes for Android.** Capture notes, scan documents, and keep
everything in an encrypted database on your phone — no account, no cloud, no analytics.

Jotji is a local-first, Android-only note-taking app with an editorial "Living Archive"
design. Your notes never leave your device unless you choose to share or back them up
yourself.

- **License:** [GPL-3.0-or-later](LICENSE)
- **Platform:** Android (phones + tablets)
- **Privacy policy:** https://jotji.com/privacy

## Features

- **Notes** with rich text (headings, lists, checklists, links, code), saved as you type
- **Notebooks and tags** to organize and cross-reference
- **Document scanner** — capture multi-page PDFs (or save pages as JPGs) with on-device
  edge detection; scans go straight into a note or a device-local scan library
- **Attachments** — photos and files, viewable in-app (including a built-in PDF viewer)
- **Full-text search** across every note
- **Encrypted on-device storage** — SQLite via SQLCipher, with the key held in the Android
  Keystore; the app sets `allowBackup=false` so notes are never copied off-device silently
- **Backup & restore** — a single portable file (optionally passphrase-encrypted) that
  survives an uninstall, reset, or new phone; restore merges without duplicating
- **Optional App Lock** — require your fingerprint or device PIN to open the app
- **Import from Evernote** (`.enex`)
- **Bring-your-own AI** — hand a single note or scan to an AI app you already have via the
  system share sheet; Jotji has no built-in AI and sends nothing on its own

## Privacy & security

Jotji is built so that it *can't* see your data — there are no servers and no accounts.
Everything is stored locally in an encrypted database, and the only network activity is a
handful of clearly user-initiated or one-time actions (see the
[privacy policy](https://jotji.com/privacy)). For the threat model, data handling, and how
to report a vulnerability, see [SECURITY.md](SECURITY.md).

Highlights of the security design:

- Encrypted SQLite (SQLCipher); encryption key stored only in `expo-secure-store`
  (Android Keystore–backed), never in source, `.env`, or plain preferences
- All database access uses **bound parameters** — user input is never concatenated into SQL
- Editor HTML is **sanitized** (allowlist) before it is persisted
- Search input is normalized through a safe FTS query builder before any `MATCH`

## Tech stack

- [Expo](https://expo.dev/) SDK 56 · React Native 0.85 · React 19 · TypeScript (strict)
- Encrypted SQLite via [`@op-engineering/op-sqlite`](https://github.com/OP-Engineering/op-sqlite) + SQLCipher
- Rich text via [`@10play/tentap-editor`](https://github.com/10play/10tap-editor) (TipTap in a sandboxed WebView)
- Zustand (state) · React Navigation v7 · Reanimated 4 · FlashList
- Document scanning via Google ML Kit (on-device)

## Getting started (development)

> **A custom dev client is required.** Jotji uses native modules (op-sqlite/SQLCipher,
> the scanner, the PDF viewer), so **Expo Go is not supported** — you must build and run a
> dev client.

**Prerequisites**

- **Node 20** (newer LTS is fine; the app does not build on very old Node)
- **JDK 17+**
- **Android SDK** (with a recent platform + build-tools) and an emulator or a physical device

**Install and verify**

```bash
npm install
npm run typecheck   # tsc --noEmit — must be clean
npm test            # unit tests (HTML sanitizer + FTS query builder)
```

**Run on Android** (builds and launches the dev client):

```bash
npm run android
```

## Project layout

```
src/
  core/
    db/          # the ONLY place SQL runs — bound params, migrations, safe FTS builder, repositories
    security/    # DB key (Keystore), HTML sanitizer, app lock
    theme/       # light + dark Material 3 tokens, fonts
    components/  # shared primitives (Text, Screen, Button, BottomSheet, …)
  features/      # feature-first: notes, notebooks, tags, search, scanner, backup, profile, donations, …
  navigation/    # root navigator + tab navigator
```

See [CLAUDE.md](CLAUDE.md) for a fuller architecture overview and the project's
non-negotiable security rules.

## Contributing

Issues and pull requests are welcome. A couple of notes:

- This is a small, single-maintainer project — please be patient with response times.
- **Do not report security issues in public issues.** See [SECURITY.md](SECURITY.md).
- Keep the security rules above intact (bound-param SQL, HTML sanitization, no secrets in
  source). `npm run typecheck`, `npm test`, and `npm run lint` should all pass.

## License

Jotji is free software licensed under the **GNU General Public License v3.0 or later**
(GPL-3.0-or-later). See [LICENSE](LICENSE) for the full text.

Copyright © 2026 Surazen.

### Trademark

The **Jotji** name and logo are trademarks of the developer and are **not** covered by the
GPL. You may build, modify, and redistribute the source under the GPL, but any fork you
distribute (for example on an app store) must use its **own** name and branding, and must
not imply endorsement by, or affiliation with, Jotji.
