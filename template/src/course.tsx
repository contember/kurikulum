import { render } from 'preact'
import { h } from 'preact'
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
  return h(CourseProvider, { config, adapter },
    h(Course, null,
      h(Page, { id: 'intro', completion: 'mount' },
        h(Text, null, 'Úvod'),
      ),
      h(Page, { id: 'reading', completion: 'timer', completionTimer: 3 },
        h(Text, null, 'Obsah ke čtení'),
        h(Image, { src: './test.png', alt: 'Test obrázek' }),
      ),
      h(Page, { id: 'quiz', completion: 'interactive' },
        h(Assessment, { id: 'test-assessment', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Test otázka' },
            h(Option, { correct: true }, 'Správně'),
            h(Option, null, 'Špatně'),
          ),
        ),
      ),
      h(Page, { id: 'summary', completion: 'manual' },
        h(Text, null, 'Shrnutí'),
      ),
    ),
    h(Navigation, null),
  )
}

render(h(App, null), document.getElementById('app')!)
