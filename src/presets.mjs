const PROFILES = {
  SG: {
    country: 'SG',
    label: 'Singapore',
    timezone: 'Asia/Singapore',
    timezoneOffset: '+0800',
    appleLocale: 'en_SG',
  },
  JP: {
    country: 'JP',
    label: 'Japan',
    timezone: 'Asia/Tokyo',
    timezoneOffset: '+0900',
    appleLocale: 'ja_JP',
  },
}

export function resolveProfileForCountry(country) {
  const profile = PROFILES[country]
  if (!profile) {
    throw new Error(`Unsupported country: ${country}`)
  }

  return profile
}

export function listSupportedCountries() {
  return Object.keys(PROFILES)
}
