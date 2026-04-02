# Krok 8: Template — Text, Image, Video

## Cíl

Obsahové komponenty pro statický obsah kurzu.

## Soubory (v template/src/components/)

- `Text.tsx`
- `Image.tsx`
- `Video.tsx`

## Text

```tsx
interface TextProps {
  children: ComponentChildren
}
```

- Prostý wrapper pro textový obsah
- Tailwind styling pro typografii (prose-like)

## Image

```tsx
interface ImageProps {
  src: string
  alt: string          // povinné — a11y
  caption?: string
}
```

- `<figure>` + `<img>` + volitelný `<figcaption>`
- `alt` je povinný prop (a11y)
- Responsive sizing (max-width: 100%)

## Video

```tsx
interface VideoProps {
  src: string
  poster?: string
  caption?: string
}
```

- HTML5 `<video>` element s controls
- Volitelný poster frame
- Volitelný `<figcaption>`

## Akceptační kritéria

- Všechny komponenty renderují správný HTML
- Image má povinný alt text
- Video má nativní controls
- Styling přes Tailwind třídy
- Komponenty fungují uvnitř Page
