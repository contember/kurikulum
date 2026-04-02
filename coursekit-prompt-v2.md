# CourseKit SDK – Claude Code Prompt

## What you're building

CourseKit is an opinionated SDK for building e-learning courses as Preact component trees. The primary user is an AI agent (Claude Code) that authors courses by writing JSX. The SDK has two layers:

1. **Headless core** (`@coursekit/core`) – all runtime logic, state management, hooks. Zero UI. This is the real product.
2. **UI kit** (shadcn-style) – copy-paste Preact components that consume the headless hooks. Copied into the user's project, fully owned and customizable. Not a package dependency for the UI parts.

The course author writes JSX and never touches SCORM APIs, manifest files, or packaging logic.

## Example of what a finished course looks like

```tsx
// src/course.tsx
import {
  Course, Page, Text, Image, Video,
  Assessment, MCQ, MultiSelect, Matching, FillBlank,
  Option, Pair,
  Accordion, AccordionItem, Tabs, Tab, Reveal,
} from './components'  // local, copied from coursekit UI kit

export default function GDPRTraining() {
  return (
    <Course title="GDPR Fundamentals">

      <Page title="Welcome">
        <Text>Welcome to GDPR training. This course covers...</Text>
        <Video src="./assets/intro.mp4" completionThreshold={0.8} />
      </Page>

      <Page title="Key Principles">
        <Text>## The 7 Principles</Text>
        <Accordion>
          <AccordionItem title="Lawfulness">Processing must have a legal basis...</AccordionItem>
          <AccordionItem title="Purpose limitation">Data collected for specified purposes...</AccordionItem>
          <AccordionItem title="Data minimisation">Only collect what you need...</AccordionItem>
        </Accordion>
      </Page>

      <Page title="Data Subject Rights">
        <Tabs>
          <Tab title="Right to Access">Individuals can request...</Tab>
          <Tab title="Right to Erasure">Also known as the right to be forgotten...</Tab>
          <Tab title="Right to Portability">Data subjects can request their data...</Tab>
        </Tabs>
      </Page>

      <Assessment title="Final Assessment" passThreshold={80} randomize>
        <Page title="Quiz - Part 1">
          <MCQ question="What does GDPR stand for?" weight={1}>
            <Option correct>General Data Protection Regulation</Option>
            <Option>General Data Privacy Rules</Option>
            <Option>Global Data Protection Regulation</Option>
            <Option>General Data Processing Regulation</Option>
          </MCQ>

          <MultiSelect question="Which are GDPR principles? (select all)" weight={1}>
            <Option correct>Purpose limitation</Option>
            <Option correct>Data minimisation</Option>
            <Option>Data maximisation</Option>
            <Option correct>Storage limitation</Option>
          </MultiSelect>
        </Page>

        <Page title="Quiz - Part 2">
          <Matching question="Match the right to its description" weight={2}>
            <Pair left="Access" right="Request a copy of your data" />
            <Pair left="Erasure" right="Request deletion of your data" />
            <Pair left="Portability" right="Receive data in machine-readable format" />
          </Matching>

          <FillBlank weight={1}>
            The GDPR came into effect on <FillBlank.Blank answer="25 May 2018" accept={["May 25 2018", "25/5/2018"]} />.
          </FillBlank>
        </Page>
      </Assessment>

    </Course>
  )
}
```

Note: imports come from `./components` (local shadcn-style copies), not from a package. The components internally import hooks from `@coursekit/core`.

## Two-layer architecture

### Layer 1: Headless core (`@coursekit/core`)

This is an npm package dependency. It provides:

- **Runtime engine** – `RuntimeOrchestrator`, `CompletionTracker`, `AssessmentEngine`, `BookmarkManager`, `TimeTracker`
- **Preact hooks** – `useCourse`, `useCompletion`, `useAssessment`, `useNavigation`, `usePage`
- **Context providers** – `CourseProvider`, `AssessmentProvider`, `PageProvider`
- **Delivery adapter interface** + built-in adapters (SCORM 1.2, SCORM 2004, standalone)
- **Type definitions** – all TypeScript types for course structure, questions, scoring

