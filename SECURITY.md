# Security Policy

Jotji is a privacy-first, local-first notes app. Its whole purpose is to keep your data
private and on your device, so security reports are taken seriously.

## Reporting a vulnerability

**Please do not report security vulnerabilities in public GitHub issues or pull requests.**

Instead, report them privately by email:

- **sura@southofmemphis.com**

Please include, as far as you can:

- a description of the issue and its potential impact,
- the steps to reproduce it (a proof of concept if possible),
- the app version (Settings → About, or the `versionCode`) and device/Android version,
- any relevant logs or screenshots.

You can also use GitHub's **private vulnerability reporting** ("Report a vulnerability" on
the Security tab) if it is enabled for this repository.

### What to expect

This is a small, single-maintainer project, so responses are best-effort rather than on a
fixed SLA. You can generally expect an initial acknowledgement within about a week. Please
allow a reasonable time for a fix to ship before any public disclosure, and I'll keep you
updated on progress. Credit will gladly be given for valid, responsibly disclosed reports
(let me know if you'd prefer to remain anonymous).

## Supported versions

Security fixes target the **latest released version** on Google Play. Because there is no
server component, older installs are updated by shipping a new app version rather than a
backported patch.

## Security design (context for researchers)

Jotji has **no accounts, no cloud, and no analytics** — there is no backend to attack, and
the app does not transmit your notes anywhere on its own. Notes, notebooks, tags,
attachments, and scans are stored only on the device.

Key properties:

- **Encrypted at rest** — the SQLite database is encrypted with SQLCipher. The encryption
  key lives only in `expo-secure-store` (Android Keystore–backed, hardware-bound where
  available) and is never written to source, `.env`, or plain shared preferences.
- **No silent off-device copy** — the app sets `allowBackup=false`, so the database is not
  swept into Android's automatic cloud backup.
- **Parameterized SQL only** — all database access uses bound parameters; user input is
  never concatenated into query strings. Search input is normalized through a dedicated
  safe full-text-search query builder before any `MATCH`.
- **HTML sanitization** — rich-text/editor HTML is sanitized against an allowlist before it
  is persisted, as the XSS boundary for the sandboxed editor WebView.
- **Optional App Lock** — a biometric/device-credential gate handled by Android; Jotji
  never sees or stores biometric data or the PIN.
- **User-initiated egress only** — data leaves the device only when the user explicitly
  shares a note/scan, opts in to downloading remote images during an Evernote import,
  creates a backup to a location they pick, or opens an external link. The document scanner
  downloads Google's on-device ML Kit model once on first use; this transfers no user
  content.

### Out of scope

- Vulnerabilities in third-party apps you choose to **share** a note or scan with (their
  handling of that content is governed by their own policies).
- Issues that require a physical, unlocked device plus an already-authenticated session.
- Reports about the deprecated Android edge-to-edge window APIs surfaced by upstream React
  Native / Material libraries — these are framework-level and are tracked for an upstream
  dependency upgrade.

Thank you for helping keep Jotji and its users safe.
