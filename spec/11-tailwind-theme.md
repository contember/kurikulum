# Krok 11: Tailwind v4 theme

## Cíl

Default theme pro kurzy — čistý, profesionální, snadno přizpůsobitelný.

## Soubory

- `template/src/styles.css` (Tailwind v4 entry point)

## Tailwind v4

Tailwind v4 používá CSS-first konfiguraci místo JS config souboru.

```css
/* styles.css */
@import "tailwindcss";

@theme {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-success: #16a34a;
  --color-danger: #dc2626;
  --color-warning: #d97706;

  --color-bg: #ffffff;
  --color-bg-surface: #f8fafc;
  --color-bg-muted: #f1f5f9;

  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;

  --color-border: #e2e8f0;

  --font-sans: "Inter", system-ui, sans-serif;

  --radius-default: 0.5rem;
  --radius-lg: 0.75rem;
}
```

## Styling approach

- Komponenty používají Tailwind utility třídy přímo
- Theme proměnné pro barvy — autor si přepíše v `@theme`
- Žádný CSS-in-JS, žádné styled components
- Responsivní layout (kurz funguje na mobilu i desktopu)

## Akceptační kritéria

- Default theme vypadá profesionálně
- Změna barvy v `@theme` se projeví ve všech komponentách
- Layout je responsivní
- Focus ring viditelný na všech interaktivních prvcích
