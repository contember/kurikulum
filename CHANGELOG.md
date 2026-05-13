# Changelog

## 0.2.1

### Fixed

- **Search index leaked TypeScript syntax and JSX expression containers
  into results.** The `searchIndexPlugin` ran `stripTags` over each
  page component's full source, so tokens like `function HishingHowPage(): VNode { return (`,
  bare imports, and `{t('translated.key')}` expressions ended up in
  search hits. The plugin now extracts the body of the component's
  `return` (handling both `return (…)` and bare `return <jsx>` shapes
  with a string- and comment-aware paren walker), strips JSX expression
  containers `{…}`, then strips tags. Visible JSX text is preserved.

## 0.2.0

### Breaking

- **`<Page.ScrollSentinel />` is now a no-op and deprecated.** `Page.Root`
  auto-renders the sentinel inside `<main>` whenever
  `completion === 'scroll'`. Existing layouts that include
  `<Page.ScrollSentinel />` as a sibling of page content keep working (the
  component returns `null`), but the explicit usage should be removed —
  it's purely cosmetic noise now and the export will be deleted in a
  future release.

  Migration:
  ```diff
    <P.Root id={id} completion={completion} ...>
      {children}
  -   <P.ScrollSentinel />
    </P.Root>
  ```

### Fixed

- **`useCourse must be used within a CourseProvider` in npm-installed
  consumers (root cause).** Previous releases (0.1.5 / 0.1.6) worked
  around two layers of Vite optimizer fragility — first by excluding
  `kurikulum` from dep pre-bundling (which surfaced a
  `?v=`-cache-bust race in dev), then by aliasing `kurikulum/auto`
  through an in-process virtual module. Both were mitigations for the
  same underlying issue: `kurikulum/auto`'s static
  `import 'virtual:kurikulum-content'` was unresolvable during dep
  pre-bundling, forcing Vite to leave the subpath unbundled while the
  bare `kurikulum` import got pre-bundled, yielding two distinct
  `CourseContext` instances at runtime.

  The kurikulum() Vite plugin now writes a real on-disk content module
  to `node_modules/.kurikulum/content.mjs` and exposes it via
  `resolve.alias` under the bare specifier `@kurikulum/content-bundle`.
  `kurikulum/auto` imports from that alias instead of `virtual:`,
  letting both `kurikulum` and `kurikulum/auto` pre-bundle into a
  single chunk that holds one `CourseContext` singleton. The
  intermittent `does not provide an export named 'X'` errors that
  haunted 0.1.6 are gone with the optimizer churn that caused them.

- **Empty `<Page id="…" />` declarations now fall back to the active
  bundle's page component.** Previously the empty-children check was
  defeated by the template's unconditional `<P.ScrollSentinel />`
  sibling, leaving `<main>` empty. With the sentinel now auto-rendered
  by `Page.Root`, the template wrapper passes through only real
  children and the bundle lookup fires reliably.

- **HMR for content edits.** Adding or removing a locale under
  `src/content/` now invalidates the generated content module and
  triggers a full reload, so the locale switcher reflects the change
  without a manual restart.

### Added

- npm-install dev-preview smoke test (`bun run smoke:npm`) and
  workspace-symlink dev-preview smoke test (`bun run smoke:workspace`).
  Both run as part of `bun run smoke`. CI runs them on every push to
  `main` and again at release time. This is the regression bar for the
  bug class that produced the 0.1.4 → 0.2.0 patch chain — local dev in
  the workspace symlinks the package and skips Vite's dep optimizer
  entirely, so consumer-side issues only surfaced after npm publish.

### Internal

- The content-bundle alias name (`@kurikulum/content-bundle`) lives in
  one constant (`packages/core/src/vite/content-bundle-alias.ts`),
  imported by the plugin. A unit test (`content-bundle-alias.test.ts`)
  enforces that `auto.tsx`'s import literal and `virtual-modules.d.ts`'
  module declaration both match the constant.

## 0.1.6

- Dev-preview only: aliased `kurikulum/auto` through an in-process
  virtual module to prevent the dep optimizer from producing two
  parallel kurikulum chunks (which manifested as random
  `does not provide an export named 'X'` errors in dev). Superseded by
  the 0.2.0 architectural fix.

## 0.1.5

- Excluded `kurikulum` from Vite's dep pre-bundling to dodge the
  duplicate `CourseContext` issue in npm-installed consumers.
  Superseded by the 0.2.0 architectural fix.
- `Page.Root`: empty-children detection now ignores the explicit
  `<ScrollSentinel />` sibling so `<Page id="…" />` correctly falls
  back to the active bundle's page component.

## 0.1.4

- Initial published release with `KurikulumApp`, `kurikulum/auto`,
  `kurikulum/vite` meta-plugin, and the multi-locale content
  convention.
