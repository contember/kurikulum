import type { VNode } from 'preact'
import { Assessment } from '../../../components/Assessment.tsx'
import { MCQ } from '../../../components/MCQ.tsx'
import { MultiSelect } from '../../../components/MultiSelect.tsx'
import { Option } from '../../../components/Option.tsx'
import { Text } from '../../../components/Text.tsx'

export function AssessmentPage(): VNode {
  return (
    <>
      <Text>
        <h1>Závěrečný test</h1>
        <p>
          Pro úspěšné absolvování musíte získat alespoň <strong>66 % bodů</strong>. Máte maximálně 3 pokusy.
        </p>
      </Text>
      <Assessment id="final-test" passThreshold={0.66} maxAttempts={3} timeLimit={180}>
        <MCQ id="a-q1" question="Jaká je hlavní obrana proti SQL injection?">
          <Option>Escapování HTML</Option>
          <Option correct>Parametrizované dotazy</Option>
          <Option>Šifrování hesel</Option>
          <Option>Rate limiting</Option>
        </MCQ>
        <MultiSelect id="a-q2" question="Které z následujících jsou typy XSS? (vyberte všechny správné)">
          <Option correct>Reflected</Option>
          <Option correct>Stored</Option>
          <Option>Blind</Option>
          <Option correct>DOM-based</Option>
        </MultiSelect>
        <MCQ id="a-q3" question="Co je hlavním principem CSRF útoku?">
          <Option>Vložení skriptu do stránky</Option>
          <Option>Podvržení DNS záznamu</Option>
          <Option correct>Zneužití autentizované session oběti</Option>
          <Option>Odposlechnutí síťového provozu</Option>
        </MCQ>
      </Assessment>
    </>
  )
}
