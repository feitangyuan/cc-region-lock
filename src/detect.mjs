import { execFileSync } from 'node:child_process'

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    }).trim()
  } catch (error) {
    if (options.allowFailure) return ''
    throw error
  }
}

export function normalizeIpInfoPayload(payload) {
  return {
    ip: payload.ip || '',
    city: payload.city || '',
    region: payload.region || '',
    country: payload.country || '',
    timezone: payload.timezone || '',
    org: payload.org || '',
  }
}

export function detectEgressPayloadFromSource(source) {
  return normalizeIpInfoPayload(JSON.parse(source))
}

export function detectEgressPayload() {
  const raw = process.env.REGION_LOCK_IPINFO_JSON || run('curl', ['-sS', 'https://ipinfo.io/json'])
  return detectEgressPayloadFromSource(raw)
}

export function detectLocalTimezoneOffset() {
  return run('date', ['+%z'])
}
