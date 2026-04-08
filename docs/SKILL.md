---
name: tabule
description: >
  Tabule e-learning course framework. Headless Preact compound components (core)
  + styled Tailwind template. Covers course creation, questions, completion, SCORM/xAPI.
globs:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.css"
---

# Tabule E-Learning Framework

Two-layer architecture (Radix + shadcn/ui style):

- **`@kurikulum/core`** — headless compound components, hooks, adapters (npm dependency, don't edit)
- **`src/`** — styled Preact wrappers with Tailwind (copied from template, freely editable)

## Key Files

- `src/course.tsx` — entry point (config, adapter, layout)
- `src/pages/*.tsx` — page content
- `src/components/*.tsx` — styled wrappers
- `src/styles.css` — theme tokens

## Read Before Writing Code

- Architecture — `docs/architecture.md`
- Course config & setup — `docs/course-setup.md`
- Pages & completion — `docs/pages.md`
- Assessment (quiz) — `docs/assessment.md`
- Questions (MCQ, FillBlank, Matching, Ordering, CategorySort) — `docs/questions.md`
- Text, images, video, audio — `docs/media.md`
- Glossary, notes, search — `docs/tools.md`
- Adapters & SCORM/xAPI build — `docs/adapters.md`
- Hooks — `docs/hooks.md`
- Styling & theming — `docs/styling.md`

## Quick Start — New Page

1. Create `src/pages/MyPage.tsx`
2. Import in `src/course.tsx`
3. Add page ID to `config.pages` array
4. Add `<Page id="my-page" completion="..."><MyPage /></Page>` inside `<Course>`

## Build Commands

```bash
bun run dev              # Dev server
bun run build            # Standalone
bun run build:scorm      # SCORM 1.2 ZIP
```
