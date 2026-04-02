import { render } from 'preact'
import { CourseProvider, createAdapter } from '@kurikulum/core'
import type { CourseConfig } from '@kurikulum/core'
import { Course } from './components/Course.tsx'
import { Page } from './components/Page.tsx'
import { Navigation } from './components/Navigation.tsx'
import { Text } from './components/Text.tsx'
import { Image } from './components/Image.tsx'
import { Assessment } from './components/Assessment.tsx'
import { MCQ } from './components/MCQ.tsx'
import { Option } from './components/Option.tsx'
import './styles.css'

const target = (import.meta.env.KURIKULUM_TARGET as string) || 'standalone'
const adapter = createAdapter(target === 'scorm-1.2' ? 'scorm-1.2' : 'standalone')

const config: CourseConfig = {
  title: 'Testovací kurz',
  pages: ['intro', 'reading', 'quiz', 'summary'],
}

function App() {
  return (
    <CourseProvider config={config} adapter={adapter}>
      <Course>
        <Page id="intro" completion="mount">
          <Text>Úvod</Text>
        </Page>
        <Page id="reading" completion="timer" completionTimer={3}>
          <Text>Obsah ke čtení</Text>
          <Image src="./test.png" alt="Test obrázek" />
        </Page>
        <Page id="quiz" completion="interactive">
          <Assessment id="test-assessment" passThreshold={0.5}>
            <MCQ id="q1" question="Test otázka">
              <Option correct>Správně</Option>
              <Option>Špatně</Option>
            </MCQ>
          </Assessment>
        </Page>
        <Page id="summary" completion="manual">
          <Text>Shrnutí</Text>
        </Page>
      </Course>
      <Navigation />
    </CourseProvider>
  )
}

render(<App />, document.getElementById('app')!)
