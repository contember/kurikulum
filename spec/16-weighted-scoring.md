# Krok 16: Vážené skórování a partial credit

## Cíl

Assessment podporuje váhy otázek a MultiSelect uděluje částečné body za částečně správné odpovědi.

## Motivace

Reálné kurzy potřebují: "kvíz 20 %, zkouška 80 %" nebo "otázka za 3 body, otázka za 1 bod". Současný systém počítá každou otázku za 1 bod (correct/incorrect) bez možnosti diferenciace.

## Změny

### Assessment: weighted evaluators

Evaluator registrovaný child otázkou vrací `number` (0–1) místo `boolean`.

```typescript
// Současný stav
register(qId: string, evaluate: () => boolean): () => void

// Nový stav
register(qId: string, evaluate: () => number, weight?: number): () => void
```

Výpočet skóre:

```typescript
let totalWeight = 0
let weightedScore = 0

for (const [, { evaluate, weight }] of evaluators) {
  totalWeight += weight
  weightedScore += evaluate() * weight
}

const score = weightedScore / totalWeight  // 0–1
runtime.submitScore(weightedScore, totalWeight, passThreshold)
```

### MultiSelect: partial credit

Současně: buď všechny correct zaškrtnuté a žádné incorrect → 1, jinak 0.

Nový výpočet:

```typescript
// correctSelected = počet správně zaškrtnutých correct odpovědí
// incorrectSelected = počet zaškrtnutých incorrect odpovědí
// totalCorrect = celkový počet correct odpovědí
// score = max(0, (correctSelected - incorrectSelected) / totalCorrect)
```

### MCQ evaluator

MCQ vrací `1` (správně) nebo `0` (špatně) — beze změny chování, jen změna typu.

### Props

```tsx
<Assessment id="final" passThreshold={0.7}>
  <MCQ id="q1" question="..." weight={2}>...</MCQ>
  <MultiSelect id="q2" question="..." weight={3}>...</MultiSelect>
</Assessment>
```

- `weight` prop na MCQ/MultiSelect, default `1`
- Assessment.Status dostane `score` jako `number` (ne jen celé číslo)

## Soubory

- `packages/core/src/components/assessment/Root.tsx`
- `packages/core/src/components/assessment/context.ts`
- `packages/core/src/components/mcq/Root.tsx`
- `packages/core/src/components/multi-select/Root.tsx`

## Akceptační kritéria

- MCQ evaluator vrací `0 | 1`
- MultiSelect evaluator vrací `0–1` (partial credit)
- Assessment počítá vážený score
- `weight` prop na otázkách funguje (default 1)
- Assessment.Status zobrazuje skóre s desetinnými místy
- Zpětná kompatibilita: bez `weight` prop chování stejné jako dnes
- Unit testy na partial credit + weighted scoring
