import type { VNode } from 'preact'
import { Text } from '../components/Text.tsx'
import { Assessment } from '../components/Assessment.tsx'
import { FillBlank } from '../components/FillBlank.tsx'
import { QuestionFeedback } from '../components/QuestionFeedback.tsx'
import { Matching, MatchingPair } from '../components/Matching.tsx'
import { Ordering, OrderingItem } from '../components/Ordering.tsx'
import { CategorySort } from '../components/CategorySort.tsx'

export function AdvancedQuizPage(): VNode {
  return (
    <>
      <Text>
        <h1>Pokročilé otázky</h1>
        <p>
          Tato sekce ukazuje pokročilé typy otázek s <strong>váženým skórováním</strong> —
          důležitější otázky mají vyšší váhu.
        </p>
      </Text>
      <Assessment id="advanced-test" passThreshold={0.6}>
        <FillBlank
          id="fb-header"
          question="Která HTTP hlavička chrání proti XSS omezením zdrojů skriptů?"
          accept={['Content-Security-Policy', 'CSP']}
          weight={2}
          placeholder="Zadejte název hlavičky…"
        >
          <QuestionFeedback
            correct="Content-Security-Policy (CSP) omezuje zdroje skriptů."
            incorrect="Správná odpověď je Content-Security-Policy."
          />
        </FillBlank>

        <Matching
          id="match-attacks"
          question="Přiřaďte útok k jeho hlavní obraně:"
          weight={3}
        >
          <MatchingPair prompt="XSS" response="Content Security Policy" />
          <MatchingPair prompt="SQL Injection" response="Parametrizované dotazy" />
          <MatchingPair prompt="CSRF" response="CSRF token" />
        </Matching>

        <Ordering
          id="order-severity"
          question="Seřaďte zranitelnosti od nejčastější po nejméně častou (dle OWASP 2021):"
          weight={1}
        >
          <OrderingItem order={1}>Broken Access Control</OrderingItem>
          <OrderingItem order={2}>Cryptographic Failures</OrderingItem>
          <OrderingItem order={3}>Injection</OrderingItem>
          <OrderingItem order={4}>Insecure Design</OrderingItem>
        </Ordering>

        <CategorySort
          id="cat-attacks"
          question="Roztřiďte obrany ke správnému typu útoku:"
          weight={2}
          categories={[
            { id: 'xss', label: 'XSS' },
            { id: 'sqli', label: 'SQL Injection' },
            { id: 'csrf', label: 'CSRF' },
          ]}
          items={[
            { id: 'csp', label: 'Content Security Policy', category: 'xss' },
            { id: 'escape', label: 'Escapování výstupu', category: 'xss' },
            { id: 'param', label: 'Parametrizované dotazy', category: 'sqli' },
            { id: 'orm', label: 'ORM framework', category: 'sqli' },
            { id: 'token', label: 'CSRF token', category: 'csrf' },
            { id: 'samesite', label: 'SameSite cookie', category: 'csrf' },
          ]}
          partialCredit
        />
      </Assessment>
    </>
  )
}