The headless core knows nothing about UI. It manages state and exposes it via hooks. Any component library can consume it.

### Layer 2: UI kit (shadcn-style, local copies)

These are Preact components that live in the user's project under `src/components/`. They are scaffolded by `bunx coursekit add <component>` and are fully owned by the user. They import hooks from `@coursekit/core` and render UI with Tailwind.

The CLI works like shadcn:
```bash
bunx coursekit init          # scaffolds project + copies all default components
bunx coursekit add mcq       # copies just the MCQ component
bunx coursekit add accordion # copies just the Accordion component
bunx coursekit diff          # shows what changed vs upstream defaults
```

This means the AI agent can freely modify any component's markup, styling, or behavior. The headless hooks remain stable as a package dependency.

## Project structure

```
coursekit/
├── packages/
│   ├── core/                      # @coursekit/core – headless runtime (npm package)
│   │   ├── src/
│   │   │   ├── index.ts               # public API exports
│   │   │   ├── runtime/
│   │   │   │   ├── RuntimeOrchestrator.ts   # coordinates all managers, unified state
│   │   │   │   ├── CompletionTracker.ts     # per-component completion, tree aggregation
│   │   │   │   ├── AssessmentEngine.ts      # scoring, attempts, pass/fail, randomization
│   │   │   │   ├── BookmarkManager.ts       # current page persistence
│   │   │   │   └── TimeTracker.ts           # session time, total time
│   │   │   ├── context/
│   │   │   │   ├── CourseProvider.tsx        # root context provider
│   │   │   │   ├── PageProvider.tsx          # per-page context
│   │   │   │   └── AssessmentProvider.tsx    # per-assessment context
│   │   │   ├── hooks/
│   │   │   │   ├── useCourse.ts             # access course-level state
│   │   │   │   ├── useCompletion.ts         # register + report completion
│   │   │   │   ├── useAssessment.ts         # assessment state (score, attempts, pass/fail)
│   │   │   │   ├── useNavigation.ts         # go to page, next, prev, current page
│   │   │   │   ├── usePage.ts              # current page state (index, completion, title)
│   │   │   │   └── useQuestion.ts           # register answer, get feedback, correctness
│   │   │   ├── adapters/
│   │   │   │   ├── types.ts                 # DeliveryAdapter interface
│   │   │   │   ├── scorm12.ts               # SCORM 1.2 adapter
│   │   │   │   ├── scorm2004.ts             # SCORM 2004 4th Edition adapter
│   │   │   │   └── standalone.ts            # noop adapter, logs to console
│   │   │   └── types/
│   │   │       ├── course.ts                # CourseConfig, PageConfig, etc.
│   │   │       ├── assessment.ts            # QuestionType, Answer, Score, etc.
│   │   │       └── adapter.ts               # DeliveryAdapter, InteractionRecord
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── vite-plugin/                # @coursekit/vite-plugin – build + packaging
│   │   ├── src/
│   │   │   ├── index.ts                # plugin entry
│   │   │   ├── manifest.ts             # imsmanifest.xml generation
│   │   │   ├── packager.ts             # ZIP creation for SCORM
│   │   │   └── templates/
│   │   │       ├── scorm12.xml          # manifest template
│   │   │       └── scorm2004.xml
│   │   └── package.json
│   │
│   └── cli/                        # coursekit CLI (bunx coursekit)
│       ├── src/
│       │   ├── index.ts                # CLI entry
│       │   ├── commands/
│       │   │   ├── init.ts              # scaffold new project
│       │   │   ├── add.ts               # copy component to project
│       │   │   └── diff.ts              # diff local vs upstream
│       │   └── registry.ts             # component registry (what files each component needs)
│       ├── templates/
│       │   ├── project/                # full project scaffold
│       │   │   ├── src/
│       │   │   │   └── course.tsx           # starter course
│       │   │   ├── public/
│       │   │   │   └── assets/
│       │   │   ├── coursekit.config.ts
│       │   │   ├── vite.config.ts
│       │   │   └── package.json
│       │   └── components/             # UI component sources (shadcn-style)
│       │       ├── Course.tsx
│       │       ├── Page.tsx
│       │       ├── content/
│       │       │   ├── Text.tsx
│       │       │   ├── Image.tsx
│       │       │   ├── Video.tsx
│       │       │   ├── Embed.tsx
│       │       │   ├── Accordion.tsx
│       │       │   ├── Tabs.tsx
│       │       │   └── Reveal.tsx
│       │       ├── assessment/
│       │       │   ├── Assessment.tsx
│       │       │   ├── MCQ.tsx
│       │       │   ├── MultiSelect.tsx
│       │       │   ├── Matching.tsx
│       │       │   ├── Ordering.tsx
│       │       │   ├── FillBlank.tsx
│       │       │   ├── Option.tsx
│       │       │   └── Pair.tsx
│       │       ├── navigation/
│       │       │   ├── Navigation.tsx
│       │       │   ├── Menu.tsx
│       │       │   └── ProgressBar.tsx
│       │       ├── feedback/
│       │       │   ├── QuestionFeedback.tsx
│       │       │   └── AssessmentResult.tsx
│       │       └── index.ts            # barrel export
│       └── package.json
│
├── examples/
│   └── gdpr-course/                # example course project
│       ├── src/
│       │   ├── course.tsx
│       │   └── components/          # copied from CLI
│       ├── coursekit.config.ts
│       ├── vite.config.ts
│       └── package.json
│
├── bunfig.toml
├── package.json                    # workspace root
└── tsconfig.base.json
```

