# Krok 18: Matching komponenta (přiřazování)

## Cíl

Nový typ otázky — přiřazení položek z levého sloupce k položkám v pravém sloupci.

## Motivace

Matching je standardní SCORM interaction type (`cmi.interactions.N.type = "matching"`). Běžné v compliance a certification kurzech: přiřaď pojem k definici, akci k výsledku apod.

## Headless core (`packages/core/src/components/matching/`)

### Compound components

```
Matching.Root      — wrapper, řídí stav párování
Matching.Label     — legend s textem otázky
Matching.Pair      — definice jednoho správného páru (prompt → response)
Matching.Prompt    — levý sloupec (zobrazí se vždy)
Matching.Response  — pravý sloupec (select / dropdown)
Matching.Submit    — submit tlačítko (standalone mód)
Matching.Feedback  — zpětná vazba po submitu
```

### Matching.Root props

```typescript
interface MatchingRootProps {
  id: string
  children: ComponentChildren
  class?: string
  'aria-label'?: string
}
```

### Matching.Pair props

```typescript
interface MatchingPairProps {
  prompt: string      // text v levém sloupci
  response: string    // správná odpověď v pravém sloupci
  children?: ComponentChildren
  class?: string
}
```

### Interakce

- Každý prompt má dropdown/select se všemi response hodnotami (zamíchanými)
- Learner vybírá response pro každý prompt
- Distraktory: pokud je víc responses než prompts, přebytečné slouží jako distraktory

### Evaluator

- Vrací `correctPairs / totalPairs` (0–1) — partial credit per default
- Kompatibilní s weighted scoring

## Template wrapper

```tsx
interface MatchingProps {
  id: string
  question: string
  children: ComponentChildren  // Matching.Pair children
}
```

## Příklad

```tsx
<Matching id="q-terms" question="Přiřaďte útoky k jejich popisu:">
  <Matching.Pair prompt="XSS" response="Vložení skriptu do stránky" />
  <Matching.Pair prompt="CSRF" response="Zneužití session oběti" />
  <Matching.Pair prompt="SQLi" response="Manipulace databázového dotazu" />
</Matching>
```

## Akceptační kritéria

- Prompt zobrazí text, response je select/dropdown
- Response hodnoty jsou zamíchané
- Partial credit scoring (počet správných párů / celkem)
- Funguje standalone i v Assessment
- Registruje se pro interactive completion
- Reset při assessment retry
- Keyboard navigace (Tab mezi selecty, šipky v selectu)
- Disabled po submitu
- Data atributy na párech: `data-correct` po submitu
- Unit testy
