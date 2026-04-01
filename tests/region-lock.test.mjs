import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeIpInfoPayload,
  resolveProfileForCountry,
  buildApplyPlan,
  parseSystemTimezoneOutput,
  summarizeHealth,
  detectEgressPayloadFromSource,
} from '../src/index.mjs'

test('normalizes ipinfo payload', () => {
  const result = normalizeIpInfoPayload({
    ip: '23.249.26.176',
    city: 'Singapore',
    region: 'Singapore',
    country: 'SG',
    timezone: 'Asia/Singapore',
    org: 'AS400618 Prime Security Corp.',
  })

  assert.deepEqual(result, {
    ip: '23.249.26.176',
    city: 'Singapore',
    region: 'Singapore',
    country: 'SG',
    timezone: 'Asia/Singapore',
    org: 'AS400618 Prime Security Corp.',
  })
})

test('resolves Singapore preset', () => {
  const profile = resolveProfileForCountry('SG')
  assert.equal(profile.country, 'SG')
  assert.equal(profile.timezone, 'Asia/Singapore')
  assert.equal('appleLocale' in profile, false)
})

test('resolves Japan preset', () => {
  const profile = resolveProfileForCountry('JP')
  assert.equal(profile.country, 'JP')
  assert.equal(profile.timezone, 'Asia/Tokyo')
  assert.equal('appleLocale' in profile, false)
})

test('throws for unsupported country', () => {
  assert.throws(() => resolveProfileForCountry('US'), /Unsupported country/)
})

test('builds an apply plan for Chrome and macOS', () => {
  const plan = buildApplyPlan(resolveProfileForCountry('SG'))

  assert.equal(plan.timezoneCommand.at(-1), 'Asia/Singapore')
  assert.equal('appleLocaleCommand' in plan, false)
  assert.equal('appleLanguagesCommand' in plan, false)
  assert.equal('chromeAcceptLanguages' in plan, false)
})

test('parses timezone from systemsetup output', () => {
  const timezone = parseSystemTimezoneOutput('Time Zone: Asia/Singapore\n')

  assert.equal(timezone, 'Asia/Singapore')
})

test('parses timezone from localized systemsetup output', () => {
  const timezone = parseSystemTimezoneOutput('时区：Asia/Singapore\n')

  assert.equal(timezone, 'Asia/Singapore')
})

test('summarizes healthy state', () => {
  const summary = summarizeHealth({
    country: 'SG',
    timezone: 'Asia/Singapore',
    localTimezoneOffset: '+0800',
  })

  assert.equal(summary.ok, true)
  assert.deepEqual(summary.failures, [])
})

test('summarizes drift state', () => {
  const summary = summarizeHealth({
    country: 'JP',
    timezone: 'Asia/Tokyo',
    localTimezoneOffset: '+0800',
  })

  assert.equal(summary.ok, false)
  assert.ok(summary.failures.some((item) => item.includes('local timezone')))
})

test('detects payload from explicit source string', () => {
  const result = detectEgressPayloadFromSource(JSON.stringify({
    ip: '1.1.1.1',
    city: 'Tokyo',
    region: 'Tokyo',
    country: 'JP',
    timezone: 'Asia/Tokyo',
    org: 'Example ISP',
  }))

  assert.equal(result.country, 'JP')
  assert.equal(result.timezone, 'Asia/Tokyo')
})
