# Interactive Content (non-quiz)

Engagement elements that break up long-form reading without being scored
questions. Use them to make a page feel interactive instead of a flat wall of
text. For scored questions see `docs/questions.md`; for media see `docs/media.md`.

All three are template wrappers in `src/components/` — import them with a
relative path from inside a page body (`'../../../components/<Name>.tsx'`).

---

## FlipCard (tap to reveal)

A click-to-flip card: the learner sees the `front`, taps it, and the `back` is
revealed. Good for term → definition drilling, "guess then check", and
microlearning.

```tsx
import { FlipCard } from '../../../components/FlipCard.tsx'

<FlipCard
  front={
    <p>
      <strong>XSS</strong> — what does it stand for?
    </p>
  }
  back={<p>Cross-Site Scripting — injecting a malicious script into a page.</p>}
/>
```

Props: `front`, `back` (both `ComponentChildren`), `id?`, `completeOnFlip?`.

By default it is pure engagement and does not affect page completion. On a page
with `completion="interactive"`, set `completeOnFlip` (and a stable `id`) to
require the learner to flip it before Next unlocks — flipping every such card on
the page completes it, exactly like answering every question:

```tsx
<FlipCard id="flip-xss" completeOnFlip front={…} back={…} />
<FlipCard id="flip-csrf" completeOnFlip front={…} back={…} />
```

---

## Accordion (expandable sections)

Stacked, collapsible sections built on native `<details>`/`<summary>` — keyboard
and screen-reader accessible out of the box. Good for FAQs and optional
"read more" detail.

```tsx
import { Accordion, AccordionItem } from '../../../components/Accordion.tsx'

<Accordion>
  <AccordionItem title="Is HTTPS enough?">
    HTTPS encrypts transport but does not stop XSS, SQL injection, or CSRF.
  </AccordionItem>
  <AccordionItem title="Most common vulnerability?" open>
    OWASP Top 10 is led by Broken Access Control.
  </AccordionItem>
</Accordion>
```

`AccordionItem` props: `title` (string), `open?` (start expanded), `children`.
Pure presentation — does not participate in completion.

---

## Tabs (switchable panels)

Tabbed content; the first tab is active by default, clicking a tab swaps the
visible panel.

```tsx
import { Tabs, Tab } from '../../../components/Tabs.tsx'

<Tabs>
  <Tab label="XSS"><p>Escape output, set a Content Security Policy.</p></Tab>
  <Tab label="SQL Injection"><p>Use parameterized queries.</p></Tab>
  <Tab label="CSRF"><p>Require a CSRF token; set SameSite cookies.</p></Tab>
</Tabs>
```

`Tab` props: `label` (string), `children`. `<Tabs>` reads the labels and panels
from its `<Tab>` children. Pure presentation — does not participate in completion.

---

## Completion notes

- A page with `completion="interactive"` completes when every registered
  interactive element on it reports complete — questions, audio with
  `completeOnEnd`, and `FlipCard` with `completeOnFlip`.
- A page that only has `Accordion`/`Tabs`/`FlipCard` (without `completeOnFlip`)
  has no registered completables, so don't use `completion="interactive"` for it
  — use `mount`, `scroll`, or `timer` instead.

See the `interactive` page in `src/content/cs/` for a worked example.
