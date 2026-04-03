import type { VNode } from 'preact'
import { Text } from '../components/Text.tsx'
import { Image } from '../components/Image.tsx'

export function SummaryPage(): VNode {
  return (
    <>
      <Text>
        <h1>Shrnutí kurzu</h1>
        <p>V tomto kurzu jste se naučili:</p>
        <ul>
          <li>Rozpoznat a bránit se proti <strong>XSS</strong> útokům</li>
          <li>Chránit databázi před <strong>SQL injection</strong></li>
          <li>Implementovat ochranu proti <strong>CSRF</strong></li>
          <li>Nastavit bezpečnostní <strong>HTTP hlavičky</strong></li>
        </ul>
        <p>
          Děkujeme za absolvování kurzu! Pro další studium doporučujeme
          oficiální dokumentaci <strong>OWASP</strong>.
        </p>
      </Text>
      <Image
        src="https://placehold.co/800x200/1a1a2e/ffffff?text=Kurz+dokoncen"
        alt="Gratulace k dokončení kurzu"
      />
    </>
  )
}
