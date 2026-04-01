#!/usr/bin/env node

import { applyProfile, buildApplyPlan, summarizeHealth } from '../src/apply.mjs'
import { detectEgressPayload, detectLocalTimezoneOffset } from '../src/detect.mjs'
import { resolveProfileForCountry, listSupportedCountries } from '../src/presets.mjs'

function printJson(value) {
  console.log(JSON.stringify(value, null, 2))
}

function main() {
  const args = new Set(process.argv.slice(2))
  const dryRun = args.has('--dry-run')
  const check = args.has('--check')

  try {
    const egress = detectEgressPayload()
    const profile = resolveProfileForCountry(egress.country)
    const health = summarizeHealth({
      country: egress.country,
      timezone: egress.timezone,
      localTimezoneOffset: detectLocalTimezoneOffset(),
    })

    if (check) {
      printJson({
        detected: egress,
        target: profile,
        health,
      })
      process.exitCode = health.ok ? 0 : 1
      return
    }

    const plan = dryRun ? buildApplyPlan(profile) : applyProfile(profile)
    printJson({
      detected: egress,
      target: profile,
      dryRun,
      applied: plan,
      next: [
        'Reopen Google Chrome',
        'Re-login sensitive sites if you changed country recently',
      ],
    })
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    console.error(`Supported countries: ${listSupportedCountries().join(', ')}`)
    process.exitCode = 1
  }
}

main()
