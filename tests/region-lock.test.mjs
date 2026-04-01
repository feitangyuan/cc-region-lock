import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildApplyPlan,
  buildProxyEnv,
  buildShellBlock,
  evaluateEgressSnapshot,
  evaluateHealth,
  evaluateRegionSnapshot,
  normalizeIpInfoPayload,
  parseSystemTimezoneOutput,
  parseTimezoneFromLocaltimeTarget,
  resolveProfileForCountry,
  resolveProxyConfig,
  shouldNotify,
  upsertShellBlock,
} from '../src/index.mjs'

test('resolves Singapore preset', () => {
  const profile = resolveProfileForCountry('SG')

  assert.equal(profile.country, 'SG')
  assert.equal(profile.timezone, 'Asia/Singapore')
  assert.equal(profile.timezoneOffset, '+0800')
})

test('builds a timezone-only apply plan', () => {
  const plan = buildApplyPlan(resolveProfileForCountry('SG'))

  assert.deepEqual(plan, {
    timezoneCommand: ['-settimezone', 'Asia/Singapore'],
  })
})

test('builds proxy env from defaults', () => {
  const env = buildProxyEnv({ PATH: '/usr/bin:/bin' })

  assert.equal(env.HTTP_PROXY, 'http://127.0.0.1:7890')
  assert.equal(env.HTTPS_PROXY, 'http://127.0.0.1:7890')
  assert.equal(env.ALL_PROXY, 'socks5://127.0.0.1:7890')
  assert.equal(env.NO_PROXY, 'localhost,127.0.0.1,::1')
  assert.equal(env.PATH, '/usr/bin:/bin')
})

test('resolves proxy config from explicit env', () => {
  const proxy = resolveProxyConfig({
    HTTP_PROXY: 'http://127.0.0.1:9999',
    HTTPS_PROXY: 'http://127.0.0.1:9998',
    ALL_PROXY: 'socks5://127.0.0.1:9997',
    NO_PROXY: 'localhost',
  })

  assert.deepEqual(proxy, {
    httpProxy: 'http://127.0.0.1:9999',
    httpsProxy: 'http://127.0.0.1:9998',
    allProxy: 'socks5://127.0.0.1:9997',
    noProxy: 'localhost',
  })
})

test('normalizes ipinfo payload', () => {
  const snapshot = normalizeIpInfoPayload({
    ip: '23.249.26.176',
    city: 'Singapore',
    region: 'Singapore',
    country: 'SG',
    org: 'AS400618 Prime Security Corp.',
    timezone: 'Asia/Singapore',
  })

  assert.deepEqual(snapshot, {
    ip: '23.249.26.176',
    city: 'Singapore',
    region: 'Singapore',
    country: 'SG',
    org: 'AS400618 Prime Security Corp.',
    timezone: 'Asia/Singapore',
  })
})

test('parses timezone from system output and localtime target', () => {
  assert.equal(parseSystemTimezoneOutput('Time Zone: Asia/Singapore\n'), 'Asia/Singapore')
  assert.equal(parseSystemTimezoneOutput('时区：Asia/Singapore\n'), 'Asia/Singapore')
  assert.equal(parseTimezoneFromLocaltimeTarget('/var/db/timezone/zoneinfo/Asia/Singapore'), 'Asia/Singapore')
})

test('accepts matching region and egress snapshots', () => {
  const profile = resolveProfileForCountry('SG')
  const regionResult = evaluateRegionSnapshot({ timezoneOffset: '+0800' }, profile)
  const egressResult = evaluateEgressSnapshot({
    country: 'SG',
    timezone: 'Asia/Singapore',
    mode: 'proxy',
  }, profile)

  assert.equal(regionResult.ok, true)
  assert.equal(egressResult.ok, true)
})

test('flags mismatched egress and region snapshots', () => {
  const profile = resolveProfileForCountry('SG')
  const regionResult = evaluateRegionSnapshot({ timezoneOffset: '+0900' }, profile)
  const egressResult = evaluateEgressSnapshot({
    country: 'JP',
    timezone: 'Asia/Tokyo',
    mode: 'proxy',
  }, profile)

  assert.equal(regionResult.ok, false)
  assert.ok(regionResult.failures.some((item) => item.includes('local timezone')))
  assert.equal(egressResult.ok, false)
  assert.ok(egressResult.failures.some((item) => item.includes('country')))
})

test('suppresses notify for egress probe unavailable only', () => {
  const health = evaluateHealth(
    { ok: true, failures: [] },
    {
      ok: false,
      failures: [
        'egress probe unavailable: proxy/direct network path both failed',
        'egress country drift: expected SG, got unknown',
        'egress timezone drift: expected Asia/Singapore, got unknown',
      ],
      mode: 'unavailable',
    },
  )

  assert.equal(health.ok, false)
  assert.equal(health.notify, false)
  assert.equal(shouldNotify(health), false)
})

test('notifies for real drift failures', () => {
  const health = evaluateHealth(
    { ok: false, failures: ['local timezone drift: expected +0800, got +0900'] },
    { ok: true, failures: [], mode: 'proxy' },
  )

  assert.equal(health.ok, false)
  assert.equal(health.notify, true)
  assert.equal(shouldNotify(health), true)
})

test('builds and upserts shell block', async () => {
  const fs = await import('node:fs')
  const os = await import('node:os')
  const path = await import('node:path')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-region-lock-'))
  const shellRcPath = path.join(tempDir, '.zshrc')
  const block = buildShellBlock({
    HTTP_PROXY: 'http://127.0.0.1:7890',
    HTTPS_PROXY: 'http://127.0.0.1:7890',
    ALL_PROXY: 'socks5://127.0.0.1:7890',
    NO_PROXY: 'localhost,127.0.0.1,::1',
  })

  const first = upsertShellBlock(shellRcPath, block)
  const second = upsertShellBlock(shellRcPath, block)
  const content = fs.readFileSync(shellRcPath, 'utf8')

  assert.equal(first.changed, true)
  assert.equal(second.changed, false)
  assert.ok(content.includes('cc-region-health'))
  assert.ok(content.includes('export HTTP_PROXY="http://127.0.0.1:7890"'))
})
