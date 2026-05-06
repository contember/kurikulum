#!/usr/bin/env bun
/**
 * NPM-install dev-preview smoke test.
 *
 * Reproduces the configuration that caused 0.1.4 → 0.1.6 patch chain:
 *   1. Pack `packages/core` into a tarball (npm-style install, no symlink).
 *   2. Stand up a clean copy of `template/` and install the tarball.
 *   3. Boot `vite dev` against it.
 *   4. Open the page in headless Chromium, assert no console errors and that
 *      content from the active locale bundle actually rendered.
 *   5. Verify structurally that the dep optimizer pre-bundled `kurikulum`
 *      into a single chunk and that `kurikulum/auto` wires through that
 *      chunk (single CourseContext singleton).
 */

import { spawn, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '../..')
const PORT = 5189

function step(label: string) {
  console.log(`\n→ ${label}`)
}

function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}) {
  const res = spawnSync(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' })
  if (res.status !== 0) {
    throw new Error(`command failed (exit ${res.status}): ${cmd} ${args.join(' ')}`)
  }
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
  step('packing kurikulum core')
  const corePkgDir = join(ROOT, 'packages/core')
  // Wipe stale tarballs so we can deterministically pick the one we just made.
  for (const f of [...spawnSync('ls', [corePkgDir]).stdout.toString().split('\n')]) {
    if (f.startsWith('kurikulum-') && f.endsWith('.tgz')) {
      rmSync(join(corePkgDir, f), { force: true })
    }
  }
  run('bun', ['pm', 'pack'], corePkgDir)
  const tarball = spawnSync('ls', [corePkgDir]).stdout.toString().split('\n').find(f => f.startsWith('kurikulum-') && f.endsWith('.tgz'))
  if (!tarball) throw new Error('no tarball produced')
  const tarballPath = join(corePkgDir, tarball)

  step(`setting up smoke fixture in tmp dir`)
  const smokeDir = mkdtempSync(join(tmpdir(), 'kurikulum-smoke-'))
  cpSync(join(ROOT, 'template'), smokeDir, { recursive: true })
  rmSync(join(smokeDir, 'node_modules'), { recursive: true, force: true })
  rmSync(join(smokeDir, 'dist'), { recursive: true, force: true })
  rmSync(join(smokeDir, 'bun.lock'), { force: true })

  // Switch from workspace symlink to tarball install — this is the
  // configuration that triggered the original bugs.
  const pkgPath = join(smokeDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.dependencies.kurikulum = `file:${tarballPath}`
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

  step('npm install (resolves kurikulum from tarball)')
  run('npm', ['install', '--silent', '--no-audit', '--no-fund'], smokeDir)

  step(`booting vite dev on :${PORT}`)
  const vite = spawn('bunx', ['--bun', 'vite', '--port', String(PORT), '--strictPort'], {
    cwd: smokeDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  vite.stdout?.on('data', d => process.stdout.write(`[vite] ${d}`))
  vite.stderr?.on('data', d => process.stderr.write(`[vite] ${d}`))

  const cleanup = () => {
    try {
      vite.kill('SIGTERM')
    } catch {}
    try {
      rmSync(smokeDir, { recursive: true, force: true })
    } catch {}
    try {
      rmSync(tarballPath, { force: true })
    } catch {}
  }
  process.on('exit', cleanup)
  process.on('SIGINT', () => {
    cleanup()
    process.exit(130)
  })

  try {
    await waitForPort(`http://localhost:${PORT}/`, 30_000)

    step('static checks: optimizer state')
    const depsDir = join(smokeDir, 'node_modules/.vite/deps')
    if (!existsSync(join(depsDir, 'kurikulum.js'))) {
      throw new Error('expected `kurikulum.js` to be pre-bundled into one chunk')
    }
    // The content-bundle alias gets sanitized to a filename by Vite. Look for
    // any chunk whose name contains the alias; presence indicates the
    // optimizer traced into the disk content file (which would inline kurikulum
    // sources alongside it and break the CourseContext singleton).
    const depsFiles = spawnSync('ls', [depsDir]).stdout.toString().split('\n')
    const aliasChunk = depsFiles.find(f => /content[-_]bundle/.test(f))
    if (aliasChunk) {
      throw new Error(`the content bundle alias must NOT be pre-bundled (found ${aliasChunk}) — it pulls in a duplicate kurikulum copy when traced`)
    }
    console.log('  ✓ kurikulum pre-bundled into a single chunk')
    console.log('  ✓ content bundle alias is not pre-bundled')

    step('static checks: auto.tsx wires through pre-bundled chunk')
    const autoSrc = await fetchOk(`http://localhost:${PORT}/node_modules/kurikulum/src/app/auto.tsx`)
    if (!/\/node_modules\/\.vite\/deps\/kurikulum\.js/.test(autoSrc)) {
      throw new Error('auto.tsx does not import kurikulum from the pre-bundled chunk — dup-context regression')
    }
    if (!/\/node_modules\/\.kurikulum\/content\.mjs/.test(autoSrc)) {
      throw new Error('auto.tsx does not import the generated content module from disk')
    }
    console.log('  ✓ auto.tsx imports kurikulum from /node_modules/.vite/deps/kurikulum.js')
    console.log('  ✓ auto.tsx imports content from /node_modules/.kurikulum/content.mjs')

    step('runtime check: headless browser renders the page without errors')
    await runtimeCheck(`http://localhost:${PORT}/`)
    console.log('  ✓ page renders content from the active locale bundle')
    console.log('  ✓ no console errors / no unhandled exceptions')

    console.log('\n✓ smoke test passed')
  } finally {
    cleanup()
  }
}

async function runtimeCheck(url: string) {
  // Use playwright-core (lighter than @playwright/test). Loaded dynamically
  // so devs can still run other smoke targets without the dep installed.
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
  console.error(`\n✗ smoke test failed: ${err.message}`)
  process.exit(1)
})
