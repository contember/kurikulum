# Krok 29: Glossary / slovníček pojmů

## Cíl

Slovníček pojmů přístupný z libovolné stránky kurzu, s inline referencemi v textu.

## Motivace

Compliance a odborné kurzy mají téměř vždy slovníček. Learner potká neznámý pojem, klikne na něj a uvidí definici. Dnes to autor může řešit ručně (tooltip, modal), ale chybí standardizovaná komponenta.

## Změny

### Core: Glossary provider

```typescript
interface GlossaryEntry {
  term: string
  definition: string
  aliases?: string[]       // alternativní tvary ("BOZP", "bezpečnost a ochrana zdraví")
}

interface GlossaryProps {
  entries: GlossaryEntry[]
  children?: ComponentChildren
}
```

```
Glossary.Root — provider, drží data
Glossary.Panel — postranní panel / modal se seznamem pojmů
Glossary.Term — inline reference na pojem (tooltip / link)
Glossary.Search — vyhledávání v pojmech
```

### Hook: useGlossary

```typescript
interface GlossaryContext {
  entries: GlossaryEntry[]
  search: (query: string) => GlossaryEntry[]
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}
```

### Template

- Glossary panel — postranní drawer nebo modal, seznam pojmů s hledáním
- Glossary term — inline pojem s tooltip definicí a linkem do panelu
- Tlačítko pro otevření glossary v navigaci

## Příklad

```tsx
<Course adapter={adapter}>
  <Glossary entries={[
    { term: "BOZP", definition: "Bezpečnost a ochrana zdraví při práci", aliases: ["bezpečnost práce"] },
    { term: "OOP", definition: "Osobní ochranné prostředky" },
  ]}>
    <Navigation>
      <Navigation.Prev />
      <Navigation.Progress />
      <Navigation.Next />
      <Glossary.Panel />
    </Navigation>

    <Page id="intro">
      <p>Každý zaměstnanec musí znát pravidla <Glossary.Term term="BOZP" /> a používat <Glossary.Term term="OOP" />.</p>
    </Page>
  </Glossary>
</Course>
```

## Akceptační kritéria

- Glossary.Root přijímá pole pojmů
- Glossary.Panel zobrazuje seznam s hledáním
- Glossary.Term zobrazuje tooltip s definicí při hoveru/focusu
- useGlossary hook pro custom UI
- Aliases fungují (hledání najde pojem i přes alias)
- Keyboard accessible (Escape zavře panel, Tab naviguje pojmy)
- Template styled komponenty
- Unit testy
