# v092 Native Mobile Navigation Patch

Apply:
1. Unzip into repo root and overwrite files.
2. Run `npm run build`.
3. Deploy and test on iPhone.

Files:
- `app/layout.tsx`
- `components/ClientShell.tsx`
- `app/globals.css`

What changed:
- Mobile header now behaves like a native app:
  - hamburger left
  - centered Les Bi Gulf Friends brand
  - notifications right
- Mobile gets a fixed bottom tab bar:
  - Home
  - Groups
  - Events
  - Messages
  - Profile
- Profile menu remains in the desktop header, but mobile uses the bottom Profile tab.
- Keeps v091.1 overflow fixes.
- Adds safe-area padding for iPhone bottom notch/home bar.
