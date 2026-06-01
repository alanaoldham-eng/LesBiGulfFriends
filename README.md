# v091.1 Mobile Width Fix

Apply:
1. Unzip into repo root and overwrite `app/globals.css`.
2. Run `npm run build`.
3. Deploy and test on iPhone.

Fixes:
- Prevents horizontal page overflow.
- Keeps hamburger, notification, and profile icons top-right and horizontal.
- Stops long URLs/text from stretching the viewport.
- Forces text, sections, messages, and media to wrap inside mobile width.
- Makes textareas/inputs fit their parent cards.
- Adds defensive fixes for flex children missing `min-width: 0`.
