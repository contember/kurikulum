# Question Types

All questions work standalone (self-submit) or inside `<Assessment>` (batch submit, weighted scoring).

All support `<QuestionFeedback correct="..." incorrect="..." />` as a child.

---

## MCQ (single choice)

```tsx
import { MCQ } from './components/MCQ.tsx'
import { Option } from './components/Option.tsx'
import { QuestionFeedback } from './components/QuestionFeedback.tsx'

<MCQ id="q1" question="Which protocol is secure?">
  <Option>HTTP</Option>
  <Option correct>HTTPS</Option>
  <Option>FTP</Option>
  <QuestionFeedback correct="Correct!" incorrect="Try again." />
</MCQ>
```

---

## MultiSelect (multiple choice)

```tsx
import { MultiSelect } from './components/MultiSelect.tsx'

<MultiSelect id="q2" question="Select all secure practices:">
  <Option correct>Use HTTPS</Option>
  <Option correct>Validate input</Option>
  <Option>Store passwords in plaintext</Option>
</MultiSelect>
```

Partial credit: `max(0, (correctSelected - incorrectSelected) / totalCorrect)`.

---

## FillBlank (text input)

```tsx
import { FillBlank } from './components/FillBlank.tsx'

{/* String match (case-insensitive by default) */}
<FillBlank id="q3" question="Capital of France?" accept="Paris" />

{/* Multiple accepted answers */}
<FillBlank
  id="q4"
  question="HTTP security header?"
  accept={['Content-Security-Policy', 'CSP']}
/>

{/* Regex */}
<FillBlank id="q5" question="Year of HTTP/2?" accept={/^2015$/} />

{/* Case-sensitive */}
<FillBlank id="q6" question="JS keyword?" accept="const" caseSensitive />
```

Props: `accept` (string | string[] | RegExp), `caseSensitive` (bool), `placeholder` (string).

---

## Matching (pair prompts with responses)

```tsx
import { Matching, MatchingPair } from './components/Matching.tsx'

<Matching id="match-1" question="Match attack to defense:" weight={3}>
  <MatchingPair prompt="XSS" response="Content Security Policy" />
  <MatchingPair prompt="SQL Injection" response="Parameterized queries" />
  <MatchingPair prompt="CSRF" response="CSRF token" />
</Matching>
```

Responses are shuffled into dropdowns. Partial credit: `correctPairs / totalPairs`.

---

## Ordering (sequence items)

```tsx
import { Ordering, OrderingItem } from './components/Ordering.tsx'

<Ordering id="order-1" question="Sort from most to least common:">
  <OrderingItem order={1}>Broken Access Control</OrderingItem>
  <OrderingItem order={2}>Cryptographic Failures</OrderingItem>
  <OrderingItem order={3}>Injection</OrderingItem>
</Ordering>
```

Items auto-shuffle. Reorder via drag-and-drop or arrow buttons. `dragEnabled` prop (default `true`). Partial credit: `correctPositions / totalItems`.

---

## CategorySort (drag to buckets)

```tsx
import { CategorySort } from './components/CategorySort.tsx'

<CategorySort
  id="cat-1"
  question="Sort defenses by attack type:"
  weight={2}
  categories={[
    { id: 'xss', label: 'XSS' },
    { id: 'sqli', label: 'SQL Injection' },
  ]}
  items={[
    { id: 'csp', label: 'Content Security Policy', category: 'xss' },
    { id: 'param', label: 'Parameterized queries', category: 'sqli' },
  ]}
  partialCredit
/>
```

`partialCredit={false}` for all-or-nothing scoring.

---

## Common Props

All question types share: `id` (required), `question` (string), `weight` (number, default 1).
