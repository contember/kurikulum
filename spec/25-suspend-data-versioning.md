# Krok 25: Verzování suspend_data

## Cíl

Bezpečná migrace uložených dat při změně struktury kurzu.

## Motivace

Když autor kurzu přidá/odebere stránku, přejmenuje assessment nebo změní pořadí otázek, learnerova uložená data (suspend_data) mohou být nekompatibilní. Současný `restore()` přepíše state bez jakékoli validace — může vést k chybám nebo ztrátě progressu.

## Změny

### Verze v suspend_data

```typescript
interface SuspendEnvelope {
  v: number                    // verze schématu
  courseVersion?: string       // volitelná verze kurzu z configu
  state: CourseState
}
```

### CourseConfig rozšíření

```typescript
interface CourseConfig {
  // ... stávající ...
  version?: string             // "1.0", "2.1" atd.
  onMigrate?: (old: CourseState, oldVersion: string) => CourseState | null
}
```

### Logika restore

```typescript
restore() {
  const raw = adapter.getSuspendData()
  if (!raw) return

  const envelope = JSON.parse(raw) as SuspendEnvelope

  // Verze schématu nekompatibilní → reset
  if (envelope.v !== CURRENT_SCHEMA_VERSION) {
    console.warn('[kurikulum] Incompatible suspend_data schema, resetting')
    return
  }

  // Verze kurzu se změnila → migrace
  if (envelope.courseVersion !== config.version) {
    if (config.onMigrate) {
      const migrated = config.onMigrate(envelope.state, envelope.courseVersion ?? '')
      if (migrated) {
        Object.assign(state, migrated)
        state.pages = config.pages  // vždy z aktuálního configu
        state.sessionStart = Date.now()
        return
      }
    }
    // Bez migrace nebo migrace vrátila null → reset
    console.warn('[kurikulum] Course version changed, resetting progress')
    return
  }

  // Stejná verze → normální restore
  Object.assign(state, envelope.state)
  state.pages = config.pages
  state.sessionStart = Date.now()
}
```

### Logika suspend

```typescript
suspend() {
  state.totalTimeMs += Date.now() - state.sessionStart
  const envelope: SuspendEnvelope = {
    v: CURRENT_SCHEMA_VERSION,
    courseVersion: config.version,
    state,
  }
  adapter.setSuspendData(JSON.stringify(envelope))
  adapter.commit()
}
```

## Migrace příklad

```typescript
const config: CourseConfig = {
  title: 'Bezpečnost v2',
  version: '2.0',
  pages: ['intro', 'theory-new', 'quiz', 'summary'],
  onMigrate(old, oldVersion) {
    if (oldVersion === '1.0') {
      // Stránka 'theory' přejmenována na 'theory-new'
      const completions = { ...old.completions }
      if (completions['theory']) {
        completions['theory-new'] = true
        delete completions['theory']
      }
      return { ...old, completions }
    }
    return null  // neznámá verze → reset
  },
}
```

## Akceptační kritéria

- suspend_data obsahuje verzi schématu a verzi kurzu
- Restore detekuje nekompatibilní schéma a resetuje
- Restore detekuje změněnou verzi kurzu
- `onMigrate` callback umožňuje custom migraci
- Bez `version` v configu se chování nemění (zpětná kompatibilita)
- Stará suspend_data bez envelope se bezpečně zahodí (ne crash)
- Unit testy pro: kompatibilní restore, nekompatibilní schéma, změna verze, migrace, chybějící envelope
