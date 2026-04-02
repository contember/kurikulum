# Krok 23: Historie pokusů

## Cíl

Trackovat historii pokusů u assessmentů — skóre, čas, detail odpovědí per pokus.

## Motivace

Současný stav: `state.attempts` je counter, ale žádný log předchozích výsledků. Learner nevidí "Pokus 1: 60 %, Pokus 2: 85 %". LMS administrátor nemá data pro analýzu.

## Změny

### AssessmentResult rozšíření

```typescript
interface AttemptRecord {
  score: number
  maxScore: number
  passed: boolean
  timestamp: number        // Date.now()
  answers: Record<string, {
    response: string       // co learner odpověděl
    correct: boolean       // bylo to správně?
    score: number          // 0–1 (pro partial credit)
  }>
}

interface AssessmentResult {
  // ... stávající ...
  history: AttemptRecord[]
}
```

### Assessment.Root

Po submitu uloží aktuální pokus do `history`:

```typescript
const record: AttemptRecord = {
  score: correct,
  maxScore: total,
  passed: correct / total >= threshold,
  timestamp: Date.now(),
  answers: collectAnswers(), // z evaluatorů
}
state.assessments[id].history.push(record)
```

### Assessment.History compound component

Nový sub-component pro zobrazení historie:

```
Assessment.History — wrapper, renderuje historii pokusů
```

```typescript
interface HistoryProps {
  class?: string
  children?: (history: AttemptRecord[]) => ComponentChildren
}
```

Render function pattern — autor kurzu definuje jak zobrazit historii.

### suspend_data

Historie se serializuje do suspend_data. Pro úsporu místa: `answers` obsahuje jen ID a response, ne celý text otázky.

## Příklad

```tsx
<Assessment id="exam" passThreshold={0.7} maxAttempts={3}>
  <MCQ id="q1" question="...">...</MCQ>
  <MCQ id="q2" question="...">...</MCQ>

  <Assessment.History>
    {(history) => (
      <ul>
        {history.map((attempt, i) => (
          <li>Pokus {i + 1}: {Math.round(attempt.score / attempt.maxScore * 100)} %</li>
        ))}
      </ul>
    )}
  </Assessment.History>
</Assessment>
```

## Akceptační kritéria

- Každý pokus se uloží do historie
- Historie přežije suspend/restore
- Assessment.History component zobrazuje historii (render function)
- Bez Assessment.History se chování nemění
- Historie nenarušuje suspend_data size limit (kompaktní formát)
- Unit testy
