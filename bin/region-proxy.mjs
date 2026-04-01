#!/usr/bin/env node

import { spawn } from 'node:child_process'

import { buildProxyEnv } from '../src/proxy.mjs'

const [command, ...args] = process.argv.slice(2)

if (!command) {
  console.error('Usage: cc-region-proxy <command> [args...]')
  process.exit(1)
}

const child = spawn(command, args, {
  stdio: 'inherit',
  env: buildProxyEnv(),
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
