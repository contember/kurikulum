# Pages

Each `<Page>` wraps content inside `<Course>`. Only the active page is visible.

## Props

- `id: string` — unique page ID (must be in `config.pages`)
- `completion: CompletionStrategy` — when page counts as complete (default `'mount'`)
- `completionTimer: number` — seconds for `timer` strategy
- `when: (runtime: CourseRuntime) => boolean` — conditional visibility

## Completion Strategies

- `mount` — page renders
- `timer` — N seconds elapse (`completionTimer={5}`)
- `scroll` — user scrolls to bottom
- `interactive` — all questions on page answered
- `manual` — code calls `markComplete()`

```tsx
<Page id="intro" completion="mount">...</Page>
<Page id="theory" completion="timer" completionTimer={10}>...</Page>
<Page id="long-text" completion="scroll">...</Page>
<Page id="quiz" completion="interactive">...</Page>
```

## Conditional Pages

```tsx
<Page
  id="bonus"
  completion="mount"
  when={(rt) => rt.state.assessments['quiz']?.passed === true}
>
  <BonusPage />
</Page>
```

Hidden pages are skipped in navigation.

## Creating a New Page

1. Create `src/pages/MyPage.tsx`:

```tsx
import type { VNode } from 'preact'
import { Text } from '../components/Text.tsx'

export function MyPage(): VNode {
  return (
    <Text>
      <h1>Page Title</h1>
      <p>Content here...</p>
    </Text>
  )
}
```

2. In `course.tsx`, import and add to `config.pages` + layout.

Navigation buttons are automatic — `<Navigation />` handles prev/next.
