# region-lock

Reply in Chinese. Keep responses concise. Use English for code comments.

Project goals:
- macOS + Chrome only
- single-command agent workflow
- auto-detect egress country and apply matching timezone
- install terminal proxy env helpers and consistency checks
- target Codex / Claude Code as the primary operator
- minimal dependencies

Quality bar:
- `node --check src/*.mjs bin/*.mjs`
- `node --test tests/region-lock.test.mjs`
