# Krok 17: Fill-in-the-blank komponenta

## Cíl

Nový typ otázky — textový vstup s validací odpovědi.

## Motivace

MCQ a MultiSelect pokrývají jen výběrové otázky. Reálné kurzy potřebují i otázky s volnou odpovědí — vyplnění termínu, čísla, krátkého textu.

## Headless core (`packages/core/src/components/fill-blank/`)

### Compound components

```
FillBlank.Root     — fieldset wrapper, řídí stav
FillBlank.Label    — legend s textem otázky
FillBlank.Input    — textový input
FillBlank.Submit   — submit tlačítko (standalone mód)
FillBlank.Feedback — zpětná vazba po submitu
```

### FillBlank.Root props

```typescript
interface FillBlankRootProps {
  id: string
  accept: string | string[] | RegExp  // správné odpovědi
  caseSensitive?: boolean              // default: false
  children: ComponentChildren
  class?: string
  'aria-label'?: string
}
```

### Validace

- `accept: string` — exact match (s ohledem na `caseSensitive`)
- `accept: string[]` — odpověď musí odpovídat jednomu z řetězců
- `accept: RegExp` — odpověď musí matchnout regex
- Před porovnáním se trim whitespace

### Evaluator

Vrací `1` (match) nebo `0` (no match) — kompatibilní s weighted scoring (krok 16).

### Integrace

- Registruje se do Assessment (stejně jako MCQ/MultiSelect)
- Registruje se do CompletableRegistry přes `useCompletion(id)` (interactive strategie)
- Reset na nový pokus (assessment retry)

## Template wrapper (`template/src/components/FillBlank.tsx`)

```tsx
interface FillBlankProps {
  id: string
  question: string
  accept: string | string[] | RegExp
  caseSensitive?: boolean
  placeholder?: string
  children?: ComponentChildren
}
```

Styling: input s border, focus ring, disabled state po submitu. Data atributy `data-correct` pro barevnou indikaci.

## Příklad

```tsx
<FillBlank
  id="q-capital"
  question="Hlavní město Francie?"
  accept={["Paříž", "Paris"]}
  placeholder="Zadejte město..."
/>

<FillBlank
  id="q-year"
  question="V jakém roce byl založen HTTP protokol?"
  accept={/^1991$/}
/>
```

## Akceptační kritéria

- Textový input s otázkou
- Validace proti stringu, poli stringů, regexu
- Case-insensitive matching (default)
- Funguje standalone (vlastní submit) i v Assessment
- Registruje se pro interactive completion strategii
- Reset při assessment retry
- Keyboard: Enter submitne (standalone mód)
- Disabled po submitu
- Feedback s correct/incorrect stavem
- Unit testy