## Architecture decisions – follow these strictly

### Bun everywhere

- **Package manager**: Bun workspaces (not pnpm, not npm)
- **Test runner**: `bun test` (not vitest, not jest)
- **Script runner**: `bun run`
- **CLI execution**: `bunx coursekit init`
- **Workspace config**: `package.json` with `"workspaces"` field + `bunfig.toml`
- Build still uses Vite (Bun's bundler isn't mature enough for the plugin ecosystem we need)

### Headless-first

The `@coursekit/core` package has ZERO UI dependencies. No JSX in core (context providers use `createElement` directly or are thin wrappers). All state management is plain TypeScript classes + Preact signals or simple pub/sub. Hooks are the bridge between core logic and UI components.

The headless core must be testable without any DOM. All runtime classes (`CompletionTracker`, `AssessmentEngine`, etc.) are pure TypeScript with no browser dependencies. The adapters are the only part that touches browser APIs (`window.parent`, `beforeunload`).

### Preact with React alias

Use Preact with `preact/compat` aliased as `react`/`react-dom` in Vite config. The hooks in `@coursekit/core` import from `preact/hooks` directly. The UI components (shadcn-style copies) use JSX with Preact. The alias means any React-familiar code works.

### shadcn-style UI components

The UI components are NOT published as a package. They are template files that get copied into the user's project by the CLI. This means:

- User/agent owns the code completely
- Can modify markup, add Tailwind classes, change layout
- Can delete components they don't need
- Can add custom components that use the same headless hooks
- No version coupling between UI and core (only hooks API matters)

Each component file is self-contained. A component's dependencies are:
- `@coursekit/core` hooks (package import)
- Other local components (relative imports within `./components/`)
- Tailwind classes (no CSS files per component)

The CLI registry tracks which files each component needs:
```ts
// registry.ts
const components = {
  mcq: {
    files: ['assessment/MCQ.tsx', 'assessment/Option.tsx'],
    dependencies: ['@coursekit/core'],
  },
  accordion: {
    files: ['content/Accordion.tsx'],
    dependencies: [],
  },
  // ...
}
```

### Styling: Tailwind v4

- Components use Tailwind utility classes directly in JSX
- SDK ships a default theme preset that the user's `tailwind.config.ts` extends
- The theme uses CSS custom properties so colors/fonts/spacing can be swapped via a single config
- No `@apply` in component files – just utility classes in className
- The copied components look professional by default but every class is visible and editable
- Responsive – all components must work on mobile viewports

