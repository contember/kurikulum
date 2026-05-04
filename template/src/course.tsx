import { CourseProvider, createAdapter, createXApiAdapter } from 'kurikulum'
import type { CourseConfig } from 'kurikulum'
import type { ComponentType, VNode } from 'preact'
import { render } from 'preact'
import { available, bundles, defaultLocale } from 'virtual:kurikulum-content'
import searchIndex from 'virtual:search-index'
import { Course } from './components/Course.tsx'
import { Glossary, GlossaryPanel, GlossaryToggle } from './components/Glossary.tsx'
import { Navigation } from './components/Navigation.tsx'
import { Notes, NotesPanel, NotesToggle } from './components/Notes.tsx'
import { Page } from './components/Page.tsx'
import { ResumeDialog } from './components/ResumeDialog.tsx'
import { Search, SearchButton, SearchModal } from './components/Search.tsx'
import './styles.css'

const target = (import.meta.env.KURIKULUM_TARGET as string) || 'standalone'

function pickInitialLocale(): string {
  if (typeof window !== 'undefined') {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (fromUrl && available.includes(fromUrl)) return fromUrl
  }
  return available.includes(defaultLocale) ? defaultLocale : available[0] ?? ''
}

const locale = pickInitialLocale()
const bundle = bundles[locale]

if (!bundle) {
  throw new Error(`[kurikulum] no content bundle for locale '${locale}'. Available: [${available.join(', ')}]`)
}

const { title, glossary, pages } = bundle

function createAdapterFromTarget() {
  if (target === 'xapi') {
    const params = new URLSearchParams(window.location.search)
    return createXApiAdapter({
      endpoint: params.get('endpoint') || '',
      auth: params.get('auth') || '',
      actor: params.get('actor') ? JSON.parse(params.get('actor')!) : {},
      activityId: params.get('activityId') || window.location.href,
      registration: params.get('registration') || undefined,
    })
  }
  const adapterType = target === 'scorm-1.2' ? 'scorm-1.2' : target === 'scorm-2004' ? 'scorm-2004' : 'standalone'
  return createAdapter(adapterType)
}

const adapter = createAdapterFromTarget()

const config: CourseConfig = {
  title,
  pages: ['intro', 'theory', 'media', 'standalone-quiz', 'advanced-quiz', 'assessment', 'bonus', 'scroll-page', 'summary'],
  version: '2',
  onMigrate(old, oldVersion) {
    if (!oldVersion || oldVersion === '1') {
      return old
    }
    return null
  },
}

function Body({ id }: { id: string }): VNode | null {
  const C = pages[id] as ComponentType | undefined
  if (!C) {
    if (import.meta.env.DEV) {
      return <div class="bg-danger/20 text-danger p-4 rounded">⚠ no "{id}" page in locale "{locale}"</div>
    }
    return null
  }
  return <C />
}

function App() {
  return (
    <CourseProvider config={config} adapter={adapter}>
      <Search index={searchIndex[locale] ?? []}>
        <Glossary entries={glossary}>
          <Notes>
            <div class="h-screen flex flex-col bg-bg text-text font-sans">
              <Course>
                <SearchModal />
                <GlossaryPanel />
                <NotesPanel />

                <Page id="intro" completion="mount">
                  <Body id="intro" />
                </Page>
                <Page id="theory" completion="timer" completionTimer={5}>
                  <Body id="theory" />
                </Page>
                <Page id="media" completion="scroll">
                  <Body id="media" />
                </Page>
                <Page id="standalone-quiz" completion="interactive">
                  <Body id="standalone-quiz" />
                </Page>
                <Page id="advanced-quiz" completion="interactive">
                  <Body id="advanced-quiz" />
                </Page>
                <Page id="assessment" completion="interactive">
                  <Body id="assessment" />
                </Page>
                <Page id="bonus" completion="mount" when={(rt) => rt.state.assessments['quick-quiz']?.passed === true}>
                  <Body id="bonus" />
                </Page>
                <Page id="scroll-page" completion="scroll">
                  <Body id="scroll-page" />
                </Page>
                <Page id="summary" completion="mount" when={(rt) => rt.state.assessments['final-test']?.passed === true}>
                  <Body id="summary" />
                </Page>
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
            </div>
          </Notes>
        </Glossary>
      </Search>
    </CourseProvider>
  )
}

render(<App />, document.getElementById('app')!)
