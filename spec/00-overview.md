# Kurikulum SDK — Specifikace v1

Opinionated SDK na tvorbu e-learningových kurzů v JSX (Preact). Autor kurzu píše JSX komponenty, SDK řeší SCORM balení, stav, skórování, navigaci.

## Architektura

- **@kurikulum/core** — Preact-first npm balíček (runtime, hooky, adaptery)
- **kurikulum-template** — degit-ready template repo s UI komponentami + Tailwind
- **Stack:** Bun workspace + Vite + Preact + Tailwind v4
- **Build target:** env/CLI flag (`scorm-1.2` | `standalone`), jeden target per build

## Klíčová rozhodnutí

- Preact-first, žádná framework-agnostic abstrakce
- UI komponenty jsou template (degit), ne spravovaná knihovna / registry
- Flat CourseState + CourseRuntime místo orchestrátor pattern
- Completion konfigurovatelná per-stránka (5 strategií + manuální trigger)
- V1: jen SCORM 1.2 + standalone, SCORM 2004 odložen
- Žádné CLI, žádné virtual modules
- A11y zahrnutá od začátku

## Implementační kroky — v1 (hotovo)

1. [Monorepo scaffold](./01-monorepo-scaffold.md)
2. [CourseState + CourseRuntime](./02-course-runtime.md)
3. [Completion strategie](./03-completion-strategies.md)
4. [Hooky](./04-hooks.md)
5. [CourseProvider context](./05-course-provider.md)
6. [Standalone adapter](./06-standalone-adapter.md)
7. [Template: Course, Page, Navigation](./07-template-layout.md)
8. [Template: Text, Image, Video](./08-template-content.md)
9. [Template: MCQ, MultiSelect, Assessment](./09-template-assessment.md)
10. [A11y](./10-a11y.md)
11. [Tailwind v4 theme](./11-tailwind-theme.md)
12. [Vite plugin + single-file build](./12-vite-plugin.md)
13. [SCORM 1.2 adapter](./13-scorm-adapter.md)
14. [SCORM manifest + ZIP](./14-scorm-packaging.md)
15. [E2E test](./15-e2e-test.md)

## Roadmap — v2

16. [Vážené skórování a partial credit](./16-weighted-scoring.md)
17. [Fill-in-the-blank komponenta](./17-fill-in-the-blank.md)
18. [Matching komponenta (přiřazování)](./18-matching.md)
19. [Ordering komponenta (řazení)](./19-ordering.md)
20. [Více nezávislých assessmentů per kurz](./20-multi-assessment.md)
21. [SCORM interaction logging](./21-scorm-interactions.md)
22. [Podmíněná navigace a branching](./22-conditional-navigation.md)
23. [Historie pokusů](./23-attempt-history.md)
24. [SCORM 2004 adapter](./24-scorm-2004.md)
25. [Verzování suspend_data](./25-suspend-data-versioning.md)

## Roadmap — v3

26. [Audio / narration](./26-audio.md)
27. [Drag & Drop interakce](./27-drag-and-drop.md)
28. [Resume dialog](./28-resume-dialog.md)
29. [Glossary / slovníček pojmů](./29-glossary.md)
30. [Learner notes / záložky](./30-learner-notes.md)
31. [Assessment timer / časový limit](./31-assessment-timer.md)
32. [xAPI adapter](./32-xapi-adapter.md)
33. [Fulltext search v obsahu](./33-fulltext-search.md)