### Runtime engine (headless core internals)

```ts
// DeliveryAdapter interface – adapters implement this
interface DeliveryAdapter {
  initialize(): Promise<void>
  terminate(): Promise<void>
  setCompletionStatus(status: 'incomplete' | 'completed'): void
  setSuccessStatus(status: 'passed' | 'failed' | 'unknown'): void
  setScore(score: { raw: number; min: number; max: number; scaled: number }): void
  setLocation(bookmark: string): void
  getLocation(): string | null
  setSuspendData(data: string): void
  getSuspendData(): string | null
  setSessionTime(seconds: number): void
  recordInteraction(interaction: InteractionRecord): void
  commit(): Promise<void>
}

// RuntimeOrchestrator – holds all state, coordinates managers
class RuntimeOrchestrator {
  readonly completion: CompletionTracker
  readonly assessment: AssessmentEngine
  readonly bookmark: BookmarkManager
  readonly time: TimeTracker
  private adapter: DeliveryAdapter

  // called by hooks when state changes
  onStateChange(): void {
    // sync all state to adapter
    this.adapter.setCompletionStatus(this.completion.courseStatus)
    this.adapter.setScore(this.assessment.aggregateScore)
    this.adapter.setSuccessStatus(this.assessment.passStatus)
    this.adapter.setLocation(this.bookmark.currentPage)
    this.adapter.setSuspendData(JSON.stringify(this.serialize()))
    this.adapter.setSessionTime(this.time.sessionSeconds)
    this.adapter.commit()
  }

  // restore from suspend_data on resume
  hydrate(data: string): void { /* ... */ }
  serialize(): SerializedState { /* ... */ }
}
```

**CompletionTracker**: Tree structure mirroring the component tree. Each node has an id, a status (`incomplete` | `completed`), and children. Completion propagates up: a parent is complete when all children are complete. Exposes `register(id, parentId)`, `markComplete(id)`, `getStatus(id)`, `getCourseProgress()` (0-1 float).

**AssessmentEngine**: Manages question registrations, submitted answers, scoring. Each question has: `id`, `type`, `weight`, `correctAnswer`, `submittedAnswer`, `isCorrect`. Scoring: `sum(correct weights) / sum(all weights) * 100`. Supports multiple assessments per course (each `<Assessment>` creates its own engine instance via `AssessmentProvider`). Course-level score is the primary assessment's score (or weighted average if multiple).

**BookmarkManager**: Stores current page id. On resume, the `CourseProvider` reads this and navigates to the bookmarked page. Simple string storage.

**TimeTracker**: Starts on initialize, tracks `sessionTime` (current session) and `totalTime` (accumulated from suspend_data). Uses `performance.now()` for precision. Reports ISO 8601 duration format for SCORM.

### Hooks API (public surface of @coursekit/core)

```ts
// useCourse – top-level course state
function useCourse(): {
  title: string
  currentPage: number
  totalPages: number
  progress: number           // 0-1, completion ratio
  isComplete: boolean
  config: CourseConfig
}

// useNavigation – page navigation
function useNavigation(): {
  currentPage: number
  totalPages: number
  canGoNext: boolean          // false if current page incomplete + linear nav
  canGoPrev: boolean
  goNext(): void
  goPrev(): void
  goToPage(index: number): void
  isPageLocked(index: number): boolean
}

// useCompletion – register a completable component
function useCompletion(componentId: string): {
  isComplete: boolean
  markComplete(): void
}

// usePage – current page info
function usePage(): {
  title: string
  index: number
  isComplete: boolean
  isActive: boolean
}

// useAssessment – assessment state (inside <Assessment>)
function useAssessment(): {
  score: number               // 0-100
  isPassed: boolean
  isFailed: boolean
  isComplete: boolean         // all questions answered
  attemptsUsed: number
  attemptsRemaining: number | null  // null = unlimited
  canRetry: boolean
  retry(): void               // reset answers, increment attempt
}

// useQuestion – register and manage a question (inside <Assessment>)
function useQuestion(config: {
  id: string
  type: QuestionType
  weight: number
  correctAnswer: CorrectAnswer  // type depends on question type
}): {
  submit(answer: SubmittedAnswer): void
  isAnswered: boolean
  isCorrect: boolean | null     // null if not yet answered
  submittedAnswer: SubmittedAnswer | null
  feedback: string | null
  isLocked: boolean             // true after submit (single attempt per question)
}
```

