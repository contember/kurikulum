import { render } from 'preact'
import { CourseProvider, createAdapter, createXApiAdapter } from '@kurikulum/core'
import type { CourseConfig } from '@kurikulum/core'
import { Course } from './components/Course.tsx'
import { Page } from './components/Page.tsx'
import { Navigation } from './components/Navigation.tsx'
import { ResumeDialog } from './components/ResumeDialog.tsx'
import { Search, SearchButton, SearchModal } from './components/Search.tsx'
import { Glossary, GlossaryPanel, GlossaryToggle } from './components/Glossary.tsx'
import { Notes, NotesPanel, NotesToggle } from './components/Notes.tsx'
import { IntroPage } from './pages/IntroPage.tsx'
import { TheoryPage } from './pages/TheoryPage.tsx'
import { MediaPage } from './pages/MediaPage.tsx'
import { QuickQuizPage } from './pages/QuickQuizPage.tsx'
import { AdvancedQuizPage } from './pages/AdvancedQuizPage.tsx'
import { AssessmentPage } from './pages/AssessmentPage.tsx'
import { BonusPage } from './pages/BonusPage.tsx'
import { ScrollPage } from './pages/ScrollPage.tsx'
import { SummaryPage } from './pages/SummaryPage.tsx'
import searchIndex from 'virtual:search-index'
import './styles.css'

const target = (import.meta.env.KURIKULUM_TARGET as string) || 'standalone'

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
  title: 'Základy webové bezpečnosti',
  pages: ['intro', 'theory', 'media', 'standalone-quiz', 'advanced-quiz', 'assessment', 'bonus', 'scroll-page', 'summary'],
  version: '2',
  onMigrate(old, oldVersion) {
    if (!oldVersion || oldVersion === '1') {
      return old
    }
    return null
  },
}

const glossaryEntries = [
  { term: 'XSS', definition: 'Cross-Site Scripting — útok vložením škodlivého skriptu do webové stránky.' },
  { term: 'SQL Injection', definition: 'Útok vložením SQL kódu do vstupního pole aplikace za účelem manipulace s databází.' },
  { term: 'CSRF', definition: 'Cross-Site Request Forgery — útok zneužívající autentizovanou session oběti k provedení nechtěné akce.' },
  { term: 'CSP', definition: 'Content Security Policy — HTTP hlavička omezující zdroje, ze kterých může prohlížeč načítat obsah.' },
  { term: 'OWASP', definition: 'Open Web Application Security Project — nezisková organizace zaměřená na bezpečnost webových aplikací.' },
]

function App() {
  return (
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

          <Page id="intro" completion="mount">
            <IntroPage />
          </Page>
          <Page id="theory" completion="timer" completionTimer={5}>
            <TheoryPage />
          </Page>
          <Page id="media" completion="scroll">
            <MediaPage />
          </Page>
          <Page id="standalone-quiz" completion="interactive">
            <QuickQuizPage />
          </Page>
          <Page id="advanced-quiz" completion="interactive">
            <AdvancedQuizPage />
          </Page>
          <Page id="assessment" completion="interactive">
            <AssessmentPage />
          </Page>
          <Page id="bonus" completion="mount" when={(rt) => rt.state.assessments['quick-quiz']?.passed === true}>
            <BonusPage />
          </Page>
          <Page id="scroll-page" completion="scroll">
            <ScrollPage />
          </Page>
          <Page id="summary" completion="manual">
            <SummaryPage />
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
      </div>
      </Notes>
      </Glossary>
      </Search>
    </CourseProvider>
  )
}

render(<App />, document.getElementById('app')!)
