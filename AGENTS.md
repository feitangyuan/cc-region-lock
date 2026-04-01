# region-lock

Reply in Chinese. Keep responses concise. Use English for code comments.

Project goals:
- macOS + Chrome only
- single command CLI
- auto-detect egress country and apply matching timezone/locale/browser language
- minimal dependencies

Quality bar:
- `node --check src/*.mjs bin/region-lock.mjs`
- `node --test tests/region-lock.test.mjs`
