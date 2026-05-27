import type { VNode } from 'preact'
import { Accordion, AccordionItem } from '../../../components/Accordion.tsx'
import { FlipCard } from '../../../components/FlipCard.tsx'
import { Tab, Tabs } from '../../../components/Tabs.tsx'
import { Text } from '../../../components/Text.tsx'

export function InteractivePage(): VNode {
  return (
    <>
      <Text>
        <h1>Procvičení pojmů</h1>
        <p>Otočte obě kartičky — bez nich se na další stránku neposunete.</p>
      </Text>

      <FlipCard
        completeOnFlip
        id="flip-xss"
        front={
          <p>
            <strong>XSS</strong> — co tato zkratka znamená?
          </p>
        }
        back={<p>Cross-Site Scripting — vložení škodlivého skriptu do stránky, který se spustí v prohlížeči oběti.</p>}
      />
      <FlipCard
        completeOnFlip
        id="flip-csrf"
        front={
          <p>
            <strong>CSRF</strong> — co tato zkratka znamená?
          </p>
        }
        back={<p>Cross-Site Request Forgery — zneužití přihlášené session oběti k provedení nechtěné akce.</p>}
      />

      <Text>
        <h2>Obrana podle typu útoku</h2>
      </Text>
      <Tabs>
        <Tab label="XSS">
          <p>
            Escapujte výstup, nasaďte <strong>Content Security Policy</strong> a validujte vstupy.
          </p>
        </Tab>
        <Tab label="SQL Injection">
          <p>
            Používejte <strong>parametrizované dotazy</strong> (prepared statements), nikdy neskládejte SQL ze stringů.
          </p>
        </Tab>
        <Tab label="CSRF">
          <p>
            Vyžadujte <strong>CSRF token</strong> u stavových requestů a nastavte <code>SameSite</code> cookies.
          </p>
        </Tab>
      </Tabs>

      <Text>
        <h2>Časté otázky</h2>
      </Text>
      <Accordion>
        <AccordionItem title="Stačí mi HTTPS?">
          HTTPS šifruje přenos, ale nechrání před XSS, SQL injection ani CSRF. Je to nutný základ, ne kompletní obrana.
        </AccordionItem>
        <AccordionItem title="Co je nejčastější zranitelnost?">
          Podle OWASP Top 10 dlouhodobě vede Broken Access Control — nedostatečná kontrola oprávnění.
        </AccordionItem>
      </Accordion>
    </>
  )
}
