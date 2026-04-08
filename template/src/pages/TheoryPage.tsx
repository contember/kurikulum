import type { VNode } from 'preact'
import { GlossaryTerm } from '../components/Glossary.tsx'
import { Text } from '../components/Text.tsx'

export function TheoryPage(): VNode {
  return (
    <Text>
      <h1>Nejčastější zranitelnosti</h1>
      <h2>
        1. Cross-Site Scripting (<GlossaryTerm term="XSS">XSS</GlossaryTerm>)
      </h2>
      <p>
        <GlossaryTerm term="XSS">XSS</GlossaryTerm>{' '}
        umožňuje útočníkovi vložit škodlivý skript do stránky, který se spustí v prohlížeči oběti. Rozlišujeme tři typy:
      </p>
      <ul>
        <li>
          <strong>Reflected XSS</strong> – skript je součástí URL a odrazí se ze serveru
        </li>
        <li>
          <strong>Stored XSS</strong> – skript je uložen v databázi (např. v komentáři)
        </li>
        <li>
          <strong>DOM-based XSS</strong> – manipulace probíhá čistě na straně klienta
        </li>
      </ul>
      <h2>
        2. <GlossaryTerm term="SQL Injection">SQL Injection</GlossaryTerm>
      </h2>
      <p>
        Útočník vloží SQL kód do vstupního pole, čímž může číst, měnit nebo mazat data v databázi. Obrana spočívá v použití{' '}
        <strong>parametrizovaných dotazů</strong>
        a ORM frameworků.
      </p>
      <h2>
        3. Cross-Site Request Forgery (<GlossaryTerm term="CSRF">CSRF</GlossaryTerm>)
      </h2>
      <p>
        <GlossaryTerm term="CSRF">CSRF</GlossaryTerm>{' '}
        využívá důvěru serveru v autentizovaného uživatele. Útočník vytvoří stránku, která odešle požadavek jménem přihlášeného uživatele. Obrana:
        {' '}
        <strong>CSRF tokeny</strong> a atribut <code>SameSite</code> u cookies.
      </p>
    </Text>
  )
}
