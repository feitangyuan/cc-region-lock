#!/usr/bin/env node

import { gatherEgressSnapshot } from '../src/egress.mjs'

console.log(JSON.stringify(gatherEgressSnapshot(), null, 2))
