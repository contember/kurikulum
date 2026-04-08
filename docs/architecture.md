# Architecture

Headless core + styled template (Radix + shadcn/ui pattern).

## Two Layers

**`@kurikulum/core`** (npm package, don't edit):

- Compound components (Assessment, MCQ, MultiSelect, FillBlank, Matching, Ordering, CategorySort, Page, Navigation, Course, Audio, Glossary, Notes, Search)
- Hooks (`use*` — see `docs/hooks.md`)
- Adapters (standalone, scorm-1.2, scorm-2004, xapi)
- Runtime (CourseRuntime, CourseProvider)

**`src/`** (your project, freely edit):

- `components/` — styled wrappers over core
- `pages/` — course content
- `course.tsx` — entry point
- `styles.css` — theme tokens

## Compound Component Pattern

Core uses `Component.Root` / `Component.Sub` with context. Template wraps into simpler components:

```tsx
// Core (headless)
<MCQ.Root id="q1" weight={1} aria-label="...">
  <MCQ.Label>...</MCQ.Label>
  <MCQ.Item correct><MCQ.Control /><MCQ.ItemLabel>...</MCQ.ItemLabel></MCQ.Item>
  <MCQ.Submit>Submit</MCQ.Submit>
</MCQ.Root>

// Template (styled) — simplified API
<MCQ id="q1" question="...">
  <Option correct>Answer</Option>
</MCQ>
```

## Runtime Lifecycle

1. `course.tsx` creates adapter via `createAdapter(type)`
2. `CourseProvider` creates `CourseRuntime` from config + adapter
3. On mount: `runtime.restore()` loads state from adapter
4. State changes trigger debounced `adapter.setSuspendData()` commits
5. On `beforeunload`: `runtime.suspend()` persists final state
