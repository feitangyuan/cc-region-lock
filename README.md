# region-lock

`region-lock` is a small macOS + Chrome CLI that detects your current egress country and aligns local timezone, locale, and Chrome language settings to match it.

## Scope

- macOS only
- Google Chrome only
- no external npm dependencies

## What It Changes

- macOS timezone via `systemsetup`
- macOS `AppleLocale`
- macOS `AppleLanguages`
- Chrome `intl.accept_languages`

## Usage

```bash
node bin/region-lock.mjs --check
node bin/region-lock.mjs --dry-run
node bin/region-lock.mjs
```

Default behavior:
- detect current egress country from `ipinfo.io`
- resolve a built-in country profile
- quit Chrome gracefully
- apply settings directly

If timezone changes require elevation, macOS will prompt for `sudo`.

## Supported Profiles

- Singapore (`SG`)
- Japan (`JP`)

## Verification

```bash
npm test
npm run check
```
