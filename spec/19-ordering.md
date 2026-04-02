# Krok 19: Ordering komponenta (řazení)

## Cíl

Nový typ otázky — seřazení položek do správného pořadí.

## Motivace

Ordering je standardní SCORM interaction type (`cmi.interactions.N.type = "sequencing"`). Používá se pro: seřazení kroků procesu, chronologické řazení událostí, prioritizace.

## Headless core (`packages/core/src/components/ordering/`)

### Compound components

```
Ordering.Root     — wrapper, řídí stav pořadí
Ordering.Label    — legend s textem otázky
Ordering.Item     — jedna položka k seřazení
Ordering.Submit   — submit tlačítko (standalone mód)
Ordering.Feedback — zpětná vazba po submitu
```

### Ordering.Root props

```typescript
interface OrderingRootProps {
  id: string
  children: ComponentChildren
  class?: string
  'aria-label'?: string
}
```

### Ordering.Item props

```typescript
interface OrderingItemProps {
  /** Správná pozice (0-indexed). Pořadí children definuje počáteční (zamíchané) zobrazení. */
  order: number
  children: ComponentChildren
  class?: string
}
```

### Interakce

- Položky se zobrazí v zamíchaném pořadí
- Learner přesouvá položky nahoru/dolů tlačítky (Move Up / Move Down)
- Alternativně: drag-and-drop (volitelné, headless core poskytuje jen data, DnD řeší template)

### Evaluator

- Vrací `correctPositions / totalItems` (0–1) — partial credit
- Položka je na správné pozici pokud její `order` odpovídá aktuálnímu indexu

## Template wrapper

```tsx
interface OrderingProps {
  id: string
  question: string
  children: ComponentChildren  // Ordering.Item children
}
```

Template zobrazí items s Move Up/Down tlačítky. Volitelně drag-and-drop.

## Příklad

```tsx
<Ordering id="q-steps" question="Seřaďte kroky SQL injection útoku:">
  <Ordering.Item order={0}>Nalezení zranitelného inputu</Ordering.Item>
  <Ordering.Item order={1}>Vložení SQL payloadu</Ordering.Item>
  <Ordering.Item order={2}>Exfiltrace dat</Ordering.Item>
  <Ordering.Item order={3}>Zahlazení stop</Ordering.Item>
</Ordering>
```

## Akceptační kritéria

- Položky se zobrazí v zamíchaném pořadí
- Move Up/Down tlačítka přesouvají položky
- Partial credit scoring (počet správných pozic / celkem)
- Funguje standalone i v Assessment
- Registruje se pro interactive completion
- Reset při assessment retry (nové zamíchání)
- Keyboard navigace (šipky pro přesunutí s focus na položce)
- Disabled po submitu
- Data atributy na položkách: `data-correct` po submitu
- Unit testy
