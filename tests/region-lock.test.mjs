import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeIpInfoPayload,
  resolveProfileForCountry,
  buildApplyPlan,
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
  assert.equal(profile.appleLocale, 'en_SG')
  assert.deepEqual(profile.appleLanguages, ['en-SG', 'en', 'zh-Hans'])
  assert.equal(profile.chromeAcceptLanguages, 'en-SG,en')
})

test('resolves Japan preset', () => {
  const profile = resolveProfileForCountry('JP')
  assert.equal(profile.country, 'JP')
  assert.equal(profile.timezone, 'Asia/Tokyo')
  assert.equal(profile.appleLocale, 'ja_JP')
  assert.deepEqual(profile.appleLanguages, ['ja-JP', 'ja', 'en'])
  assert.equal(profile.chromeAcceptLanguages, 'ja-JP,ja,en')
})

test('throws for unsupported country', () => {
  assert.throws(() => resolveProfileForCountry('US'), /Unsupported country/)
})

test('builds an apply plan for Chrome and macOS', () => {
  const plan = buildApplyPlan(resolveProfileForCountry('SG'))

  assert.equal(plan.timezoneCommand.at(-1), 'Asia/Singapore')
  assert.equal(plan.appleLocaleCommand.at(-1), 'en_SG')
  assert.deepEqual(plan.appleLanguagesCommand.slice(-3), ['en-SG', 'en', 'zh-Hans'])
  assert.equal(plan.chromeAcceptLanguages, 'en-SG,en')
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
