# Krok 32: xAPI adapter

## Cíl

Nový delivery adapter pro xAPI (Tin Can API) — moderní nástupce SCORMu.

## Motivace

xAPI je směr kam e-learning standardy míří. Místo omezeného SCORM key-value modelu posílá JSON "statements" na Learning Record Store (LRS). Umožňuje trackovat bohatší data — mikrointerakce, čas na elementu, detailní assessment data. DeliveryAdapter abstrakce v Tabule to zjednodušuje — runtime kód se nemění.

## Změny

### xAPI adapter

Nový adapter implementující `DeliveryAdapter` interface:

```typescript
interface XApiConfig {
  endpoint: string         // LRS endpoint URL
  auth: string             // Basic auth nebo OAuth token
  actor: {                 // learner identita
    mbox?: string          // mailto:user@example.com
    account?: { homePage: string; name: string }
  }
  activityId: string       // IRI identifikující kurz
  registration?: string    // UUID session
}
```

### Statement mapping

Mapování Tabule eventů na xAPI statements (Actor + Verb + Object):

| Tabule event | xAPI verb | Object type |
|---|---|---|
| Kurz spuštěn | `launched` | Activity (kurz) |
| Stránka zobrazena | `experienced` | Activity (stránka) |
| Stránka completed | `completed` | Activity (stránka) |
| Assessment submit | `attempted` | Activity (assessment) |
| Assessment passed | `passed` | Activity (assessment) |
| Assessment failed | `failed` | Activity (assessment) |
| Otázka odpovězena | `answered` | Activity (otázka) |
| Kurz dokončen | `completed` | Activity (kurz) |

### xAPI Result

Assessment výsledky jako xAPI Result objekt:

```json
{
  "score": { "scaled": 0.85, "raw": 17, "min": 0, "max": 20 },
  "success": true,
  "completion": true,
  "duration": "PT25M30S"
}
```

### LRS komunikace

- HTTP POST na `{endpoint}/statements`
- Batch sending — shromáždí statements a pošle periodicky (ne každý event zvlášť)
- Offline queue — pokud LRS nedostupný, ukládá do localStorage a pošle při příštím spojení
- Auth: Basic auth header (`Authorization: Basic base64(key:secret)`)

### Packaging: cmi5

cmi5 je profil xAPI specifický pro e-learning (definuje povinné statements, launch mechanismus):

- `cmi5.xml` manifest (obdoba imsmanifest.xml)
- Launch URL s parametry (endpoint, auth, actor, registration)
- Povinné statements: launched, initialized, completed, passed/failed, terminated

### Vite plugin rozšíření

Nový build target `xapi` vedle `scorm-1.2` a `standalone`:

```typescript
tabule({ target: 'xapi', xapi: { activityId: 'https://example.com/courses/safety' } })
```

## Příklad

```typescript
import { createXApiAdapter } from '@tabule/core'

const adapter = createXApiAdapter({
  endpoint: 'https://lrs.example.com/xapi',
  auth: 'Basic dXNlcjpwYXNz',
  actor: { mbox: 'mailto:learner@example.com' },
  activityId: 'https://example.com/courses/safety-101',
})
```

## Akceptační kritéria

- xAPI adapter implementuje DeliveryAdapter interface
- Správné mapování Tabule eventů na xAPI verbs
- Score reporting jako xAPI Result
- Batch sending s offline queue
- cmi5 packaging (manifest + launch)
- Vite plugin target `xapi`
- Suspend/restore přes xAPI State API
- Unit testy (mock LRS)
