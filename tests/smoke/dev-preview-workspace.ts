#!/usr/bin/env bun
/**
 * Workspace-symlink dev-preview smoke test (the daily-driver path for
 * kurikulum maintainers).
 *
 * Sibling of `dev-preview.ts`, which exercises the npm-install configuration
 * that produced the 0.1.4 → 0.2.0 patch chain. This one runs vite directly
 * against `template/`, where `kurikulum` is symlinked from the workspace
 * (`packages/core`) and Vite's dep optimizer SKIPS pre-bundling. That's a
 * structurally different code path: kurikulum source files are served
 * individually via `/@fs/` URLs, so any regression that depends on a single
 * pre-bundled chunk being present (e.g., the 0.2.0 alias resolution) needs
 * to be verified to still hold here.
 */

import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '../..')
const TEMPLATE = resolve(ROOT, 'template')
const PORT = 5188

function step(label: string) {
  console.log(`\n→ ${label}`)
}

async function fetchOk(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return await res.text()
}

async function waitForPort(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) })
      if (res.ok) return
    } catch {
      /* not ready yet */
    }
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error(`vite server didn't come up at ${url} within ${timeoutMs}ms`)
}

async function main() {
  step(`booting vite dev on :${PORT} (workspace mode, against ${TEMPLATE})`)
  const vite = spawn('bunx', ['--bun', 'vite', '--port', String(PORT), '--strictPort'], {
    cwd: TEMPLATE,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  vite.stdout?.on('data', d => process.stdout.write(`[vite] ${d}`))
  vite.stderr?.on('data', d => process.stderr.write(`[vite] ${d}`))

  const cleanup = () => {
    try {
      vite.kill('SIGTERM')
    } catch {}
  }
  process.on('exit', cleanup)
  process.on('SIGINT', () => {
    cleanup()
    process.exit(130)
  })

  try {
    await waitForPort(`http://localhost:${PORT}/`, 30_000)

    step('static checks: workspace serves kurikulum from source (no pre-bundling)')
    const autoSrc = await fetchOk(`http://localhost:${PORT}/node_modules/kurikulum/src/app/auto.tsx`)
    // In workspace mode the optimizer skips kurikulum, so `from 'kurikulum'`
    // resolves through `/@fs/` to the workspace source — NOT to a
    // `.vite/deps/kurikulum.js` chunk.
    if (/\/node_modules\/\.vite\/deps\/kurikulum\.js/.test(autoSrc)) {
      throw new Error('auto.tsx unexpectedly resolves kurikulum through .vite/deps in workspace mode — optimizer is now bundling symlinked deps')
    }
    if (!/\/@fs\/.*packages\/core\/src/.test(autoSrc)) {
      throw new Error('auto.tsx does not resolve kurikulum to the workspace source — symlink resolution broke')
    }
    if (!/node_modules\/\.kurikulum\/content\.mjs/.test(autoSrc)) {
      throw new Error('auto.tsx does not import the generated content module from disk')
    }
    console.log('  ✓ kurikulum served from source via /@fs/')
    console.log('  ✓ auto.tsx wires through workspace source + disk content module')

    step('runtime check: headless browser renders the page without errors')
    await runtimeCheck(`http://localhost:${PORT}/`)
    console.log('  ✓ page renders content from the active locale bundle')
    console.log('  ✓ no console errors / no unhandled exceptions')

    console.log('\n✓ workspace smoke test passed')
  } finally {
    cleanup()
  }
}

async function runtimeCheck(url: string) {
  let chromium: any
  try {
    ;({ chromium } = await import('playwright-core'))
  } catch {
    throw new Error('playwright-core not installed — run `bun install` at the repo root first')
  }

  const browser = await chromium.launch()
  const errors: string[] = []
  try {
    const page = await browser.newPage()
    page.on('pageerror', (err: Error) => errors.push(`pageerror: ${err.message}`))
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
    })

    await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 })
    const h1 = await page.textContent('h1', { timeout: 5_000 })
    if (!h1 || h1.trim().length === 0) {
      throw new Error('no <h1> rendered — page failed to mount')
    }

    if (errors.length > 0) {
      throw new Error(`runtime errors:\n  ${errors.join('\n  ')}`)
    }
  } finally {
    await browser.close()
  }
}

main().catch(err => {
  console.error(`\n✗ workspace smoke test failed: ${err.message}`)
  process.exit(1)
})
