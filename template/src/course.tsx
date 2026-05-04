import { CourseProvider, createAdapter, createXApiAdapter } from 'kurikulum'
import type { CourseConfig } from 'kurikulum'
import { render } from 'preact'
import searchIndex from 'virtual:search-index'
import { Course } from './components/Course.tsx'
import { Glossary, GlossaryPanel, GlossaryToggle } from './components/Glossary.tsx'
import { Navigation } from './components/Navigation.tsx'
import { Notes, NotesPanel, NotesToggle } from './components/Notes.tsx'
import { Page } from './components/Page.tsx'
import { ResumeDialog } from './components/ResumeDialog.tsx'
import { Search, SearchButton, SearchModal } from './components/Search.tsx'
import { glossary, title } from './content/cs/index.ts'
import { AdvancedQuizPage } from './content/cs/pages/AdvancedQuizPage.tsx'
import { AssessmentPage } from './content/cs/pages/AssessmentPage.tsx'
import { BonusPage } from './content/cs/pages/BonusPage.tsx'
import { IntroPage } from './content/cs/pages/IntroPage.tsx'
import { MediaPage } from './content/cs/pages/MediaPage.tsx'
import { QuickQuizPage } from './content/cs/pages/QuickQuizPage.tsx'
import { ScrollPage } from './content/cs/pages/ScrollPage.tsx'
import { SummaryPage } from './content/cs/pages/SummaryPage.tsx'
import { TheoryPage } from './content/cs/pages/TheoryPage.tsx'
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

function App() {
  return (
    <CourseProvider config={config} adapter={adapter}>
      <Search index={searchIndex}>
        <Glossary entries={glossary}>
          <Notes>
            <div class="h-screen flex flex-col bg-bg text-text font-sans">
              <Course>
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
                <Page id="summary" completion="mount" when={(rt) => rt.state.assessments['final-test']?.passed === true}>
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
              <ResumeDialog />
            </div>
          </Notes>
        </Glossary>
      </Search>
    </CourseProvider>
  )
}

render(<App />, document.getElementById('app')!)
