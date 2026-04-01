const PROFILES = {
  SG: {
    country: 'SG',
    label: 'Singapore',
    timezone: 'Asia/Singapore',
    timezoneOffset: '+0800',
    appleLocale: 'en_SG',
    appleLanguages: ['en-SG', 'en', 'zh-Hans'],
    chromeAcceptLanguages: 'en-SG,en',
  },
  JP: {
    country: 'JP',
    label: 'Japan',
    timezone: 'Asia/Tokyo',
    timezoneOffset: '+0900',
    appleLocale: 'ja_JP',
    appleLanguages: ['ja-JP', 'ja', 'en'],
    chromeAcceptLanguages: 'ja-JP,ja,en',
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
