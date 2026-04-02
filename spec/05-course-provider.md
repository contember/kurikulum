# Krok 5: CourseProvider context

## Cíl

Preact context provider, který inicializuje runtime a zpřístupní ho celému stromu přes hooky.

## Soubory

- `packages/core/src/context.ts`

## API

```tsx
interface CourseProviderProps {
  config: CourseConfig
  adapter?: DeliveryAdapter   // default: standalone
  children: ComponentChildren
}

function CourseProvider({ config, adapter, children }: CourseProviderProps): VNode
```

## Použití

```tsx
// course.tsx (v template)
import { CourseProvider } from "@kurikulum/core"
import { createAdapter } from "@kurikulum/core/adapters"

const config = {
  title: "Můj kurz",
  pages: ["intro", "content", "quiz", "summary"],
  defaultCompletion: "mount",
}

export default function App() {
  return (
    <CourseProvider config={config} adapter={createAdapter("standalone")}>
      <Course />
    </CourseProvider>
  )
}
```

## Implementační detail

- Vytvoří `CourseRuntime` přes `createCourseRuntime(config, adapter)`
- Zavolá `runtime.restore()` při mount (obnoví stav z SCORM/localStorage)
- Zavolá `runtime.suspend()` při `beforeunload` eventu
- Zpřístupní runtime přes `createContext` / `useContext`
- Pokud adapter není zadán, vytvoří standalone adapter

## Akceptační kritéria

- Provider inicializuje runtime a zpřístupní ho hookům
- Restore proběhne při mount
- Suspend proběhne při beforeunload
- Hooky mimo provider hází chybu
