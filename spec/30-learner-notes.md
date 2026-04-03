# Krok 30: Learner notes / záložky

## Cíl

Learner si může dělat poznámky ke stránkám kurzu, které se ukládají a přežijí restart.

## Motivace

Enterprise e-learning platformy často vyžadují možnost poznámek. Learner si označí důležité pasáže, zapíše si poznámky k pochopení. Data se ukládají do suspend_data.

## Změny

### Core: Notes provider

```typescript
interface Note {
  pageId: string
  text: string
  createdAt: number
}

interface NotesContext {
  notes: Note[]
  getNotesForPage: (pageId: string) => Note[]
  addNote: (pageId: string, text: string) => void
  removeNote: (pageId: string, index: number) => void
  updateNote: (pageId: string, index: number, text: string) => void
}
```

```
Notes.Root — provider, spravuje stav poznámek
Notes.Panel — panel se všemi poznámkami (filtr per stránka)
Notes.Editor — editor poznámky pro aktuální stránku
Notes.Indicator — badge/ikona indikující že stránka má poznámky
```

### Hook: useNotes

Přístup k notes contextu z libovolné komponenty.

### Persistence

Poznámky se serializují do suspend_data. SCORM 1.2 má limit 4096 bytů na suspend_data — poznámky musí být kompaktní. Strategie:

- Max délka jedné poznámky (např. 200 znaků)
- Max počet poznámek (např. 20)
- Při překročení limitu: warning, nejstarší poznámka se smaže

### Template

- Notes panel — postranní drawer se seznamem poznámek
- Inline editor na stránce
- Indikátor v navigaci (stránky s poznámkami)

## Příklad

```tsx
<Course adapter={adapter}>
  <Notes>
    <Navigation>
      <Navigation.Prev />
      <Navigation.Progress />
      <Notes.Indicator />
      <Navigation.Next />
    </Navigation>

    <Page id="safety">
      <p>Obsah stránky...</p>
      <Notes.Editor />
    </Page>

    <Notes.Panel />
  </Notes>
</Course>
```

## Akceptační kritéria

- Learner může přidat, upravit a smazat poznámky per stránka
- Poznámky přežijí suspend/restore
- Respektuje suspend_data size limit (graceful degradation)
- Notes.Indicator ukazuje které stránky mají poznámky
- useNotes hook pro custom UI
- Template styled komponenty
- Unit testy
