# Assessment

Wraps questions into a scored quiz. Without `<Assessment>`, questions self-submit individually.

## Props

- `id: string` — unique assessment ID
- `passThreshold: number` — pass score 0-1 (default `0.7`)
- `maxAttempts: number` — limit retries (default unlimited)
- `timeLimit: number` — seconds for timed assessment

## Usage

```tsx
<Assessment id="quiz-1" passThreshold={0.6} maxAttempts={3}>
  <MCQ id="q1" question="..." weight={1}>
    <Option correct>Right answer</Option>
    <Option>Wrong answer</Option>
  </MCQ>

  <FillBlank id="q2" question="..." accept="answer" weight={2} />
</Assessment>
```

## How It Works

- Questions register evaluators with the assessment
- Single "Submit" evaluates all questions, calculates weighted score
- Displays score, pass/fail, retry button, attempt history
- Auto-submits on timer expiry if `timeLimit` set
- Timer state persists across suspend/restore
