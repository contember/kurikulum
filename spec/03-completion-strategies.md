# Krok 3: Completion strategie

## Cíl

Implementovat konfigurovatelný completion systém s 5 vestavěnými strategiemi + možností manuálního triggeru.

## Soubory

- `packages/core/src/completion.ts`

## Strategie

```typescript
type CompletionStrategy =
  | "mount"        // complete okamžitě při renderování
  | "timer"        // complete po X sekundách
  | "scroll"       // complete po scrollu na konec stránky
  | "manual"       // complete jen přes explicitní trigger
  | "interactive"  // complete když všechny interaktivní prvky hotové
```

## API

### Na úrovni Page

```tsx
<Page id="intro" completion="mount">         {/* default */}
<Page id="reading" completion="timer" completionTimer={10}>
<Page id="long-text" completion="scroll">
<Page id="confirm" completion="manual">
<Page id="quiz" completion="interactive">
```

### Globální default

```typescript
// kurikulum.config.ts
export default {
  title: "Můj kurz",
  defaultCompletion: "mount",
}
```

### Manuální trigger

```tsx
function ConfirmButton() {
  const { markComplete } = useCompletion("intro-page")
  return <button onClick={markComplete}>Rozumím, pokračovat</button>
}

<Page id="intro-page" completion="manual">
  <Text>Důležitý úvodní text...</Text>
  <ConfirmButton />
</Page>
```

## Implementační detail

### mount
- `useEffect(() => markComplete(pageId), [])` v Page komponentě

### timer
- `useEffect` s `setTimeout(completionTimer * 1000)`
- Čistí timer při unmount

### scroll
- IntersectionObserver na sentinel element na konci stránky
- Threshold: 1.0 (celý sentinel viditelný)

### manual
- Page nic automaticky nedělá
- Autor volá `markComplete()` přes `useCompletion` hook

### interactive
- Page sleduje, zda všechny registrované completable ID na stránce jsou `true`
- Interaktivní komponenty (MCQ, MultiSelect) se registrují v completions registru
- Po submitu odpovědi marknou své ID jako complete
- Page je complete když `pageCompletables.every(id => completions[id])`

## Akceptační kritéria

- Každá strategie funguje izolovaně
- Globální default se aplikuje když Page nemá explicitní `completion` prop
- Per-page override přebíjí globální default
- Manuální trigger přes `useCompletion` hook funguje
- Interactive strategie čeká na všechny interaktivní prvky
