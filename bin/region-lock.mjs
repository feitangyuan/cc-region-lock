#!/usr/bin/env node

import { applyProfile, buildApplyPlan } from '../src/apply.mjs'
import { gatherEgressSnapshot } from '../src/egress.mjs'
import { evaluateEgressSnapshot, evaluateHealth, evaluateRegionSnapshot } from '../src/health.mjs'
import { resolveProfileForCountry, listSupportedCountries } from '../src/presets.mjs'
import { gatherRegionSnapshot } from '../src/region.mjs'
import { buildShellBlock, upsertShellBlock } from '../src/shell.mjs'

function printJson(value) {
  console.log(JSON.stringify(value, null, 2))
}

function main() {
  const args = new Set(process.argv.slice(2))
  const dryRun = args.has('--dry-run')
  const check = args.has('--check')

  try {
    const egress = gatherEgressSnapshot()
    const profile = resolveProfileForCountry(egress.country)
    const regionBefore = gatherRegionSnapshot()
    const healthBefore = evaluateHealth(
      evaluateRegionSnapshot(regionBefore, profile),
      evaluateEgressSnapshot(egress, profile),
    )

    if (check) {
      printJson({
        detected: egress,
        target: profile,
        region: regionBefore,
        health: healthBefore,
      })
      process.exitCode = healthBefore.ok ? 0 : 1
      return
    }

    const plan = dryRun ? buildApplyPlan(profile) : applyProfile(profile)
    const shellPlan = dryRun
      ? { shellRcPath: `${process.env.HOME}/.zshrc`, changed: true }
      : upsertShellBlock(null, buildShellBlock())
    const regionAfter = gatherRegionSnapshot()
    const healthAfter = evaluateHealth(
      evaluateRegionSnapshot(regionAfter, profile),
      evaluateEgressSnapshot(egress, profile),
    )

    printJson({
      detected: egress,
      target: profile,
      dryRun,
      applied: plan,
      shell: {
        ...shellPlan,
      },
      health: healthAfter,
      next: [
        'Open a new terminal session to load shell proxy exports',
        'Use cc-egress-check / cc-region-check / cc-region-health to verify consistency',
      ],
    })
    process.exitCode = healthAfter.ok ? 0 : 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    if (String(error).includes('Unsupported country')) {
      console.error(`Supported countries: ${listSupportedCountries().join(', ')}`)
    }
    process.exitCode = 1
  }
}

main()
