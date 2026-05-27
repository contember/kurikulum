import type { CourseConfig } from 'kurikulum'
import { KurikulumApp } from 'kurikulum/auto'
import { render } from 'preact'
import { Page } from './components/Page.tsx'
import { DefaultLayout } from './layout.tsx'
import './styles.css'

const config: Omit<CourseConfig, 'title'> = {
  pages: ['intro', 'theory', 'interactive', 'media', 'standalone-quiz', 'advanced-quiz', 'assessment', 'bonus', 'scroll-page', 'summary'],
  version: '3',
  onMigrate(old, oldVersion) {
    return !oldVersion || oldVersion === '1' || oldVersion === '2' ? old : null
  },
}

function App() {
  return (
    <KurikulumApp config={config}>
      <DefaultLayout>
        <Page id="intro" completion="mount" />
        <Page id="theory" completion="timer" completionTimer={5} />
        <Page id="interactive" completion="interactive" />
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
