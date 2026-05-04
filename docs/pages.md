# Pages

Each `<Page>` wraps content inside `<Course>`. Only the active page is visible. The body is auto-resolved from the active locale's content bundle (see `docs/i18n.md`), so the JSX in `course.tsx` just declares structure — id, completion, conditional visibility.

## Props

- `id: string` — unique page ID (must be in `config.pages` and a key of `bundles[locale].pages`)
- `completion: CompletionStrategy` — when the page counts as complete (default `'mount'`)
- `completionTimer: number` — seconds for `timer` strategy
- `when: (runtime: CourseRuntime) => boolean` — conditional visibility (hidden pages are skipped in navigation)
- `children` — optional override; if present, rendered instead of the auto-resolved body

## Completion Strategies

- `mount` — page renders
- `timer` — N seconds elapse (`completionTimer={5}`)
- `scroll` — user scrolls to bottom
- `interactive` — all interactive elements (questions, audio with `completeOnEnd`, etc.) on the page complete
- `manual` — code calls `markComplete()`

```tsx
<Page id="intro" completion="mount" />
<Page id="theory" completion="timer" completionTimer={10} />
<Page id="long-text" completion="scroll" />
<Page id="quiz" completion="interactive" />
```

## Conditional Pages

```tsx
<Page
  id="bonus"
  completion="mount"
  when={(rt) => rt.state.assessments['quiz']?.passed === true}
/>
```

Hidden pages are skipped in navigation.

## Creating a New Page

For each locale you support:

1. Create the body component, e.g. `src/content/cs/pages/MyPage.tsx`:

```tsx
import type { VNode } from 'preact'
import { Text } from '../../../components/Text.tsx'

export function MyPage(): VNode {
  return (
    <Text>
      <h1>Page Title</h1>
      <p>Content here…</p>
    </Text>
  )
}
```

2. Register it in the locale's `index.ts`:

```ts
// src/content/cs/index.ts
import { MyPage } from './pages/MyPage.tsx'

export const pages = {
  // … existing entries
  'my-page': MyPage,
}
```

3. Add the ID to `config.pages` in `src/course.tsx` and place a `<Page>` declaration:

```tsx
const config = {
  pages: ['intro', 'my-page', 'quiz'],
  …
}

<Page id="my-page" completion="mount" />
```

The page ID must match in three places: the `pages` array in `config`, the key in `bundles[locale].pages`, and the `id` prop on `<Page>`. Translating? Repeat step 1+2 for each locale; step 3 is shared.

Navigation buttons are automatic — `<Navigation />` (mounted by `<DefaultLayout>`'s footer) handles prev/next.

## Override the auto-resolved body

You can still pass children to a `<Page>` for one-off custom layouts that don't fit the per-locale pattern:

```tsx
<Page id="custom" completion="mount">
  <MyOneOffComponent />
</Page>
```

In this case the active bundle's `pages.custom` (if any) is ignored.
