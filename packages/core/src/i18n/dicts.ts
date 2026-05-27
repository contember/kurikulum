import type { Dict } from './types.ts'

/**
 * English fallback dictionary for the entire built-in chrome — aria-labels,
 * dialog titles, action button labels, status messages. Consumer dictionaries
 * override entries by key; missing keys fall through to this dict before
 * returning the raw key.
 */
export const coreDictEn: Dict = {
  // Generic actions
  'actions.submit': 'Submit',
  'actions.retry': 'Try again',
  // Assessment
  'assess.score': 'Score: {score}/{max}',
  'assess.passed': '✓ Passed!',
  'assess.failed': '✗ Not passed.',
  'assess.exhausted': 'No attempts remaining.',
  'assessment.aria': 'Assessment',
  // Audio
  'audio.player': 'Audio player',
  'audio.seek': 'Seek',
  'audio.volume': 'Volume',
  // Category sort
  'categorySort.dropHere': 'Drop here',
  'categorySort.items': 'Items to sort',
  // Course chrome
  'course.skipLink': 'Skip to content',
  // Flip card
  'flip.aria': 'Flip card',
  'flip.hint': 'Tap to flip',
  // Glossary
  'glossary.panel': 'Glossary',
  'glossary.search': 'Search glossary',
  'glossary.search.placeholder': 'Search terms…',
  'glossary.title': 'Glossary',
  'glossary.toggle.close': 'Close glossary',
  'glossary.toggle.open': 'Open glossary',
  // Matching
  'matching.click': 'Click to assign',
  'matching.drag': 'Drag the answer…',
  'matching.responses': 'Answers',
  // Navigation
  'nav.aria': 'Course navigation',
  'nav.next': 'Next',
  'nav.prev': 'Previous',
  // Notes
  'notes.panel': 'Notes',
  'notes.placeholder': 'Write your notes...',
  'notes.title': 'Notes',
  'notes.toggle.close': 'Close notes',
  'notes.toggle.open': 'Open notes',
  // Ordering
  'ordering.down': 'Move down',
  'ordering.up': 'Move up',
  // Resume dialog
  'resume.aria': 'Resume course',
  'resume.body': 'You have saved progress{location}. Continue where you left off, or start over?',
  'resume.body.location': ' (page {page})',
  'resume.continue': 'Resume',
  'resume.restart': 'Start over',
  'resume.title': 'Resume course?',
  // Search
  'search.hints.close': 'Esc to close',
  'search.hints.navigate': 'Navigate with arrow keys',
  'search.input': 'Search course content',
  'search.modal.aria': 'Search',
  'search.placeholder': 'Search course content…',
  'search.results': 'Search results',
  'search.results.found': '{count} results',
  'search.results.none': 'No results for "{query}"',
  'search.toggle': 'Search',
  'search.toggle.aria': 'Search course content (Ctrl+K)',
  // Tabs
  'tabs.aria': 'Tabs',
}

export const coreDictCs: Dict = {
  'actions.submit': 'Odeslat',
  'actions.retry': 'Zkusit znovu',
  'assess.score': 'Skóre: {score}/{max}',
  'assess.passed': '✓ Splněno!',
  'assess.failed': '✗ Nesplněno.',
  'assess.exhausted': 'Vyčerpány všechny pokusy.',
  'assessment.aria': 'Test',
  'audio.player': 'Přehrávač zvuku',
  'audio.seek': 'Přejít',
  'audio.volume': 'Hlasitost',
  'categorySort.dropHere': 'Přetáhněte sem',
  'categorySort.items': 'Položky k roztřídění',
  'course.skipLink': 'Přeskočit na obsah',
  'flip.aria': 'Otočit kartičku',
  'flip.hint': 'Klikněte pro otočení',
  'glossary.panel': 'Slovník',
  'glossary.search': 'Hledat ve slovníku',
  'glossary.search.placeholder': 'Hledat pojem…',
  'glossary.title': 'Slovníček',
  'glossary.toggle.close': 'Zavřít slovníček',
  'glossary.toggle.open': 'Otevřít slovníček',
  'matching.click': 'Klikněte pro přiřazení',
  'matching.drag': 'Přetáhněte odpověď…',
  'matching.responses': 'Odpovědi',
  'nav.aria': 'Navigace kurzu',
  'nav.next': 'Další',
  'nav.prev': 'Předchozí',
  'notes.panel': 'Poznámky',
  'notes.placeholder': 'Pište si poznámky...',
  'notes.title': 'Poznámky',
  'notes.toggle.close': 'Zavřít poznámky',
  'notes.toggle.open': 'Otevřít poznámky',
  'ordering.down': 'Posunout dolů',
  'ordering.up': 'Posunout nahoru',
  'resume.aria': 'Pokračovat v kurzu',
  'resume.body': 'Máte uložený postup{location}. Chcete pokračovat kde jste skončili, nebo začít od začátku?',
  'resume.body.location': ' (stránka {page})',
  'resume.continue': 'Pokračovat',
  'resume.restart': 'Začít znovu',
  'resume.title': 'Pokračovat v kurzu?',
  'search.hints.close': 'Esc pro zavření',
  'search.hints.navigate': 'Šipky pro navigaci',
  'search.input': 'Hledat v kurzu',
  'search.modal.aria': 'Vyhledávání',
  'search.placeholder': 'Hledat v kurzu…',
  'search.results': 'Výsledky hledání',
  'search.results.found': '{count} výsledků',
  'search.results.none': 'Nenalezeno: „{query}"',
  'search.toggle': 'Hledat',
  'search.toggle.aria': 'Hledat v kurzu (Ctrl+K)',
  'tabs.aria': 'Záložky',
}
