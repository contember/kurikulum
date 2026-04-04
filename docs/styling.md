# Styling

Tailwind CSS v4 with CSS-first theme in `src/styles.css`.

## Theme Tokens

```css
@theme {
  --color-primary / --color-primary-hover   /* Buttons, links, focus rings */
  --color-success                            /* Correct answers, pass */
  --color-danger                             /* Wrong answers, fail */
  --color-warning                            /* Timer warnings */
  --color-bg / --color-bg-surface / --color-bg-muted
  --color-text / --color-text-secondary / --color-text-muted
  --color-border
  --font-sans / --radius-default / --radius-lg
}
```

Use as utilities: `bg-primary`, `text-success`, `border-border`, `rounded-default`, `font-sans`.

## Data Attributes

Core components expose state for styling:

- `data-correct="true/false"` — options, inputs after submission
- `data-submitted="true"` — question fieldsets
- `data-warning` / `data-expired` — timer
- `data-dragging` — dragged item
- `data-drag-over` — drop zone
- `data-complete="true"` — completed pages

```
data-[correct=true]:border-success
data-[correct=false]:border-danger
data-[warning]:text-danger
data-[dragging]:opacity-50
```

## Rebranding

1. Edit `--color-*` values in `styles.css`
2. For structural changes, edit components in `src/components/`
