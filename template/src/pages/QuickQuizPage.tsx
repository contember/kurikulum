import type { VNode } from 'preact'
import { Assessment } from '../components/Assessment.tsx'
import { MCQ } from '../components/MCQ.tsx'
import { MultiSelect } from '../components/MultiSelect.tsx'
import { Option } from '../components/Option.tsx'
import { Text } from '../components/Text.tsx'

export function QuickQuizPage(): VNode {
  return (
    <>
      <Text>
        <h1>Rychlý kvíz</h1>
        <p>Ověřte si porozumění jednotlivým konceptům.</p>
      </Text>
      <Assessment id="quick-quiz" passThreshold={0.5}>
        <MCQ id="q-xss" question="Který typ XSS ukládá škodlivý kód do databáze?">
          <Option>Reflected XSS</Option>
          <Option correct>Stored XSS</Option>
          <Option>DOM-based XSS</Option>
        </MCQ>
        <MultiSelect id="q-defense" question="Které techniky chrání proti CSRF? (vyberte všechny správné)">
          <Option correct>CSRF tokeny</Option>
          <Option>Parametrizované dotazy</Option>
          <Option correct>SameSite cookie atribut</Option>
          <Option>Content Security Policy</Option>
        </MultiSelect>
      </Assessment>
    </>
  )
}
