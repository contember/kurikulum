# Krok 21: SCORM interaction logging

## Cíl

Automaticky logovat odpovědi na otázky do SCORM 1.2 `cmi.interactions.*` data modelu.

## Motivace

LMS může zobrazit detailní report: "learner odpověděl na Q1 správně za 30s, na Q2 špatně za 2 minuty". Bez interactions LMS vidí jen celkové skóre. Pro compliance audity je to často vyžadováno.

## SCORM 1.2 Interactions model

```
cmi.interactions._count = 3
cmi.interactions.0.id = "q1"
cmi.interactions.0.type = "choice"           // choice | true-false | fill-in | matching | sequencing
cmi.interactions.0.student_response = "b"    // vybraná odpověď
cmi.interactions.0.correct_responses.0.pattern = "b"
cmi.interactions.0.result = "correct"        // correct | wrong | neutral
cmi.interactions.0.latency = "00:00:30"      // čas strávený na otázce
cmi.interactions.0.weighting = 1
cmi.interactions.0.time = "13:45:22"         // čas submitu
```

## Změny

### DeliveryAdapter interface

```typescript
interface DeliveryAdapter {
  // ... stávající metody ...

  // Nové
  recordInteraction(interaction: InteractionRecord): void
}

interface InteractionRecord {
  id: string
  type: 'choice' | 'true-false' | 'fill-in' | 'matching' | 'sequencing'
  studentResponse: string
  correctResponse: string
  result: 'correct' | 'wrong' | 'neutral'
  latency?: number       // ms
  weighting?: number
}
```

### SCORM 1.2 adapter

Implementuje `recordInteraction()` — zapisuje do `cmi.interactions.N.*`.

### Standalone adapter

Implementuje `recordInteraction()` — loguje do console (dev mode) nebo ukládá do localStorage.

### Komponenty

Každý question type po submitu volá `adapter.recordInteraction()` s příslušnými daty:

- **MCQ:** type=`choice`, studentResponse=index vybrané odpovědi
- **MultiSelect:** type=`choice`, studentResponse=čárkou oddělené indexy
- **FillBlank:** type=`fill-in`, studentResponse=zadaný text
- **Matching:** type=`matching`, studentResponse=páry (SCORM format)
- **Ordering:** type=`sequencing`, studentResponse=pořadí (SCORM format)

### Latency tracking

Každá otázka měří čas od prvního zobrazení do submitu. `useRef` s timestampem při mountu.

## Akceptační kritéria

- Po submitu otázky se zapíše interaction do SCORM API
- Správný SCORM format pro každý question type
- Latency se měří a reportuje
- Standalone adapter loguje interakce do console
- `cmi.interactions._count` se inkrementuje správně
- Unit testy pro formátování SCORM interaction dat
