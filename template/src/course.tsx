import { render } from 'preact'
import { CourseProvider, createAdapter } from '@kurikulum/core'
import type { CourseConfig } from '@kurikulum/core'
import { Course } from './components/Course.tsx'
import { Page } from './components/Page.tsx'
import { Navigation } from './components/Navigation.tsx'
import { Text } from './components/Text.tsx'
import { Image } from './components/Image.tsx'
import { Video } from './components/Video.tsx'
import { Assessment } from './components/Assessment.tsx'
import { MCQ } from './components/MCQ.tsx'
import { MultiSelect } from './components/MultiSelect.tsx'
import { Option } from './components/Option.tsx'
import './styles.css'

const target = (import.meta.env.KURIKULUM_TARGET as string) || 'standalone'
const adapter = createAdapter(target === 'scorm-1.2' ? 'scorm-1.2' : 'standalone')

const config: CourseConfig = {
  title: 'Základy webové bezpečnosti',
  pages: ['intro', 'theory', 'media', 'standalone-quiz', 'assessment', 'scroll-page', 'summary'],
}

function App() {
  return (
    <CourseProvider config={config} adapter={adapter}>
      <div class="h-screen flex flex-col bg-bg text-text font-sans">
        <Course>
          {/* Page 1: Úvod – completion="mount" (okamžitě po zobrazení) */}
          <Page id="intro" completion="mount">
            <Text>
              <h1>Základy webové bezpečnosti</h1>
              <p>
                Vítejte v kurzu zaměřeném na nejčastější bezpečnostní hrozby webových aplikací.
                Projdeme si základní koncepty podle <strong>OWASP Top 10</strong> a naučíte se,
                jak se proti nim bránit.
              </p>
              <p>
                Kurz obsahuje teoretické materiály, multimediální obsah, samostatné kvízy
                i hodnocený test. Pokračujte kliknutím na <em>Další</em>.
              </p>
            </Text>
            <Image
              src="https://placehold.co/800x300/1e3a5f/ffffff?text=Web+Security+101"
              alt="Ilustrace webové bezpečnosti"
              caption="Bezpečnost by měla být součástí každé fáze vývoje."
            />
          </Page>

          {/* Page 2: Teorie – completion="timer" (po 5 sekundách čtení) */}
          <Page id="theory" completion="timer" completionTimer={5}>
            <Text>
              <h1>Nejčastější zranitelnosti</h1>
              <h2>1. Cross-Site Scripting (XSS)</h2>
              <p>
                XSS umožňuje útočníkovi vložit škodlivý skript do stránky, který se spustí
                v prohlížeči oběti. Rozlišujeme tři typy:
              </p>
              <ul>
                <li><strong>Reflected XSS</strong> – skript je součástí URL a odrazí se ze serveru</li>
                <li><strong>Stored XSS</strong> – skript je uložen v databázi (např. v komentáři)</li>
                <li><strong>DOM-based XSS</strong> – manipulace probíhá čistě na straně klienta</li>
              </ul>
              <h2>2. SQL Injection</h2>
              <p>
                Útočník vloží SQL kód do vstupního pole, čímž může číst, měnit nebo mazat
                data v databázi. Obrana spočívá v použití <strong>parametrizovaných dotazů</strong>
                a ORM frameworků.
              </p>
              <h2>3. Cross-Site Request Forgery (CSRF)</h2>
              <p>
                CSRF využívá důvěru serveru v autentizovaného uživatele. Útočník vytvoří
                stránku, která odešle požadavek jménem přihlášeného uživatele.
                Obrana: <strong>CSRF tokeny</strong> a atribut <code>SameSite</code> u cookies.
              </p>
            </Text>
          </Page>

          {/* Page 3: Multimédia – completion="scroll" (po doscrollování na konec) */}
          <Page id="media" completion="scroll">
            <Text>
              <h1>Ukázky a multimédia</h1>
              <p>V této sekci si prohlédněte schémata útoků a obranných mechanismů.</p>
            </Text>
            <Image
              src="https://placehold.co/800x400/2d4a22/ffffff?text=SQL+Injection+Schema"
              alt="Schéma SQL injection útoku"
              caption="Obr. 1 – Průběh SQL injection útoku přes formulářové pole"
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
          </Page>

          {/* Page 4: Rychlý kvíz – completion="interactive" (Assessment s okamžitým vyhodnocením) */}
          <Page id="standalone-quiz" completion="interactive">
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
          </Page>

          {/* Page 5: Hodnocený test – completion="interactive" (Assessment s retry) */}
          <Page id="assessment" completion="interactive">
            <Text>
              <h1>Závěrečný test</h1>
              <p>
                Pro úspěšné absolvování musíte získat alespoň <strong>66 % bodů</strong>.
                Máte maximálně 3 pokusy.
              </p>
            </Text>
            <Assessment id="final-test" passThreshold={0.66} maxAttempts={3}>
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
          </Page>

          {/* Page 6: Doplňkové čtení – completion="scroll" */}
          <Page id="scroll-page" completion="scroll">
            <Text>
              <h1>Další doporučení</h1>
              <h2>Content Security Policy (CSP)</h2>
              <p>
                CSP je HTTP hlavička, která omezuje, odkud může prohlížeč načítat skripty,
                styly a další zdroje. Správně nastavená CSP výrazně snižuje riziko XSS.
              </p>
              <h2>HTTPS a HSTS</h2>
              <p>
                Vždy používejte HTTPS. Hlavička <code>Strict-Transport-Security</code>
                zajistí, že prohlížeč bude komunikovat výhradně přes šifrované spojení.
              </p>
              <h2>Bezpečné hlavičky</h2>
              <p>Doporučené HTTP hlavičky pro zvýšení bezpečnosti:</p>
              <ul>
                <li><code>X-Content-Type-Options: nosniff</code></li>
                <li><code>X-Frame-Options: DENY</code></li>
                <li><code>Referrer-Policy: strict-origin-when-cross-origin</code></li>
                <li><code>Permissions-Policy</code> – omezení přístupu k API prohlížeče</li>
              </ul>
              <h2>Závěr</h2>
              <p>
                Bezpečnost webových aplikací není jednorázový úkol, ale průběžný proces.
                Pravidelně aktualizujte závislosti, provádějte audity a vzdělávejte svůj tým.
              </p>
              <p><em>Doscrollujte dolů pro dokončení této sekce.</em></p>
            </Text>
          </Page>

          {/* Page 7: Shrnutí – completion="manual" (vyžaduje ruční potvrzení) */}
          <Page id="summary" completion="manual">
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
          </Page>
        </Course>
        <Navigation />
      </div>
    </CourseProvider>
  )
}

render(<App />, document.getElementById('app')!)
