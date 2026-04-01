import fs from 'node:fs'
import path from 'node:path'

import { resolveProxyConfig } from './proxy.mjs'

const BLOCK_START = '# >>> cc-region-lock >>>'
const BLOCK_END = '# <<< cc-region-lock <<<'

export function buildShellBlock(baseEnv = process.env) {
  const proxy = resolveProxyConfig(baseEnv)

  return [
    BLOCK_START,
    'export PATH="$HOME/.local/bin:$PATH"',
    `export HTTP_PROXY="${proxy.httpProxy}"`,
    `export HTTPS_PROXY="${proxy.httpsProxy}"`,
    `export ALL_PROXY="${proxy.allProxy}"`,
    `export NO_PROXY="${proxy.noProxy}"`,
    'cc-region-check() { command "$HOME/.local/bin/cc-region-check" "$@"; }',
    'cc-egress-check() { command "$HOME/.local/bin/cc-egress-check" "$@"; }',
    'cc-region-health() { command "$HOME/.local/bin/cc-region-health" "$@"; }',
    'cc-region-proxy() { command "$HOME/.local/bin/cc-region-proxy" "$@"; }',
    BLOCK_END,
  ].join('\n')
}

export function upsertShellBlock(shellRcPath, block) {
  const targetPath = shellRcPath || path.join(process.env.HOME, '.zshrc')
  const current = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : ''
  const pattern = new RegExp(`${BLOCK_START}[\\s\\S]*?${BLOCK_END}\\n?`, 'g')
  const clean = current.replace(pattern, '').trimEnd()
  const next = `${clean}${clean ? '\n\n' : ''}${block}\n`
  const changed = next !== current

  if (changed) {
    fs.writeFileSync(targetPath, next)
  }

  return {
    shellRcPath: targetPath,
    changed,
  }
}
