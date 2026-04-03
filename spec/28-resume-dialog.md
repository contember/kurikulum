# Krok 28: Resume dialog

## Cíl

UI dialog při opětovném otevření kurzu — learner si vybere zda pokračovat kde skončil, nebo začít znovu.

## Motivace

Core už persistuje stav přes suspend_data a lesson_location. Ale při restore se learner automaticky vrátí na poslední stránku bez možnosti volby. Standardní e-learning UX je nabídnout dialog.

## Změny

### Core: onRestore callback

```typescript
interface CourseProps {
  // ... stávající ...
  onRestore?: (state: CourseState) => 'resume' | 'restart'
}
```

Pokud `onRestore` není zadán, chování se nemění (automatický resume). Pokud je zadán, runtime čeká na odpověď.

### Core: useRestore hook

```typescript
interface RestoreContext {
  hasStoredState: boolean
  storedPage: string | null
  resume: () => void
  restart: () => void
}
```

Hook pro custom UI — template ho využije pro dialog.

### Template: ResumeDialog

Modální dialog zobrazený při detekci uloženého stavu:

- "Chcete pokračovat kde jste skončili?" (stránka X z Y)
- Tlačítka: Pokračovat / Začít znovu
- Lokalizovatelné texty

## Příklad

```tsx
<Course adapter={adapter}>
  <ResumeDialog />
  <Page id="p1">...</Page>
  <Page id="p2">...</Page>
</Course>
```

Nebo custom UI:

```tsx
function MyResumeDialog() {
  const { hasStoredState, storedPage, resume, restart } = useRestore()
  if (!hasStoredState) return null
  return (
    <dialog open>
      <p>Pokračovat na stránce {storedPage}?</p>
      <button onClick={resume}>Pokračovat</button>
      <button onClick={restart}>Od začátku</button>
    </dialog>
  )
}
```

## Akceptační kritéria

- Při detekci uloženého stavu se zobrazí dialog
- Learner může pokračovat nebo začít znovu
- Bez ResumeDialog komponenty se chování nemění (zpětná kompatibilita)
- useRestore hook pro custom implementaci
- Restart korektně resetuje stav (completion, assessment, navigace)
- Template ResumeDialog se styly
- Unit testy
