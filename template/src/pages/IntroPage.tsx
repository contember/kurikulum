import type { VNode } from 'preact'
import { Image } from '../components/Image.tsx'
import { Text } from '../components/Text.tsx'

export function IntroPage(): VNode {
  return (
    <>
      <Text>
        <h1>Základy webové bezpečnosti</h1>
        <p>
          Vítejte v kurzu zaměřeném na nejčastější bezpečnostní hrozby webových aplikací. Projdeme si základní koncepty podle{' '}
          <strong>OWASP Top 10</strong> a naučíte se, jak se proti nim bránit.
        </p>
        <p>
          Kurz obsahuje teoretické materiály, multimediální obsah, samostatné kvízy i hodnocený test. Pokračujte kliknutím na <em>Další</em>.
        </p>
      </Text>
      <Image
        src="https://placehold.co/800x300/1e3a5f/ffffff?text=Web+Security+101"
        alt="Ilustrace webové bezpečnosti"
        caption="Bezpečnost by měla být součástí každé fáze vývoje."
      />
    </>
  )
}
