# Krok 26: Audio / narration

## Cíl

Core komponenta pro přehrávání audia s integrací do completion strategií a SCORM session time.

## Motivace

Většina korporátních kurzů má voice-over ke stránkám. Autor dnes může použít HTML `<audio>`, ale chybí integrace s core — completion neví o audiu, žádný standardizovaný hook pro kontrolu přehrávání, žádný template player UI.

## Změny

### Core: Audio compound component

```
Audio.Root — wrapper, spravuje přehrávání
Audio.Play — play/pause toggle
Audio.Progress — progress bar / seek
Audio.Time — zobrazení aktuálního / celkového času
Audio.Volume — volume control
```

```typescript
interface AudioRootProps {
  src: string
  autoplay?: boolean       // default false
  completeOnEnd?: boolean  // default false — oznámí completion po dohrání
  class?: string
  children?: ComponentChildren
}
```

### Hook: useAudio()

```typescript
interface AudioContext {
  playing: boolean
  currentTime: number
  duration: number
  progress: number         // 0–1
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (time: number) => void
}
```

### Completion strategie: `audio`

Nová completion strategie — stránka je complete až po dohrání audia. Alternativně `completeOnEnd` prop na `Audio.Root` spolupracuje s `interactive` strategií.

### Template: AudioPlayer

Styled wrapper nad core Audio komponentami — play/pause tlačítko, progress bar, čas, volume.

## Příklad

```tsx
<Page id="intro" completion="interactive">
  <p>Vítejte v kurzu bezpečnosti práce.</p>
  <Audio src="./assets/intro-narration.mp3" completeOnEnd>
    <Audio.Play />
    <Audio.Progress />
    <Audio.Time />
  </Audio>
</Page>
```

## Akceptační kritéria

- Audio.Root přehrává soubor, compound sub-components ovládají přehrávání
- useAudio() hook poskytuje stav a kontroly
- completeOnEnd oznámí completion po dohrání
- Funguje s interactive completion strategií
- Keyboard accessible (Space = play/pause, šipky = seek)
- Template AudioPlayer komponenta se styly
- Unit testy
