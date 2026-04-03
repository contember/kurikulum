# Krok 33: Fulltext search v obsahu kurzu

## Cíl

Hledání napříč stránkami kurzu s navigací na nalezený obsah.

## Motivace

U delších kurzů (50+ stránek) je užitečné hledat v obsahu. Learner hledá konkrétní pojem nebo téma. Většina autorských nástrojů toto nemá — je to spíš LMS feature — ale pro agent-generované kurzy s rozsáhlým obsahem to dává smysl.

## Změny

### Build-time index

Vite plugin při buildu extrahuje textový obsah stránek a vytvoří search index:

```typescript
interface SearchEntry {
  pageId: string
  title: string
  content: string          // plain text (stripped JSX)
  keywords?: string[]      // volitelné klíčová slova
}
```

Index se vloží do bundlu jako JSON. Pro malé/střední kurzy stačí brute-force substring match — žádná potřeba full search engine.

### Core: Search provider

```
Search.Root — provider, drží index a stav hledání
Search.Input — search input
Search.Results — seznam výsledků
Search.Result — jednotlivý výsledek s navigací na stránku
```

### Hook: useSearch

```typescript
interface SearchContext {
  query: string
  setQuery: (q: string) => void
  results: Array<{
    pageId: string
    title: string
    snippet: string        // kontext kolem nalezeného textu
  }>
  isOpen: boolean
  open: () => void
  close: () => void
  navigateTo: (pageId: string) => void
}
```

### Template

- Search tlačítko v navigaci (ikona lupy)
- Search modal / dropdown s input a výsledky
- Snippet s highlightem hledaného textu
- Klik na výsledek naviguje na stránku

## Příklad

```tsx
<Course adapter={adapter}>
  <Search>
    <Navigation>
      <Navigation.Prev />
      <Navigation.Progress />
      <Search.Input />
      <Navigation.Next />
    </Navigation>

    <Page id="intro" title="Úvod">
      <p>Obsah stránky...</p>
    </Page>
  </Search>
</Course>
```

## Akceptační kritéria

- Vite plugin generuje search index při buildu
- Hledání vrací výsledky se snippetem
- Navigace na stránku z výsledku
- Case-insensitive, diakritika-insensitive hledání
- Keyboard accessible (Ctrl+K / Cmd+K otevře hledání)
- Template styled komponenty
- Unit testy
