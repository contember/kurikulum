import type { VNode } from 'preact'
import { Text } from '../components/Text.tsx'

export function BonusPage(): VNode {
  return (
    <Text>
      <h1>Bonusový materiál</h1>
      <p>
        Gratulujeme ke splnění rychlého kvízu! Tato stránka je viditelná pouze pro ty, kteří úspěšně prošli kvízem — to je ukázka{' '}
        <strong>podmíněné navigace</strong>.
      </p>
      <h2>OWASP Top 10 — 2021</h2>
      <ol>
        <li>A01 — Broken Access Control</li>
        <li>A02 — Cryptographic Failures</li>
        <li>A03 — Injection</li>
        <li>A04 — Insecure Design</li>
        <li>A05 — Security Misconfiguration</li>
      </ol>
      <p>
        Kompletní seznam najdete na oficiálních stránkách OWASP.
      </p>
    </Text>
  )
}
