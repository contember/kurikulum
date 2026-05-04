# Kurikulum

E-learning course framework with Preact — headless core + styled template, SCORM 1.2 / 2004 / cmi5 / xAPI delivery, multi-locale content.

## Tech Stack

- TypeScript, Preact (JSX with `jsxImportSource: preact`)
- Bun runtime and test runner
- Vite + Tailwind CSS v4 (template)
- Monorepo: Bun workspaces (`packages/*`, `template`)

## Commands

```bash
# Type check + lint + format + tests (root)
bun run check

# Just one of them
bun run typecheck
bun run lint
bun test

# Dev server (template) — multi-locale, switcher visible
cd template && bun run dev

# Per-locale SCORM build → dist/scorm-1.2-cs/ + dist/Course-cs.zip
cd template && KURIKULUM_LOCALE=cs bun run build:scorm
cd template && KURIKULUM_LOCALE=en bun run build:scorm
```

## Project Structure

```
packages/core/                # Headless runtime, hooks, components, i18n,
                              # adapters, completion strategies, Vite plugins,
                              # SCORM/cmi5 packaging
template/
  src/
    course.tsx                # Entry: <KurikulumApp> + <DefaultLayout> + <Page> list
    layout.tsx                # DefaultLayout chrome (Search/Glossary/Notes/footer)
    components/               # Styled wrappers around core headless components
    content/<locale>/         # Per-locale content
      index.ts                #   exports { title, glossary, pages }
      pages/*.tsx             #   page body components
    styles.css                # Theme tokens
tests/template/               # Integration/E2E tests for template components
spec/                         # Spec documents
docs/                         # Author-facing guides (start with docs/SKILL.md)
```

## Architecture

- **Core** exposes headless compound components (Radix-style: `Assessment`, `MCQ`, `MultiSelect`, `Page`, `Navigation`, `Course`, `Search`, `Glossary`, `Notes`, `Audio`) with context providers
- **Template** components are thin wrappers that add Tailwind styling over core headless components
- **`<KurikulumApp>`** (`kurikulum/auto`) is the recommended app shell — wires `LocaleProvider` + `CourseProvider` + content bundle context, defaults adapter from `KURIKULUM_TARGET`, defaults dictionaries from `coreDictCs/En`. See `docs/course-setup.md`.
- **i18n** lives in core: `LocaleProvider`, `useLocale()`, `t(key, vars)` with dev-only missing-key warnings. See `docs/i18n.md`.
- **Content bundles** are produced from `template/src/content/<locale>/index.ts` by the `kurikulum()` Vite plugin and exposed as `virtual:kurikulum-content`. Single-locale builds tree-shake; `auto` mode (dev default) eager-globs every locale.
- **Adapters** (`standalone`, `scorm-1.2`, `scorm-2004`, `xapi`) implement `DeliveryAdapter`. Optional `get/setLanguagePreference` is mapped to `cmi.*_preference.language` (SCORM) or `localStorage` (standalone).
- **Completion strategies**: `mount`, `timer`, `scroll`, `interactive`, `manual`.

## Code Conventions

- Use `.ts` extension in all imports (`import { foo } from './bar.ts'`) — required by `verbatimModuleSyntax`
- JSX files use `.tsx` extension
- Tests are colocated with source in `packages/core/src/`; template tests live in `tests/template/`
- Preact hooks prefixed with `use` — all in `packages/core/src/hooks/`

## Git Commits

Always combine `git add` and `git commit` into a single bash command. Never use `git add -A` or `git add .` — explicitly list files.
