/**
 * Bare specifier under which the kurikulum() Vite plugin exposes the
 * generated content module via `resolve.alias`. `kurikulum/auto` imports
 * from this; the alias resolves to a real file inside the project's
 * `node_modules/.kurikulum/`, which lets the dep optimizer pre-bundle
 * the auto entry alongside the rest of the package.
 *
 * Keep in sync with the literal string in `packages/core/src/app/auto.tsx`.
 * `content-bundle-alias.test.ts` enforces that match.
 */
export const CONTENT_BUNDLE_ALIAS = '@kurikulum/content-bundle'
