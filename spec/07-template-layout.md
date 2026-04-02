# Krok 7: Template — Course, Page, Navigation

## Cíl

Základní layout komponenty v template projektu. Řeší strukturu kurzu, stránkování a navigaci.

## Soubory (v template/src/components/)

- `Course.tsx`
- `Page.tsx`
- `Navigation.tsx`

## Course

Root wrapper — renderuje aktuální stránku podle `currentPage` z runtime.

```tsx
interface CourseProps {
  children: ComponentChildren  // Page komponenty
}

function Course({ children }: CourseProps) {
  const { currentPage } = useNavigation()
  // Renderuje jen dítě s matchujícím id
  // Ostatní stránky jsou skryté (ne unmountované? nebo unmountované?)
}
```

**Rozhodnutí:** Neaktivní stránky unmountovat (ne skrývat). Šetří paměť, jednodušší state management. Completion state je v runtime, ne v komponentě.

## Page

Wrapper pro jednu stránku. Řeší completion strategii.

```tsx
interface PageProps {
  id: string
  completion?: CompletionStrategy
  completionTimer?: number
  children: ComponentChildren
}
```

- Registruje se u runtime při mount
- Spustí completion strategii (mount/timer/scroll/manual/interactive)
- Poskytuje PageContext pro `usePage` hook

## Navigation

Navigační tlačítka + progress indikátor.

```tsx
function Navigation() {
  const { canGoNext, canGoPrev, next, prev, pageIndex, totalPages } = useNavigation()

  return (
    <nav role="navigation" aria-label="Navigace kurzu">
      <button disabled={!canGoPrev} onClick={prev}>Předchozí</button>
      <span>{pageIndex + 1} / {totalPages}</span>
      <button disabled={!canGoNext} onClick={next}>Další</button>
    </nav>
  )
}
```

## Příklad použití (course.tsx)

```tsx
export default function MyCourse() {
  return (
    <CourseProvider config={config}>
      <Course>
        <Page id="intro" completion="mount">
          <Text>Vítejte v kurzu...</Text>
        </Page>
        <Page id="quiz" completion="interactive">
          <MCQ id="q1" question="Co je 2+2?">
            <Option correct>4</Option>
            <Option>5</Option>
          </MCQ>
        </Page>
      </Course>
      <Navigation />
    </CourseProvider>
  )
}
```

## Akceptační kritéria

- Course renderuje jen aktuální stránku
- Page spouští správnou completion strategii
- Navigation tlačítka fungují + disabled stavy
- Progress indikátor ukazuje aktuální pozici
- ARIA atributy na navigaci
