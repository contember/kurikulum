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
 * Opinionated chrome layout. Mounts inside `<KurikulumApp>` and provides:
 *   - `<Search>` + `<SearchButton>` + `<SearchModal>` (Ctrl+K), seeded with
 *     the active locale's slice of `virtual:search-index`.
 *   - `<Glossary>` + `<GlossaryPanel>` + `<GlossaryToggle>`, seeded from the
 *     active content bundle's `glossary`.
 *   - `<Notes>` + `<NotesPanel>` + `<NotesToggle>`.
 *   - `<Course>` host with full-height scrolling content, the children you
 *     pass in (typically a list of `<Page>` declarations), then a footer
 *     with the search/glossary/notes toggles and `<Navigation>`.
 *   - `<ResumeDialog>` (sibling of `<Course>` so it isn't clipped by LMS
 *     iframe overflow).
 *   - `<DevLocaleBar>` floating switcher — visible only in `vite serve` +
 *     auto locale mode.
 *
 * Replace it with your own layout when you want a different chrome — start
 * by copying this file as a template and swap the wrapping components.
 *
 * @example
 *   <KurikulumApp config={config}>
 *     <DefaultLayout>
 *       <Page id="intro" completion="mount" />
 *       <Page id="quiz" completion="interactive" />
 *     </DefaultLayout>
 *   </KurikulumApp>
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
