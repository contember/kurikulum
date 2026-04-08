import type { VNode } from 'preact'
import { Text } from '../components/Text.tsx'

export function ScrollPage(): VNode {
  return (
    <Text>
      <h1>Další doporučení</h1>
      <h2>Content Security Policy (CSP)</h2>
      <p>
        CSP je HTTP hlavička, která omezuje, odkud může prohlížeč načítat skripty, styly a další zdroje. Správně nastavená CSP výrazně snižuje riziko
        XSS.
      </p>
      <h2>HTTPS a HSTS</h2>
      <p>
        Vždy používejte HTTPS. Hlavička <code>Strict-Transport-Security</code>
        zajistí, že prohlížeč bude komunikovat výhradně přes šifrované spojení.
      </p>
      <h2>Bezpečné hlavičky</h2>
      <p>Doporučené HTTP hlavičky pro zvýšení bezpečnosti:</p>
      <ul>
        <li>
          <code>X-Content-Type-Options: nosniff</code>
        </li>
        <li>
          <code>X-Frame-Options: DENY</code>
        </li>
        <li>
          <code>Referrer-Policy: strict-origin-when-cross-origin</code>
        </li>
        <li>
          <code>Permissions-Policy</code> – omezení přístupu k API prohlížeče
        </li>
      </ul>
      <h2>Závěr</h2>
      <p>
        Bezpečnost webových aplikací není jednorázový úkol, ale průběžný proces. Pravidelně aktualizujte závislosti, provádějte audity a vzdělávejte
        svůj tým.
      </p>
      <p>
        <em>Doscrollujte dolů pro dokončení této sekce.</em>
      </p>
    </Text>
  )
}
