# Course Setup

Configure and compose a course in `src/course.tsx`.

## Minimal course.tsx

```tsx
import { CourseProvider, createAdapter } from '@kurikulum/core'
import type { CourseConfig } from '@kurikulum/core'
import { render } from 'preact'
import { Course } from './components/Course.tsx'
import { Navigation } from './components/Navigation.tsx'
import { Page } from './components/Page.tsx'
import { MyIntro } from './pages/MyIntro.tsx'
import { MyQuiz } from './pages/MyQuiz.tsx'
import './styles.css'

const adapter = createAdapter('standalone')

const config: CourseConfig = {
  title: 'My Course',
  pages: ['intro', 'quiz'],
}

function App() {
  return (
    <CourseProvider config={config} adapter={adapter}>
      <div class="h-screen flex flex-col bg-bg text-text font-sans">
        <Course>
          <Page id="intro" completion="mount">
            <MyIntro />
          </Page>
          <Page id="quiz" completion="interactive">
            <MyQuiz />
          </Page>
        </Course>
        <footer class="flex items-center p-4 border-t border-border bg-bg-surface">
          <div class="ml-auto">
            <Navigation />
          </div>
        </footer>
      </div>
    </CourseProvider>
  )
}

render(<App />, document.getElementById('app')!)
```

## Full course.tsx (all features)

```tsx
<CourseProvider config={config} adapter={adapter}>
  <Search index={searchIndex}>
    <Glossary entries={glossaryEntries}>
      <Notes>
        <div class="h-screen flex flex-col bg-bg text-text font-sans">
          <Course>
            <ResumeDialog />
            <SearchModal />
            <GlossaryPanel />
            <NotesPanel />

            <Page id="intro" completion="mount">...</Page>
            <Page id="theory" completion="timer" completionTimer={5}>...</Page>
            <Page id="quiz" completion="interactive">...</Page>
          </Course>
          <footer class="flex items-center gap-4 p-4 border-t border-border bg-bg-surface">
            <SearchButton />
            <GlossaryToggle />
            <NotesToggle />
            <div class="ml-auto">
              <Navigation />
            </div>
          </footer>
        </div>
      </Notes>
    </Glossary>
  </Search>
</CourseProvider>
```

Provider nesting order: `CourseProvider > Search > Glossary > Notes > layout`

## Suspend Data Versioning

When changing course structure (adding/removing pages), bump `version` and handle migration:

```typescript
const config: CourseConfig = {
  title: 'My Course',
  pages: ['intro', 'new-page', 'quiz'],
  version: '2',
  onMigrate(old, oldVersion) {
    if (oldVersion === '1') return old // Compatible
    return null // Reset
  },
}
```
