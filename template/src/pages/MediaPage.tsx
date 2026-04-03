import type { VNode } from 'preact'
import { Text } from '../components/Text.tsx'
import { Image } from '../components/Image.tsx'
import { Video } from '../components/Video.tsx'
import { AudioPlayer } from '../components/AudioPlayer.tsx'

export function MediaPage(): VNode {
  return (
    <>
      <Text>
        <h1>Ukázky a multimédia</h1>
        <p>V této sekci si prohlédněte schémata útoků a obranných mechanismů.</p>
      </Text>
      <Image
        src="https://placehold.co/800x400/2d4a22/ffffff?text=SQL+Injection+Schema"
        alt="Schéma SQL injection útoku"
        caption="Obr. 1 – Průběh SQL injection útoku přes formulářové pole"
      />
      <AudioPlayer
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3"
      />
      <Text>
        <h2>Jak funguje XSS útok?</h2>
        <p>
          Na následujícím videu se můžete podívat na demonstraci reflected XSS útoku
          a jeho mitigaci pomocí Content Security Policy.
        </p>
      </Text>
      <Video
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm"
        caption="Ukázkové video – v reálném kurzu by zde byla demonstrace XSS"
      />
      <Image
        src="https://placehold.co/800x300/5c2d2d/ffffff?text=CSRF+Attack+Flow"
        alt="Diagram CSRF útoku"
        caption="Obr. 2 – Schéma CSRF útoku s ukázkou obranného CSRF tokenu"
      />
      <Text>
        <p><em>Doscrollujte na konec stránky pro dokončení této sekce.</em></p>
      </Text>
    </>
  )
}
