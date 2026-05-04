# Course Setup

Compose a course in `src/course.tsx`. The framework provides an opinionated `<KurikulumApp>` root that wires the LocaleProvider, CourseProvider, content bundle context, and a default adapter — so the entry file stays tiny.

## Minimal `course.tsx`

```tsx
import type { CourseConfig } from 'kurikulum'
import { KurikulumApp } from 'kurikulum/auto'
import { render } from 'preact'
import { Page } from './components/Page.tsx'
import { DefaultLayout } from './layout.tsx'
import './styles.css'

const config: Omit<CourseConfig, 'title'> = {
  pages: ['intro', 'theory', 'quiz'],
  version: '1',
}

function App() {
  return (
    <KurikulumApp config={config}>
      <DefaultLayout>
        <Page id="intro" completion="mount" />
        <Page id="theory" completion="timer" completionTimer={10} />
        <Page id="quiz" completion="interactive" />
      </DefaultLayout>
    </KurikulumApp>
  )
}

render(<App />, document.getElementById('app')!)
```

That's it. **Page bodies, course title, and glossary entries come from `src/content/<locale>/index.ts`.** See `docs/i18n.md` for the content layout convention.

## What `<KurikulumApp>` does for you

- **Adapter**: reads `import.meta.env.KURIKULUM_TARGET` (set by the kurikulum() Vite plugin) and creates the matching adapter (`standalone`, `scorm-1.2`, `scorm-2004`, `cmi5`, `xapi`). xAPI config is parsed from URL query params.
- **Initial locale**: URL `?lang=…` → `adapter.getLanguagePreference()` → `navigator.language` → `defaultLocale` from `virtual:kurikulum-content`.
- **`LocaleProvider`** with `coreDictCs` / `coreDictEn` chrome dictionaries.
- **`CourseProvider`** with the merged config (title is filled from the active bundle if you don't pass one).
- **Content bundle context**: components below — including `<Page>` — read `bundles[activeLocale]` automatically.
- **Locale-change handler**: persists to the adapter (`cmi.*_preference.language` or localStorage) and pushes `?lang=` to the URL via `history.replaceState`.

## Page declarations

Each `<Page>` declares its **structural** properties (id, completion strategy, conditional visibility). The body for the page comes from the active locale's content bundle — `<Page id="intro" />` with no children auto-renders `bundles[locale].pages.intro`.

```tsx
<Page id="intro" completion="mount" />
<Page id="theory" completion="timer" completionTimer={10} />
<Page id="long-text" completion="scroll" />
<Page id="quiz" completion="interactive" />
<Page
  id="bonus"
  completion="mount"
  when={(rt) => rt.state.assessments['quiz']?.passed === true}
/>
```

You can still pass children to override the auto-resolved body (e.g. for one-off custom layouts):

```tsx
<Page id="custom" completion="mount">
  <MyOneOffComponent />
</Page>
```

## Suspend Data Versioning

When changing course structure (adding/removing pages), bump `version` and handle migration:

```tsx
const config: Omit<CourseConfig, 'title'> = {
  pages: ['intro', 'new-page', 'quiz'],
  version: '2',
  onMigrate(old, oldVersion) {
    if (oldVersion === '1') return old // Compatible — keep state
    return null // Reset
  },
}
```

## Overriding `<KurikulumApp>` defaults

Every default is a prop you can override:

| Prop                                      | Default                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `adapter`                                 | `createDefaultAdapter()` (env-driven)                 |
| `dictionaries`                            | `{ cs: coreDictCs, en: coreDictEn }`                  |
| `bundles` / `available` / `defaultLocale` | `virtual:kurikulum-content`                           |
| `initialLocale`                           | `detectLocale({ available, defaultLocale, adapter })` |
| `onLocaleChange`                          | `(next) => persistLocaleChange(adapter, next)`        |
| `fallbackLocale`                          | `defaultLocale`                                       |
| `fallbackDictLocale`                      | `'en'`                                                |

Need full control? Use the manual variant from the main barrel and compose providers yourself:

```tsx
import { KurikulumApp } from 'kurikulum'                    // manual API
import { available, bundles, defaultLocale } from 'virtual:kurikulum-content'

<KurikulumApp
  config={config}
  dictionaries={myDictionaries}
  bundles={bundles}
  available={available}
  defaultLocale={defaultLocale}
>
  …
</KurikulumApp>
```

## Custom layout

`<DefaultLayout>` ships with the template (`src/layout.tsx`) and provides Search/Glossary/Notes panels, footer with Navigation, the resume dialog, and the dev locale switcher. Replace it with anything that mounts a `<Course>` and consumes the same context (see `template/src/layout.tsx` for a starting point).
