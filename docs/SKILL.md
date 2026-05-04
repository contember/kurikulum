---
name: kurikulum
description: >
  Kurikulum e-learning course framework. Headless Preact compound components
  (core) + styled Tailwind template. Multi-locale content via virtual modules,
  SCORM 1.2 / 2004 / cmi5 / xAPI delivery, opinionated <KurikulumApp> root.
globs:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.css"
---

# Kurikulum E-Learning Framework

Two-layer architecture (Radix + shadcn/ui style):

- **`kurikulum`** — headless compound components, hooks, adapters, i18n (npm dependency, don't edit)
- **`src/`** — styled Preact wrappers with Tailwind (copied from template, freely editable)

## Key Files

- `src/course.tsx` — entry: `<KurikulumApp>` + `<DefaultLayout>` + `<Page>` list
- `src/layout.tsx` — chrome shell (Search/Glossary/Notes/footer)
- `src/content/<locale>/index.ts` — per-locale exports: `title`, `glossary`, `pages`
- `src/content/<locale>/pages/*.tsx` — per-locale page body components
- `src/components/*.tsx` — styled wrappers
- `src/styles.css` — theme tokens

## Read Before Writing Code

- Course config & setup — `docs/course-setup.md`
- Internationalization (locales, dictionaries, build modes) — `docs/i18n.md`
- Pages & completion — `docs/pages.md`
- Assessment (quiz) — `docs/assessment.md`
- Questions (MCQ, FillBlank, Matching, Ordering, CategorySort) — `docs/questions.md`
- Text, images, video, audio — `docs/media.md`
- Glossary, notes, search — `docs/tools.md`
- Adapters & SCORM/xAPI build — `docs/adapters.md`
- Hooks — `docs/hooks.md`
- Styling & theming — `docs/styling.md`
- Architecture — `docs/architecture.md`

## Quick Start — New Page

1. Create the body for each locale you support:
   - `src/content/cs/pages/MyPage.tsx`
   - `src/content/en/pages/MyPage.tsx` (if multi-locale)
2. Register in `src/content/<locale>/index.ts` `pages` map: `'my-page': MyPage`.
3. Add `'my-page'` to `config.pages` in `src/course.tsx`.
4. Add `<Page id="my-page" completion="..." />` inside `<DefaultLayout>` — it auto-renders the body from the active locale's bundle.

## Quick Start — Add Locale

1. `cp -r src/content/cs src/content/en` (or whatever language code).
2. Translate strings inside `src/content/en/index.ts` and `pages/*.tsx`.
3. Build per-locale: `KURIKULUM_LOCALE=en bun run build:scorm` → `dist/Course-en.zip`.
4. Dev mode (`bun run dev`) auto-loads every locale and shows a switcher; click or press `Alt+L`.

## Always Remember

- **Gate summary/certificate pages after an `<Assessment>`** with `when={(rt) => rt.state.assessments['<id>']?.passed === true}` — otherwise Next advances past the quiz regardless of score. See `docs/assessment.md` → _Gating Summary / Certificate Pages_.
- **Page IDs in three places must match**: `config.pages` array, `pages` map keys in `content/<locale>/index.ts`, and `<Page id="…">` JSX.
- **Don't write hardcoded UI strings in template wrappers** — use `useLocale().t(key)` and add the key to `coreDictCs/En` (in core) or to a per-locale dictionaries override passed to `<KurikulumApp dictionaries={…}>`.

## Build Commands

```bash
bun run dev                            # multi-locale dev, switcher visible
bun run build                          # standalone web (first locale)
KURIKULUM_LOCALE=cs bun run build:scorm  # SCORM 1.2 ZIP — Czech
KURIKULUM_LOCALE=en bun run build:scorm  # SCORM 1.2 ZIP — English
KURIKULUM_TARGET=cmi5 bun run build    # cmi5
KURIKULUM_TARGET=xapi bun run build    # xAPI
```