### Completion tracking

Each completable component registers itself via `useCompletion()`:

Built-in completion conditions (implemented in the UI components, not in core):
- `Text`: complete on mount (intersection observer optional, up to UI component)
- `Video`: complete when `currentTime / duration >= completionThreshold`
- `Image`: complete on mount
- `Accordion`/`Tabs`/`Reveal`: complete when all items opened (UI component tracks this, calls `markComplete`)
- Questions (`MCQ` etc.): complete when answered (via `useQuestion.submit()`, core handles this)

Page completion = all registered children complete. Course completion depends on `completion.strategy` in config.

### Navigation

The `Course` UI component renders a shell layout. This is in the shadcn-style copy, so the agent can completely redesign it. Default layout:
- Left sidebar: page list with completion indicators
- Top: progress bar
- Center: current page content
- Bottom: prev/next buttons

Linear vs free navigation is a core concern (`useNavigation` enforces it). The UI just reads `canGoNext`, `isPageLocked` etc.

### Delivery configuration

```ts
// coursekit.config.ts
import { defineConfig } from '@coursekit/vite-plugin'

export default defineConfig({
  targets: ['scorm-1.2', 'standalone'],

  course: {
    identifier: 'gdpr-fundamentals-v1',
    title: 'GDPR Fundamentals',
    description: 'An introduction to GDPR compliance',
    version: '1.0.0',
  },

  completion: {
    strategy: 'allPagesAndAssessment',
    // 'allPages' | 'assessment' | 'allPagesAndAssessment'
  },

  navigation: 'linear',
  // 'linear' | 'free'
})
```

### Build outputs

`bun run build` produces:

```
dist/
├── scorm-1.2/
│   ├── package.zip           # ready to upload to LMS
│   └── unpacked/
│       ├── imsmanifest.xml
│       ├── index.html         # single file, all JS/CSS inlined
│       └── assets/            # media files (not inlined)
├── standalone/
│   ├── index.html
│   └── assets/
```

`bun run dev` starts Vite dev server with standalone adapter. No SCORM needed for development.

### Vite plugin responsibilities

The `@coursekit/vite-plugin`:
1. Aliases `react` → `preact/compat`, `react-dom` → `preact/compat`
2. Reads `coursekit.config.ts` and injects it as a virtual module (`virtual:coursekit-config`)
3. For each target, injects the correct adapter via virtual module (`virtual:coursekit-adapter`)
4. Runs `vite-plugin-singlefile` to inline JS/CSS into index.html
5. Post-build: generates `imsmanifest.xml` from config
6. Post-build: creates ZIP package for SCORM targets
7. Injects the SCORM API bootstrap in the HTML entry (API discovery script)
8. Multi-target: runs Vite build once per target with different adapter injection

### SCORM adapter specifics

SCORM adapters must:
- Find API object by walking `window.parent` / `window.opener` chain (max 10 levels)
- Call `LMSInitialize("")` (1.2) or `Initialize("")` (2004) on load
- Call `LMSFinish("")` (1.2) or `Terminate("")` (2004) on `beforeunload`
- Map runtime state → CMI:
  - `cmi.core.lesson_status` → 'incomplete' | 'completed' | 'passed' | 'failed' (1.2)
  - `cmi.completion_status` + `cmi.success_status` (2004, separate fields)
  - `cmi.core.score.raw` (1.2) / `cmi.score.raw` + `cmi.score.scaled` (2004)
  - `cmi.core.lesson_location` / `cmi.location` → bookmark (page id)
  - `cmi.suspend_data` → JSON serialized runtime state
  - `cmi.core.session_time` / `cmi.session_time` → ISO 8601 duration
  - `cmi.interactions.n.*` (2004 only) → individual question responses
