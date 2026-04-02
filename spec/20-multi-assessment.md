# Krok 20: Více nezávislých assessmentů per kurz

## Cíl

Kurz může obsahovat více assessmentů s nezávislým sledováním skóre. Celkový výsledek kurzu se počítá ze všech assessmentů.

## Motivace

Typický compliance kurz: "Modul 1 kvíz (20 %), Modul 2 kvíz (20 %), závěrečná zkouška (60 %)". Současný runtime má jen jeden globální `score/maxScore/passed` — poslední `submitScore()` přepíše předchozí.

## Změny v CourseState

```typescript
interface AssessmentResult {
  id: string
  score: number
  maxScore: number
  passed: boolean
  attempts: number
  weight: number       // váha v celkovém hodnocení
}

interface CourseState {
  // ... stávající pole ...

  // Nahradí stávající score/maxScore/passed/attempts
  assessments: Record<string, AssessmentResult>
}
```

### Zpětná kompatibilita

Stávající `state.score`, `state.maxScore`, `state.passed`, `state.attempts` zůstanou jako computed gettery — počítají se z `assessments`:

```typescript
get score(): number {
  return Object.values(assessments).reduce((sum, a) => sum + a.score * a.weight, 0)
    / Object.values(assessments).reduce((sum, a) => sum + a.weight, 0)
}
```

## Změny v CourseRuntime

```typescript
interface CourseRuntime {
  // Stávající — zachováno pro kompatibilitu (počítá z assessments)
  submitScore(score: number, max: number, threshold?: number): void

  // Nové
  submitAssessmentScore(assessmentId: string, score: number, max: number, threshold?: number): void
  getAssessmentResult(assessmentId: string): AssessmentResult | null
}
```

## Změny v Assessment.Root

Assessment.Root volá `runtime.submitAssessmentScore(id, ...)` místo `runtime.submitScore(...)`.

### Props

```tsx
<Assessment id="quiz-1" passThreshold={0.6} weight={0.2}>...</Assessment>
<Assessment id="quiz-2" passThreshold={0.6} weight={0.2}>...</Assessment>
<Assessment id="final-exam" passThreshold={0.7} weight={0.6}>...</Assessment>
```

- `weight` prop definuje váhu v celkovém hodnocení (default `1`)
- Celkový `passed` = všechny assessmenty splněny (nebo celkový vážený score >= globální threshold)

## Změny v SCORM adapteru

- `cmi.core.score.raw` = vážený celkový score
- `cmi.core.score.max` = maximální možný score
- `cmi.core.lesson_status` = odvozeno z celkového výsledku
- Per-assessment data v `cmi.suspend_data`

## Příklad

```tsx
const config: CourseConfig = {
  title: 'Compliance Training',
  pages: ['intro', 'module-1', 'quiz-1', 'module-2', 'quiz-2', 'exam', 'summary'],
}

// V kurzu:
<Page id="quiz-1" completion="interactive">
  <Assessment id="quiz-1" passThreshold={0.6} weight={0.2}>
    <MCQ id="q1" question="...">...</MCQ>
  </Assessment>
</Page>

<Page id="exam" completion="interactive">
  <Assessment id="final-exam" passThreshold={0.7} weight={0.6}>
    <MCQ id="q10" question="...">...</MCQ>
    <MCQ id="q11" question="...">...</MCQ>
  </Assessment>
</Page>
```

## Akceptační kritéria

- Více assessmentů v jednom kurzu nezávisle trackují score
- Celkový score je vážený průměr
- Celkový passed zohledňuje všechny assessmenty
- SCORM adapter reportuje celkový score
- Suspend/restore zachovává per-assessment výsledky
- `state.score`, `state.passed` zůstávají zpětně kompatibilní
- useAssessment hook vrací per-assessment data
- Unit testy
