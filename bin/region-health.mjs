#!/usr/bin/env node

import { gatherEgressSnapshot } from '../src/egress.mjs'
import { evaluateEgressSnapshot, evaluateHealth, evaluateRegionSnapshot } from '../src/health.mjs'
import { resolveProfileForCountry } from '../src/presets.mjs'
import { gatherRegionSnapshot } from '../src/region.mjs'

const egress = gatherEgressSnapshot()
const profile = resolveProfileForCountry(egress.country)
const region = gatherRegionSnapshot()
const regionResult = evaluateRegionSnapshot(region, profile)
const egressResult = evaluateEgressSnapshot(egress, profile)
const health = evaluateHealth(regionResult, egressResult)

console.log(JSON.stringify({
  profile,
  region: { ...region, ...regionResult },
  egress: { ...egress, ...egressResult },
  ...health,
}, null, 2))

process.exitCode = health.ok ? 0 : 1