- Auto-commit every 60s + on page change + on `beforeunload`
- Handle missing API gracefully (log warning, continue without tracking)

### What NOT to build

- No authoring tool / visual editor – Claude Code writes JSX
- No backend / server – everything client-side
- No user auth – LMS handles that
- No analytics – LMS handles that
- No custom question type system yet – stick with built-in set
- No multi-SCO – one course = one SCO
- No SCORM 2004 sequencing/navigation rules (SN) – handle in-app
- No xAPI adapter in v1 – stretch goal

## Implementation order

1. **Scaffold monorepo** – Bun workspace, tsconfig, package.jsons for core, vite-plugin, cli
2. **Runtime engine** – `RuntimeOrchestrator`, `CompletionTracker`, `AssessmentEngine`, `BookmarkManager`, `TimeTracker` as pure TS classes with `bun test` tests
3. **Hooks + context** – `CourseProvider`, `useCompletion`, `useNavigation`, `useQuestion`, `useAssessment` – test with Preact
4. **Standalone adapter** – noop/console adapter, enough to run courses in dev
5. **UI components: shell** – `Course.tsx`, `Page.tsx`, `Navigation.tsx`, `Menu.tsx`, `ProgressBar.tsx` – get page navigation working with Tailwind
6. **UI components: content** – `Text.tsx`, `Image.tsx`, `Video.tsx` with completion tracking
7. **UI components: interactive** – `Accordion.tsx`, `Tabs.tsx`, `Reveal.tsx` with completion tracking
8. **UI components: assessment** – `Assessment.tsx`, `MCQ.tsx`, `MultiSelect.tsx`, `Option.tsx` – scoring, pass/fail, feedback
9. **UI components: advanced assessment** – `Matching.tsx`, `Ordering.tsx`, `FillBlank.tsx`, randomization, attempts
10. **UI components: feedback** – `QuestionFeedback.tsx`, `AssessmentResult.tsx`
11. **Tailwind theme** – default color palette, typography, spacing, responsive breakpoints
12. **Vite plugin** – adapter injection, virtual modules, single-file build, multi-target
13. **SCORM 1.2 adapter** – API discovery, CMI mapping, suspend_data
14. **SCORM packaging** – manifest generation, ZIP creation
15. **CLI** – `init`, `add`, `diff` commands
16. **SCORM 2004 adapter** – CMI mapping differences, interactions tracking
17. **Example course** – full GDPR course demonstrating all components
18. **SCORM Cloud testing** – upload to SCORM Cloud, verify conformance

## Tech stack summary

- **Runtime**: TypeScript, zero dependencies, framework-agnostic classes
- **Hooks/Context**: Preact (`preact/hooks`, `preact/compat`)
- **UI components**: Preact JSX + Tailwind v4 (copied into user project)
- **Build**: Vite + custom plugin
- **Package manager / workspace / tests**: Bun
- **SCORM packaging**: archiver (ZIP), template literal XML (no xml2js needed for generation)
- **Markdown in Text**: marked (lightweight, no MDX complexity)
- **Monorepo**: Bun workspaces

## Important constraints

- `@coursekit/core` must have ZERO UI. No JSX, no DOM, no CSS. Pure TypeScript + Preact hooks.
- UI components are templates, not a published package. They live in the CLI's `templates/components/` directory and get copied to user projects.
- The `course.tsx` file + `coursekit.config.ts` are the ONLY files the course author needs to touch (plus assets and optionally component customization).
- Zero SCORM knowledge required to author a course.
- The SDK must produce valid SCORM 1.2 packages that pass SCORM Cloud conformance testing.
- Bundle size for a minimal course should be under 100KB gzipped (excluding media assets).
- All runtime state must be serializable to JSON (for suspend_data persistence).
- All runtime classes must be testable with `bun test` without a DOM environment.
- Every hook must have a clear, single-purpose API. No god-hooks.
