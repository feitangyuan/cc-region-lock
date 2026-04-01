import fs from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'

const LOCALTIME_PATH = '/etc/localtime'
const ZONEINFO_MARKER = '/var/db/timezone/zoneinfo/'

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

function runInteractive(command, args) {
  const result = spawnSync(command, args, {
    stdio: ['inherit', 'ignore', 'ignore'],
  })
  if (result.status !== 0) {
    throw new Error(`${command} failed with status ${result.status ?? 'unknown'}`)
  }
}

export function parseSystemTimezoneOutput(output) {
  const match = output.match(/\b[A-Za-z_]+(?:\/[A-Za-z_+-]+)+\b/)
  return match?.[0]?.trim() || ''
}

export function parseTimezoneFromLocaltimeTarget(target) {
  const index = target.indexOf(ZONEINFO_MARKER)
  if (index === -1) return ''
  return target.slice(index + ZONEINFO_MARKER.length).trim()
}

function readCurrentSystemTimezone() {
  try {
    const target = fs.readlinkSync(LOCALTIME_PATH)
    const timezone = parseTimezoneFromLocaltimeTarget(target)
    if (timezone) return timezone
  } catch {
    // Fall through to systemsetup for environments without a localtime symlink.
  }

  return parseSystemTimezoneOutput(run('systemsetup', ['-gettimezone']))
}

function ensureSystemTimezone(timezone) {
  const currentTimezone = readCurrentSystemTimezone()
  if (currentTimezone === timezone) {
    return {
      changed: false,
      currentTimezone,
    }
  }

  if (process.getuid?.() === 0) {
    runInteractive('systemsetup', ['-settimezone', timezone])
  } else {
    runInteractive('sudo', ['systemsetup', '-settimezone', timezone])
  }

  const nextTimezone = readCurrentSystemTimezone()
  if (nextTimezone !== timezone) {
    throw new Error(`timezone apply failed: expected ${timezone}, got ${nextTimezone || 'unknown'}`)
  }

  return {
    changed: true,
    currentTimezone,
  }
}

export function buildApplyPlan(profile) {
  return {
    timezoneCommand: ['-settimezone', profile.timezone],
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

export function applyProfile(profile, { dryRun = false } = {}) {
  const plan = buildApplyPlan(profile)
  if (dryRun) return plan

  const timezoneResult = ensureSystemTimezone(profile.timezone)

  return {
    ...plan,
    timezoneChanged: timezoneResult.changed,
  }
}
