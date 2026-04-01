import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const CHROME_PREFERENCES_PATH = path.join(
  process.env.HOME,
  'Library',
  'Application Support',
  'Google',
  'Chrome',
  'Default',
  'Preferences',
)

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

function runInteractive(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    throw new Error(`${command} failed with status ${result.status ?? 'unknown'}`)
  }
}

export function buildApplyPlan(profile) {
  return {
    timezoneCommand: ['-settimezone', profile.timezone],
    appleLocaleCommand: ['write', '-g', 'AppleLocale', '-string', profile.appleLocale],
    appleLanguagesCommand: ['write', '-g', 'AppleLanguages', '-array', ...profile.appleLanguages],
    chromePreferencesPath: CHROME_PREFERENCES_PATH,
    chromeAcceptLanguages: profile.chromeAcceptLanguages,
  }
}

export function summarizeHealth(snapshot) {
  const failures = []

  if (!snapshot.country) {
    failures.push('country drift: expected detected country, got unknown')
  }

  if (!snapshot.timezone) {
    failures.push('egress timezone drift: expected detected timezone, got unknown')
  }

  if (snapshot.country === 'SG' && snapshot.timezone !== 'Asia/Singapore') {
    failures.push(`egress timezone drift: expected Asia/Singapore, got ${snapshot.timezone}`)
  }

  if (snapshot.country === 'JP' && snapshot.timezone !== 'Asia/Tokyo') {
    failures.push(`egress timezone drift: expected Asia/Tokyo, got ${snapshot.timezone}`)
  }

  if (snapshot.country === 'SG' && snapshot.localTimezoneOffset !== '+0800') {
    failures.push(`local timezone drift: expected +0800, got ${snapshot.localTimezoneOffset}`)
  }

  if (snapshot.country === 'JP' && snapshot.localTimezoneOffset !== '+0900') {
    failures.push(`local timezone drift: expected +0900, got ${snapshot.localTimezoneOffset}`)
  }

  return {
    ok: failures.length === 0,
    failures,
  }
}

function quitChromeIfRunning() {
  spawnSync('osascript', ['-e', 'tell application "Google Chrome" to quit'], {
    stdio: 'ignore',
  })
}

function updateChromePreferences(profile) {
  const raw = fs.readFileSync(CHROME_PREFERENCES_PATH, 'utf8')
  const preferences = JSON.parse(raw)

  preferences.intl ??= {}
  preferences.intl.accept_languages = profile.chromeAcceptLanguages
  preferences.intl.selected_languages = profile.chromeAcceptLanguages

  fs.writeFileSync(CHROME_PREFERENCES_PATH, JSON.stringify(preferences))
}

export function applyProfile(profile, { dryRun = false } = {}) {
  const plan = buildApplyPlan(profile)
  if (dryRun) return plan

  quitChromeIfRunning()
  run('defaults', plan.appleLocaleCommand)
  run('defaults', plan.appleLanguagesCommand)
  if (process.getuid?.() === 0) {
    runInteractive('systemsetup', plan.timezoneCommand)
  } else {
    runInteractive('sudo', ['systemsetup', ...plan.timezoneCommand])
  }
  updateChromePreferences(profile)

  return plan
}
