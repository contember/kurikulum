# Kurikulum SDK — Agent Instructions

## Jak pracovat

1. Najdi první issue se statusem `[ ]` (todo) v seznamu níže.
2. Přečti si odpovídající spec soubor v `spec/` adresáři.
3. Implementuj řešení podle specifikace a akceptačních kritérií.
4. Napiš testy a spusť je (`bun test`). Oprav případné chyby.
5. Commitni změny — atomický commit, explicitní `git add` konkrétních souborů.
6. Označ issue jako hotovou — změň `[ ]` na `[x]` v tomto souboru a commitni.
7. Skonči. Neřeš další issue — vždy jen jednu na jedno spuštění.

## Pravidla

- **Jedna issue na spuštění.** Po commitnutí hotové issue skonči.
- **Čti spec.** Každá issue má detailní spec v `spec/XX-*.md` — přečti ho celý než začneš psát kód.
- **Testuj.** Každá issue má akceptační kritéria. Napiš unit testy kde to dává smysl. Spusť `bun test` a ověř že všechno prochází.
- **Commituj atomicky.** Jeden commit per issue. Commit message: `feat: <stručný popis>`. Explicitní `git add` — nikdy `git add .` nebo `git add -A`.
- **Nerozbij existující kód.** Před commitem spusť `bun test` na celém projektu.
- **Drž se specifikace.** Nepřidávej features navíc, nerefaktoruj existující kód mimo scope issue.

## Issues — v1 (hotovo)

| # | Issue | Spec | Status |
|---|-------|------|--------|
| 1 | Monorepo scaffold — Bun workspace, @kurikulum/core + template | [spec/01-monorepo-scaffold.md](spec/01-monorepo-scaffold.md) | `[x]` |
| 2 | CourseState + CourseRuntime — flat state, navigace, completion, assessment, lifecycle | [spec/02-course-runtime.md](spec/02-course-runtime.md) | `[x]` |
| 3 | Completion strategie — mount, timer, scroll, manual, interactive | [spec/03-completion-strategies.md](spec/03-completion-strategies.md) | `[x]` |
| 4 | Hooky — useCourse, useNavigation, useCompletion, useAssessment, usePage | [spec/04-hooks.md](spec/04-hooks.md) | `[x]` |
| 5 | CourseProvider — Preact context, inicializace runtime, restore/suspend | [spec/05-course-provider.md](spec/05-course-provider.md) | `[x]` |
| 6 | Standalone adapter — DeliveryAdapter interface, localStorage persistence | [spec/06-standalone-adapter.md](spec/06-standalone-adapter.md) | `[x]` |
| 7 | Template layout — Course, Page, Navigation komponenty | [spec/07-template-layout.md](spec/07-template-layout.md) | `[x]` |
| 8 | Template content — Text, Image, Video komponenty | [spec/08-template-content.md](spec/08-template-content.md) | `[x]` |
| 9 | Template assessment — MCQ, MultiSelect, Option, Assessment, QuestionFeedback | [spec/09-template-assessment.md](spec/09-template-assessment.md) | `[x]` |
| 10 | Accessibility — WCAG 2.1 AA, keyboard nav, ARIA, focus management | [spec/10-a11y.md](spec/10-a11y.md) | `[x]` |
| 11 | Tailwind v4 theme — CSS-first konfigurace, design tokens | [spec/11-tailwind-theme.md](spec/11-tailwind-theme.md) | `[x]` |
| 12 | Vite plugin — Preact alias, single-file build, target z env | [spec/12-vite-plugin.md](spec/12-vite-plugin.md) | `[x]` |
| 13 | SCORM 1.2 adapter — CMI mapování, API discovery, fallback | [spec/13-scorm-adapter.md](spec/13-scorm-adapter.md) | `[x]` |
| 14 | SCORM packaging — imsmanifest.xml generátor, ZIP balení | [spec/14-scorm-packaging.md](spec/14-scorm-packaging.md) | `[x]` |
| 15 | E2E test — testovací kurz, standalone + SCORM ověření | [spec/15-e2e-test.md](spec/15-e2e-test.md) | `[x]` |

## Issues — v2

| # | Issue | Spec | Status |
|---|-------|------|--------|
| 16 | Vážené skórování a partial credit — weighted evaluators, MultiSelect partial scoring | [spec/16-weighted-scoring.md](spec/16-weighted-scoring.md) | `[ ]` |
| 17 | Fill-in-the-blank — textový input s validací (string, pole, regex) | [spec/17-fill-in-the-blank.md](spec/17-fill-in-the-blank.md) | `[ ]` |
| 18 | Matching — přiřazování prompt→response, dropdown, partial credit | [spec/18-matching.md](spec/18-matching.md) | `[ ]` |
| 19 | Ordering — řazení položek, move up/down, partial credit | [spec/19-ordering.md](spec/19-ordering.md) | `[ ]` |
| 20 | Multi-assessment per kurz — nezávislé skóre, vážený celkový výsledek | [spec/20-multi-assessment.md](spec/20-multi-assessment.md) | `[ ]` |
| 21 | SCORM interaction logging — cmi.interactions.*, per-question audit trail | [spec/21-scorm-interactions.md](spec/21-scorm-interactions.md) | `[ ]` |
| 22 | Podmíněná navigace — when prop na Page, branching, remediace | [spec/22-conditional-navigation.md](spec/22-conditional-navigation.md) | `[ ]` |
| 23 | Historie pokusů — log skóre per pokus, Assessment.History component | [spec/23-attempt-history.md](spec/23-attempt-history.md) | `[ ]` |
| 24 | SCORM 2004 adapter — API_1484_11, split status, ISO 8601, scaled score | [spec/24-scorm-2004.md](spec/24-scorm-2004.md) | `[ ]` |
| 25 | Verzování suspend_data — envelope s verzí, migrace, bezpečný reset | [spec/25-suspend-data-versioning.md](spec/25-suspend-data-versioning.md) | `[ ]` |
