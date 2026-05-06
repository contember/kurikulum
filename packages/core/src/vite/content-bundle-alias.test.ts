import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CONTENT_BUNDLE_ALIAS } from './content-bundle-alias.ts'

// auto.tsx imports from a literal string (you can't use a runtime value as
// an `import ... from ...` specifier). The literal must match the alias the
// kurikulum() Vite plugin registers, otherwise the import resolves nowhere
// at runtime. This test pins the two together so renaming one without
// touching the other fails CI loudly instead of bricking the dev preview.
test('auto.tsx imports the same alias the plugin registers', () => {
  const autoSrc = readFileSync(resolve(import.meta.dir, '../app/auto.tsx'), 'utf-8')
  const importRe = /from\s+['"]([^'"]+)['"]/g
  const importedSpecifiers = [...autoSrc.matchAll(importRe)].map(m => m[1])

  expect(importedSpecifiers).toContain(CONTENT_BUNDLE_ALIAS)
})

// virtual-modules.d.ts declares the module so consumers get types for the
// alias. The declaration name must also match.
test('virtual-modules.d.ts declares the same alias', () => {
  const dts = readFileSync(resolve(import.meta.dir, 'virtual-modules.d.ts'), 'utf-8')

  expect(dts).toContain(`declare module '${CONTENT_BUNDLE_ALIAS}'`)
})
