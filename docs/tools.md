# Tools: Glossary, Notes, Search

Optional learner tools. All wrap the layout as context providers in `course.tsx`.

## Setup

```tsx
import { Search, SearchButton, SearchModal } from './components/Search.tsx'
import { Glossary, GlossaryPanel, GlossaryToggle, GlossaryTerm } from './components/Glossary.tsx'
import { Notes, NotesPanel, NotesToggle } from './components/Notes.tsx'
import searchIndex from 'virtual:search-index'

<CourseProvider config={config} adapter={adapter}>
  <Search index={searchIndex}>
  <Glossary entries={glossaryEntries}>
  <Notes>
    <Course>
      <SearchModal />
      <GlossaryPanel />
      <NotesPanel />
      {/* pages */}
    </Course>
    <footer>
      <SearchButton />
      <GlossaryToggle />
      <NotesToggle />
      <Navigation />
    </footer>
  </Notes>
  </Glossary>
  </Search>
</CourseProvider>
```

## Glossary

```tsx
const glossaryEntries = [
  {
    term: 'XSS',
    definition: 'Cross-Site Scripting.',
    aliases: ['cross-site scripting'],
  },
  { term: 'CSRF', definition: 'Cross-Site Request Forgery.' },
]
```

- `<Glossary entries={[...]}>` — provider
- `<GlossaryPanel />` — side panel with search
- `<GlossaryToggle />` — open/close button
- `<GlossaryTerm term="XSS">` — inline tooltip in page content

## Notes

Global notepad persisted in suspend_data (max 5000 chars).

- `<Notes>` — provider
- `<NotesPanel />` — side panel with textarea
- `<NotesToggle />` — open/close button

## Search

Full-text search (build-time index via `searchIndexPlugin()` in vite config).

- `<Search index={searchIndex}>` — provider
- `<SearchModal />` — modal with results
- `<SearchButton />` — open button (`Ctrl+K` / `Cmd+K` shortcut)

Search is diacritics-insensitive, case-insensitive. Results limited to visited pages.
