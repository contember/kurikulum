import type { Dict } from './types.ts'

/**
 * English fallback dictionary for core headless chrome (aria-labels, dialog
 * titles). Consumer dictionaries override entries by key; missing keys fall
 * through to this dict before returning the raw key.
 */
export const coreDictEn: Dict = {
  'nav.aria': 'Course navigation',
  'audio.player': 'Audio player',
  'audio.volume': 'Volume',
  'audio.seek': 'Seek',
  'glossary.panel': 'Glossary',
  'glossary.search': 'Search glossary',
  'notes.panel': 'Notes',
  'search.input': 'Search course content',
  'search.results': 'Search results',
  'assessment.aria': 'Assessment',
}

export const coreDictCs: Dict = {
  'nav.aria': 'Navigace kurzu',
  'audio.player': 'Přehrávač zvuku',
  'audio.volume': 'Hlasitost',
  'audio.seek': 'Přejít',
  'glossary.panel': 'Slovník',
  'glossary.search': 'Hledat ve slovníku',
  'notes.panel': 'Poznámky',
  'search.input': 'Hledat v kurzu',
  'search.results': 'Výsledky hledání',
  'assessment.aria': 'Test',
}
