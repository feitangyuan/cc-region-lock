import { execFileSync } from 'node:child_process'

function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

export function gatherRegionSnapshot() {
  return {
    timezoneOffset: run('date', ['+%z']),
  }
}
