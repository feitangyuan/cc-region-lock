#!/usr/bin/env node

import { gatherRegionSnapshot } from '../src/region.mjs'

console.log(JSON.stringify(gatherRegionSnapshot(), null, 2))
