import { execFileSync } from 'node:child_process'

import { buildProxyEnv } from './proxy.mjs'

function run(command, args, env = process.env) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

function fetchJson(url, env = process.env) {
  const proxiedRaw = run('curl', ['-sS', url], buildProxyEnv(env))
  if (proxiedRaw) {
    return { payload: JSON.parse(proxiedRaw), mode: 'proxy' }
  }

  const directRaw = run('curl', ['-sS', url], env)
  if (directRaw) {
    return { payload: JSON.parse(directRaw), mode: 'direct' }
  }

  return { payload: {}, mode: 'unavailable' }
}

export function normalizeIpInfoPayload(payload) {
  return {
    ip: payload.ip || '',
    city: payload.city || '',
    region: payload.region || '',
    country: payload.country || '',
    org: payload.org || '',
    timezone: payload.timezone || '',
  }
}

export function gatherEgressSnapshot(env = process.env) {
  const payloadSource = env.CC_REGION_LOCK_IPINFO_JSON
  if (payloadSource) {
    return {
      ...normalizeIpInfoPayload(JSON.parse(payloadSource)),
      mode: 'fixture',
    }
  }

  const { payload, mode } = fetchJson('https://ipinfo.io/json', env)
  return {
    ...normalizeIpInfoPayload(payload),
    mode,
  }
}
