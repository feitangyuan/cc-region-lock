export function evaluateEgressSnapshot(snapshot, profile) {
  const failures = []

  if (snapshot.mode === 'unavailable') {
    failures.push('egress probe unavailable: proxy/direct network path both failed')
  }

  if (snapshot.country !== profile.country) {
    failures.push(`egress country drift: expected ${profile.country}, got ${snapshot.country || 'unknown'}`)
  }

  if (snapshot.timezone !== profile.timezone) {
    failures.push(`egress timezone drift: expected ${profile.timezone}, got ${snapshot.timezone || 'unknown'}`)
  }

  return {
    ok: failures.length === 0,
    failures,
  }
}

export function evaluateRegionSnapshot(snapshot, profile) {
  const failures = []

  if (snapshot.timezoneOffset !== profile.timezoneOffset) {
    failures.push(`local timezone drift: expected ${profile.timezoneOffset}, got ${snapshot.timezoneOffset || 'unknown'}`)
  }

  return {
    ok: failures.length === 0,
    failures,
  }
}

export function shouldNotify(status) {
  const failures = status?.failures || []
  const egressMode = status?.egress?.mode
  const regionOk = status?.region?.ok !== false
  const onlyEgressUnavailable =
    failures.length > 0 &&
    regionOk &&
    egressMode === 'unavailable' &&
    failures.every((failure) => failure.startsWith('egress '))

  return !onlyEgressUnavailable && failures.length > 0
}

export function evaluateHealth(regionResult, egressResult) {
  const failures = [
    ...(regionResult?.failures || []),
    ...(egressResult?.failures || []),
  ]

  return {
    ok: failures.length === 0,
    failures,
    notify: shouldNotify({
      failures,
      region: regionResult,
      egress: egressResult,
    }),
    region: regionResult,
    egress: egressResult,
  }
}
