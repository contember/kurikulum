# Kurikulum

E-learning course framework with Preact — headless core + styled template, SCORM 1.2 packaging support.

## Tech Stack

- TypeScript, Preact (JSX with `jsxImportSource: preact`)
- Bun runtime and test runner
- Vite + Tailwind CSS v4 (template)
- Monorepo: Bun workspaces (`packages/*`, `template`)

## Commands

```bash
# Type check (root)
bun run typecheck

# Run all tests
bun test

# Both
bun run check

# Dev server (template)
cd template && bun run dev

# Build template
cd template && bun run build

# Build SCORM package
cd template && bun run build:scorm
```

## Project Structure

```
packages/core/     # Headless runtime, hooks, components, completion strategies, SCORM packaging
template/          # Styled Preact components wrapping core, Vite app entry
tests/template/    # Integration/E2E tests for template components
spec/              # Spec documents (00-overview.md through 15-e2e-test.md)
```

## Architecture

- **Core** exposes headless compound components (Radix-style: `Assessment`, `MCQ`, `MultiSelect`, `Page`, `Navigation`, `Course`) with context providers
- **Template** components are thin wrappers that add Tailwind styling over core headless components
- Adapters (`standalone`, `scorm12`) implement the `DeliveryAdapter` interface for runtime persistence
- Completion strategies: `mount`, `timer`, `scroll`, `interactive`, `manual`

## Code Conventions

- Use `.ts` extension in all imports (`import { foo } from './bar.ts'`) — required by `verbatimModuleSyntax`
- JSX files use `.tsx` extension
- Tests are colocated with source in `packages/core/src/`; template tests live in `tests/template/`
- Preact hooks prefixed with `use` — all in `packages/core/src/hooks/`

## Git Commits

Always combine `git add` and `git commit` into a single bash command. Never use `git add -A` or `git add .` — explicitly list files.
