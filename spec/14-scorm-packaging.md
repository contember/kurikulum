# Krok 14: SCORM manifest + ZIP

## Cíl

Generátor imsmanifest.xml a ZIP balení SCORM 1.2 kurzu.

## Soubory

- `packages/core/src/scorm/manifest.ts`
- `packages/core/src/scorm/package.ts`

## imsmanifest.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="kurikulum-course"
          version="1.0"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="kurikulum-org">
    <organization identifier="kurikulum-org">
      <title>{courseTitle}</title>
      <item identifier="kurikulum-item" identifierref="kurikulum-resource">
        <title>{courseTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="kurikulum-resource"
              type="webcontent"
              adlcp:scormtype="sco"
              href="index.html">
      <file href="index.html"/>
      {/* další soubory (assets) */}
    </resource>
  </resources>
</manifest>
```

## Generátor

```typescript
interface ManifestOptions {
  title: string
  identifier?: string
  files: string[]  // relativní cesty v balíčku
}

function generateManifest(options: ManifestOptions): string
```

## ZIP balení

```typescript
interface PackageOptions {
  outputDir: string  // cesta k Vite build outputu
  outputZip: string  // cesta k výslednému ZIP
  title: string
}

async function createScormPackage(options: PackageOptions): Promise<void>
```

1. Scanuje `outputDir` pro všechny soubory
2. Generuje `imsmanifest.xml`
3. Vytvoří ZIP obsahující `imsmanifest.xml` + všechny soubory z outputDir
4. Uloží jako `{title}.zip`

## Build integration

Post-build skript v template:

```json
{
  "scripts": {
    "build": "vite build",
    "build:scorm": "KURIKULUM_TARGET=scorm-1.2 vite build && bun run package",
    "package": "bun packages/core/src/scorm/package.ts"
  }
}
```

Nebo jako Vite plugin hook (`closeBundle`).

## ZIP library

Použít `archiver` nebo `jszip` — oboje funguje v Bun.

## Akceptační kritéria

- Generovaný manifest je validní XML
- ZIP obsahuje imsmanifest.xml + index.html + assets
- ZIP je uploadovatelný do SCORM Cloud
- Kurz title se projeví v manifestu
