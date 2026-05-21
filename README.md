# v090 Responsive UX + Badge Ordering Patch

Apply:
1. Unzip into repo root and overwrite files.
2. Run `npm run build`.

Includes:
- Responsive/native-mobile polish for thread layout.
- Fixes iPhone nested group threads being cut off by reducing nested indentation and forcing text/media wrapping.
- Adds lazy loading and full-width responsive media in group threads.
- OG badges always show first.
- Event badges are collapsed by default and expand in descending date order.
- Voted 🗳️ badges are collapsed by default and expand in descending deadline/date order.
- Keeps banned/removed profile unavailable behavior from v088.
