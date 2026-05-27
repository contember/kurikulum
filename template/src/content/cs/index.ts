import { AdvancedQuizPage } from './pages/AdvancedQuizPage.tsx'
import { AssessmentPage } from './pages/AssessmentPage.tsx'
import { BonusPage } from './pages/BonusPage.tsx'
import { InteractivePage } from './pages/InteractivePage.tsx'
import { IntroPage } from './pages/IntroPage.tsx'
import { MediaPage } from './pages/MediaPage.tsx'
import { QuickQuizPage } from './pages/QuickQuizPage.tsx'
import { ScrollPage } from './pages/ScrollPage.tsx'
import { SummaryPage } from './pages/SummaryPage.tsx'
import { TheoryPage } from './pages/TheoryPage.tsx'

export const title = 'Základy webové bezpečnosti'

export const glossary = [
  { term: 'XSS', definition: 'Cross-Site Scripting — útok vložením škodlivého skriptu do webové stránky.' },
  { term: 'SQL Injection', definition: 'Útok vložením SQL kódu do vstupního pole aplikace za účelem manipulace s databází.' },
  { term: 'CSRF', definition: 'Cross-Site Request Forgery — útok zneužívající autentizovanou session oběti k provedení nechtěné akce.' },
  { term: 'CSP', definition: 'Content Security Policy — HTTP hlavička omezující zdroje, ze kterých může prohlížeč načítat obsah.' },
  { term: 'OWASP', definition: 'Open Web Application Security Project — nezisková organizace zaměřená na bezpečnost webových aplikací.' },
]

export const pages = {
  intro: IntroPage,
  theory: TheoryPage,
  interactive: InteractivePage,
  media: MediaPage,
  'standalone-quiz': QuickQuizPage,
  'advanced-quiz': AdvancedQuizPage,
  assessment: AssessmentPage,
  bonus: BonusPage,
  'scroll-page': ScrollPage,
  summary: SummaryPage,
}
