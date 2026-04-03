# Krok 22: Podmíněná navigace a branching

## Cíl

Umožnit adaptivní průchod kurzem — přeskočení stránek, podmíněné zobrazení, remediace.

## Motivace

Standardní e-learning patterny:
- "Pokud pre-test splněn → přeskočit teorii"
- "Pokud kvíz nesplněn → zobrazit remediální stránku"
- "Pokud splněno vše → zobrazit certifikát"

Současný model je striktně lineární (`pages[]` pole). Branching vyžaduje buď dynamické skládání pole, nebo deklarativní podmínky na stránkách.

## Návrh: deklarativní podmínky

### Přístup A: `when` prop na Page

```tsx
<Page id="remedial" completion="mount" when={() => !runtime.state.passed}>
  <Text>Musíte zopakovat materiál...</Text>
</Page>
```

- `when` je funkce vracející `boolean`
- Pokud vrací `false`, stránka se přeskočí v navigaci
- Stránka se neobjeví v progress (4/7 → 4/6)
- `when` se vyhodnocuje při každé navigaci

### Přístup B: `pages` jako funkce

```typescript
const config: CourseConfig = {
  title: '...',
  pages: (state) => {
    const base = ['intro', 'theory', 'quiz']
    if (!state.completions['quiz'] || state.passed === false) {
      base.push('remedial')
    }
    base.push('summary')
    return base
  },
}
```

### Doporučení: Přístup A

- Deklarativnější — podmínka je u stránky, ne v configu
- Snazší pro autora kurzu
- Nenarušuje stávající lineární model — stránky bez `when` se chovají jako dnes
- Kompatibilní se SCORM bookmarking (location je vždy validní page ID)

## Změny

### CourseRuntime

```typescript
// Nová metoda — vrací viditelné stránky (filtrované přes when)
getVisiblePages(): string[]
```

Navigace (`nextPage`, `prevPage`) přeskakuje stránky kde `when` vrací `false`.

### Page.Root

```typescript
interface PageRootProps {
  // ... stávající ...
  when?: (runtime: CourseRuntime) => boolean   // default: () => true
}
```

### Course.Root

Filtruje stránky přes `when` — neviditelné stránky se nerenderují (ani skrytě).

### useNavigation

`totalPages` a `pageIndex` se počítají z viditelných stránek.

### Navigation.Progress

Zobrazuje progress jen z viditelných stránek.

## Příklad

```tsx
<Course>
  <Page id="pre-test" completion="interactive">
    <Assessment id="pre-test" passThreshold={0.8}>...</Assessment>
  </Page>

  <Page id="theory" completion="timer" completionTimer={10}
        when={(rt) => !rt.isComplete('pre-test') || !rt.state.passed}>
    <Text>Teoretická část...</Text>
  </Page>

  <Page id="final-exam" completion="interactive">
    <Assessment id="final" passThreshold={0.7}>...</Assessment>
  </Page>

  <Page id="certificate" completion="mount"
        when={(rt) => rt.state.passed}>
    <Text>Gratulujeme!</Text>
  </Page>

  <Page id="retry-info" completion="manual"
        when={(rt) => rt.state.passed === false}>
    <Text>Bohužel jste nesplnili...</Text>
  </Page>
</Course>
```

## Akceptační kritéria

- `when` prop na Page filtruje viditelnost
- Navigace přeskakuje neviditelné stránky
- Progress ukazuje jen viditelné stránky
- Podmínky se přehodnocují při každé state změně
- Stránky bez `when` se chovají beze změny
- Bookmark (SCORM location) zůstává validní
- Pokud aktuální stránka zmizí (when→false), navigace skočí na nejbližší viditelnou
- Unit testy pro branching scénáře
