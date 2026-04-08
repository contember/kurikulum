# Media Components

## Text

Prose wrapper with Tailwind typography (`prose prose-lg`).

```tsx
import { Text } from './components/Text.tsx'

<Text>
  <h1>Title</h1>
  <p>Paragraph with <strong>bold</strong>.</p>
</Text>
```

## Image

```tsx
import { Image } from './components/Image.tsx'

<Image
  src="/images/diagram.png"
  alt="Architecture diagram"
  caption="System overview"
/>
```

Props: `src`, `alt` (required), `caption` (optional). Renders `<figure>` with `<figcaption>`.

## Video

```tsx
import { Video } from './components/Video.tsx'

<Video
  src="/videos/demo.mp4"
  poster="/images/poster.jpg"
  caption="Demo walkthrough"
/>
```

Props: `src` (required), `poster`, `caption`. Renders native `<video controls>`.

## AudioPlayer

```tsx
import { AudioPlayer } from './components/AudioPlayer.tsx'

<AudioPlayer src="/audio/narration.mp3" />

{/* Audio that counts as page completion */}
<AudioPlayer src="/audio/lecture.mp3" completeOnEnd id="lecture-audio" />
```

Props: `src` (required), `autoplay`, `completeOnEnd`, `id` (required if `completeOnEnd`).

Pass children to override default UI using `Audio.*` sub-components from core.
