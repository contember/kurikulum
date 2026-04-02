# Krok 15: E2E test

## Cíl

Ověřit celý flow: napsat kurz v JSX → buildnout → SCORM balíček funguje.

## Test scénář

### 1. Testovací kurz

Vytvořit minimální kurz pokrývající všechny features:

```tsx
<CourseProvider config={config}>
  <Course>
    <Page id="intro" completion="mount">
      <Text>Úvod</Text>
    </Page>
    <Page id="reading" completion="timer" completionTimer={3}>
      <Text>Obsah ke čtení</Text>
      <Image src="./test.png" alt="Test obrázek" />
    </Page>
    <Page id="quiz" completion="interactive">
      <Assessment id="test-assessment" passThreshold={0.5}>
        <MCQ id="q1" question="Test otázka">
          <Option correct>Správně</Option>
          <Option>Špatně</Option>
        </MCQ>
      </Assessment>
    </Page>
    <Page id="summary" completion="manual">
      <Text>Shrnutí</Text>
    </Page>
  </Course>
  <Navigation />
</CourseProvider>
```

### 2. Build testy

- `bun run build` → vytvoří standalone HTML
- `KURIKULUM_TARGET=scorm-1.2 bun run build:scorm` → vytvoří ZIP

### 3. Standalone test

- Otevřít HTML v browseru
- Projít všechny stránky
- Zodpovědět quiz
- Ověřit localStorage persistence (refresh → stav zachován)

### 4. SCORM test

- Upload ZIP do SCORM Cloud (cloud.scorm.com)
- Spustit kurz
- Ověřit:
  - Kurz se načte
  - Navigace funguje
  - Quiz se skóruje
  - Completion status se reportuje do LMS
  - Bookmark (lesson_location) funguje po relaunch
  - Score se zobrazí v LMS

### 5. A11y test

- Projít kurz jen klávesnicí
- Spustit Lighthouse accessibility audit
- Ověřit screen reader output (alespoň manuálně)

## Automatizace

Pro v1 stačí manuální testování. Automatizované testy (Playwright) přidat ve v2.

Unit testy na core (runtime, adaptery, hooky) — ty by měly být od začátku.

## Akceptační kritéria

- Testovací kurz se buildne bez chyb
- Standalone verze funguje v browseru
- SCORM balíček projde na SCORM Cloud
- Všechny completion strategie fungují
- Assessment skórování funguje
- Keyboard navigace funguje
