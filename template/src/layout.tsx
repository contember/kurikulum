import { useContentBundle, useLocale } from 'kurikulum'
import type { ComponentChildren, VNode } from 'preact'
import searchIndex from 'virtual:search-index'
import { Course } from './components/Course.tsx'
import { DevLocaleBar } from './components/DevLocaleBar.tsx'
import { Glossary, GlossaryPanel, GlossaryToggle } from './components/Glossary.tsx'
import { Navigation } from './components/Navigation.tsx'
import { Notes, NotesPanel, NotesToggle } from './components/Notes.tsx'
import { ResumeDialog } from './components/ResumeDialog.tsx'
import { Search, SearchButton, SearchModal } from './components/Search.tsx'

export interface DefaultLayoutProps {
  children?: ComponentChildren
}

/**
 * Opinionated chrome layout: full-height column with the page content
 * scrolling above a footer of Search/Glossary/Notes toggles and Navigation.
 * Glossary entries and the search index are pulled from the active locale's
 * content bundle / virtual:search-index.
 */
export function DefaultLayout({ children }: DefaultLayoutProps): VNode {
  const { locale } = useLocale()
  const bundle = useContentBundle()

  return (
    <Search index={searchIndex[locale] ?? []}>
      <Glossary entries={bundle?.glossary ?? []}>
        <Notes>
          <div class="h-screen flex flex-col bg-bg text-text font-sans">
            <Course>
              <SearchModal />
              <GlossaryPanel />
              <NotesPanel />
              {children}
            </Course>
            <footer class="flex items-center gap-4 p-4 border-t border-border bg-bg-surface">
              <SearchButton />
              <GlossaryToggle />
              <NotesToggle />
              <div class="ml-auto">
                <Navigation />
              </div>
            </footer>
            <ResumeDialog />
            <DevLocaleBar />
          </div>
        </Notes>
      </Glossary>
    </Search>
  )
}
