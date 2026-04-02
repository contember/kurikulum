# Krok 9: Template — MCQ, MultiSelect, Assessment

## Cíl

Interaktivní assessment komponenty — otázky, odpovědi, skórování.

## Soubory (v template/src/components/)

- `Assessment.tsx`
- `MCQ.tsx`
- `MultiSelect.tsx`
- `Option.tsx`
- `QuestionFeedback.tsx`

## Assessment

Wrapper pro skórovaný blok. Sbírá výsledky z child otázek a submituje score.

```tsx
interface AssessmentProps {
  id: string
  passThreshold?: number   // 0-1, default z config
  maxAttempts?: number     // default: unlimited
  children: ComponentChildren
}
```

- Sbírá výsledky z MCQ/MultiSelect children
- Po submitu vypočítá score a volá `runtime.submitScore()`
- Řeší počet pokusů

## MCQ (Multiple Choice Question)

Single-choice otázka.

```tsx
interface MCQProps {
  id: string
  question: string
  children: ComponentChildren  // Option komponenty
}
```

- Radio button group
- Po submitu markne svůj `id` jako complete (pro `interactive` strategii)
- Vrací `correct: boolean` pro Assessment parent

## MultiSelect

Multi-choice otázka.

```tsx
interface MultiSelectProps {
  id: string
  question: string
  children: ComponentChildren  // Option komponenty
}
```

- Checkbox group
- Správná odpověď = všechny `correct` zaškrtnuté a žádné nesprávné

## Option

Odpověď v MCQ nebo MultiSelect.

```tsx
interface OptionProps {
  correct?: boolean
  children: ComponentChildren
}
```

## QuestionFeedback

Zpětná vazba po submitu otázky.

```tsx
interface QuestionFeedbackProps {
  correct?: ComponentChildren
  incorrect?: ComponentChildren
}
```

## Příklad

```tsx
<Assessment id="final-quiz" passThreshold={0.8} maxAttempts={3}>
  <MCQ id="q1" question="Hlavní město ČR?">
    <Option correct>Praha</Option>
    <Option>Brno</Option>
    <Option>Ostrava</Option>
    <QuestionFeedback
      correct="Správně!"
      incorrect="Praha je hlavní město České republiky."
    />
  </MCQ>

  <MultiSelect id="q2" question="Vyberte programovací jazyky:">
    <Option correct>Python</Option>
    <Option correct>JavaScript</Option>
    <Option>HTML</Option>
    <Option>Photoshop</Option>
  </MultiSelect>
</Assessment>
```

## Akceptační kritéria

- MCQ umožní vybrat jednu odpověď
- MultiSelect umožní vybrat více odpovědí
- Submit vyhodnotí správnost
- Assessment spočítá celkový score
- QuestionFeedback se zobrazí po submitu
- Otázky marknou completion po submitu
- maxAttempts omezí počet pokusů
- Keyboard navigace (šipky v radio group, space pro checkbox)
