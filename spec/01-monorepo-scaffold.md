# Krok 1: Monorepo scaffold

## Cíl

Vytvořit Bun workspace monorepo se dvěma balíčky: `@kurikulum/core` a template projekt.

## Struktura

```
kurikulum/
├── package.json              # workspace root
├── bunfig.toml
├── packages/
│   └── core/
│       ├── package.json      # @kurikulum/core
│       ├── tsconfig.json
│       └── src/
│           └── index.ts
└── template/
    ├── package.json          # kurikulum-template
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── index.html
    └── src/
        ├── course.tsx        # hlavní soubor kurzu
        └── components/       # UI template komponenty
```

## Detail

### Root package.json

```json
{
  "name": "kurikulum",
  "private": true,
  "workspaces": ["packages/*", "template"]
}
```

### @kurikulum/core package.json

```json
{
  "name": "@kurikulum/core",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "peerDependencies": {
    "preact": "^10.0.0"
  }
}
```

### Template package.json

```json
{
  "name": "kurikulum-template",
  "private": true,
  "type": "module",
  "dependencies": {
    "@kurikulum/core": "workspace:*",
    "preact": "^10.0.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@preact/preset-vite": "^2.0.0",
    "tailwindcss": "^4.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

## Akceptační kritéria

- `bun install` projde bez chyb
- `bun run dev` v template spustí Vite dev server
- Template importuje z `@kurikulum/core`
