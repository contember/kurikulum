import { KurikulumApp } from 'kurikulum'
import type { CourseConfig } from 'kurikulum'
import { render } from 'preact'
import { available, bundles, defaultLocale } from 'virtual:kurikulum-content'
import { Page } from './components/Page.tsx'
import { dictionaries } from './i18n.ts'
import { DefaultLayout } from './layout.tsx'
import './styles.css'

const config: Omit<CourseConfig, 'title'> = {
  pages: ['intro', 'theory', 'media', 'standalone-quiz', 'advanced-quiz', 'assessment', 'bonus', 'scroll-page', 'summary'],
  version: '2',
  onMigrate(old, oldVersion) {
    return !oldVersion || oldVersion === '1' ? old : null
  },
}

function App() {
  return (
    <KurikulumApp config={config} dictionaries={dictionaries} bundles={bundles} available={available} defaultLocale={defaultLocale}>
      <DefaultLayout>
        <Page id="intro" completion="mount" />
        <Page id="theory" completion="timer" completionTimer={5} />
        <Page id="media" completion="scroll" />
        <Page id="standalone-quiz" completion="interactive" />
        <Page id="advanced-quiz" completion="interactive" />
        <Page id="assessment" completion="interactive" />
        <Page id="bonus" completion="mount" when={(rt) => rt.state.assessments['quick-quiz']?.passed === true} />
        <Page id="scroll-page" completion="scroll" />
        <Page id="summary" completion="mount" when={(rt) => rt.state.assessments['final-test']?.passed === true} />
      </DefaultLayout>
    </KurikulumApp>
  )
}

render(<App />, document.getElementById('app')!)
