# Krok 12: Vite plugin + single-file build

## Cíl

Vite konfigurace pro build kurzu do single HTML souboru, s Preact aliasem.

## Soubory

- `template/vite.config.ts`

## Konfigurace

```typescript
import { defineConfig } from "vite"
import preact from "@preact/preset-vite"
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig(({ mode }) => {
  const target = process.env.KURIKULUM_TARGET || "standalone"

  return {
    plugins: [
      preact(),
      viteSingleFile(),
    ],
    define: {
      "import.meta.env.KURIKULUM_TARGET": JSON.stringify(target),
    },
    build: {
      target: "es2020",
      outDir: `dist/${target}`,
    },
  }
})
```

## Build targets

```bash
# Dev
bun run dev

# Standalone build
bun run build

# SCORM 1.2 build
KURIKULUM_TARGET=scorm-1.2 bun run build
```

## Adapter injection

V `course.tsx` (template) — autor importuje adapter explicitně:

```tsx
import { createAdapter } from "@kurikulum/core/adapters"

const target = import.meta.env.KURIKULUM_TARGET || "standalone"
const adapter = createAdapter(target)
```

Žádné virtual modules — prostý import + env proměnná.

## Single-file output

- `vite-plugin-singlefile` inlinuje JS + CSS do HTML
- Assets (obrázky, videa) zůstávají jako soubory — nejsou inlinované
- Výstup: `dist/standalone/index.html` nebo `dist/scorm-1.2/index.html`

## Akceptační kritéria

- `bun run dev` spustí dev server s HMR
- `bun run build` vytvoří single-file HTML
- `KURIKULUM_TARGET=scorm-1.2 bun run build` vytvoří SCORM build
- Preact alias funguje (react → preact/compat)
- Assets nejsou inlinované
