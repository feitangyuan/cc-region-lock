# Region Lock Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone macOS + Chrome CLI that detects the current egress country and automatically applies matching timezone, locale, and Chrome language settings.

**Architecture:** A small Node.js CLI fetches public IP metadata, resolves a country preset, then applies system defaults and Chrome preference changes. The tool stays dependency-light by using built-in Node modules and native macOS commands like `defaults`, `systemsetup`, and `osascript`.

**Tech Stack:** Node.js 25, built-in `node:test`, `child_process`, `fs`, `path`

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `README.md`
- Create: `AGENTS.md`
- Create: `bin/region-lock.mjs`
- Create: `src/index.mjs`
- Test: `tests/region-lock.test.mjs`

**Step 1: Write the failing test**

Add a test that imports the public API and expects a Singapore preset to be resolved from a sample IP payload.

**Step 2: Run test to verify it fails**

Run: `node --test tests/region-lock.test.mjs`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

Add the project package metadata and minimal exported functions.

**Step 4: Run test to verify it passes**

Run: `node --test tests/region-lock.test.mjs`
Expected: PASS for the first preset test.

### Task 2: Detection + Presets

**Files:**
- Create: `src/presets.mjs`
- Create: `src/detect.mjs`
- Modify: `src/index.mjs`
- Test: `tests/region-lock.test.mjs`

**Step 1: Write failing tests**

Add tests for:
- `SG` resolving to Singapore locale/timezone/language
- `JP` resolving to Japanese locale/timezone/language
- unsupported country returning a clear error

**Step 2: Run test to verify it fails**

Run: `node --test tests/region-lock.test.mjs`

**Step 3: Write minimal implementation**

Implement preset mapping and IP payload normalization.

**Step 4: Run test to verify it passes**

Run: `node --test tests/region-lock.test.mjs`

### Task 3: Apply Logic

**Files:**
- Create: `src/apply.mjs`
- Modify: `src/index.mjs`
- Test: `tests/region-lock.test.mjs`

**Step 1: Write failing tests**

Add tests for generating the exact system and Chrome update operations from a preset.

**Step 2: Run test to verify it fails**

Run: `node --test tests/region-lock.test.mjs`

**Step 3: Write minimal implementation**

Implement:
- Chrome graceful quit
- `defaults write` for locale/languages
- `systemsetup -settimezone` with `sudo` when needed
- Chrome `Preferences` JSON rewrite

**Step 4: Run test to verify it passes**

Run: `node --test tests/region-lock.test.mjs`

### Task 4: CLI + Verification

**Files:**
- Modify: `bin/region-lock.mjs`
- Modify: `README.md`
- Modify: `package.json`

**Step 1: Wire CLI**

Default command should:
- detect egress profile
- print target profile
- apply changes
- print restart guidance

**Step 2: Add safe flags**

Support:
- `--dry-run`
- `--check`

**Step 3: Run verification**

Run:
- `node --check src/*.mjs bin/region-lock.mjs`
- `node --test tests/region-lock.test.mjs`

Expected:
- syntax check passes
- tests pass
