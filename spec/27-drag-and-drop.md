# Krok 27: Drag & Drop interakce

## Cíl

Přidat drag & drop UX do Ordering komponenty a nový typ interakce Category Sort (třídění do skupin).

## Motivace

Ordering komponenta má šipky (move up/down) což funguje jako accessible alternativa, ale drag & drop je UX standard v e-learningu. Category sort (přetáhni položku do správné kategorie) je jeden z nejčastějších typů interakcí v compliance a safety kurzech.

## Změny

### Ordering: DnD mód

Rozšířit stávající Ordering komponentu o drag & drop. Šipky zůstávají jako keyboard/a11y fallback.

```typescript
interface OrderingRootProps {
  // ... stávající ...
  dragEnabled?: boolean    // default true
}
```

Implementace: HTML5 Drag and Drop API + touch events pro mobilní zařízení. Žádná externí knihovna.

### Nová komponenta: CategorySort

Learner třídí položky do kategorií přetažením.

```
CategorySort.Root — wrapper, spravuje stav
CategorySort.Category — cílová kategorie (drop zone)
CategorySort.Item — přetahovatelná položka
CategorySort.Submit — odeslání odpovědi
CategorySort.Feedback — zpětná vazba
```

```typescript
interface CategorySortRootProps {
  id: string
  categories: Array<{ id: string; label: string }>
  items: Array<{ id: string; label: string; category: string }>  // category = správná kategorie
  partialCredit?: boolean  // default true
  class?: string
  children?: ComponentChildren
}
```

Skórování: partial credit — `správně přiřazené / celkem`.

### Vizuální feedback

- Drag ghost (polotransparentní kopie přetahovaného elementu)
- Drop zone highlight při hoveru
- Animace při puštění (položka "skočí" na místo)

### Accessibility

- Šipky / keyboard ovládání jako alternativa k DnD
- `aria-grabbed`, `aria-dropeffect` atributy
- Screen reader oznámení při přesunu

## Příklad

```tsx
{/* Ordering s DnD */}
<Ordering id="steps" items={["Zapni stroj", "Nasaď ochranné brýle", "Zkontroluj materiál"]}>
  <Ordering.Items />
  <Ordering.Submit />
  <Ordering.Feedback />
</Ordering>

{/* Category Sort */}
<CategorySort
  id="waste"
  categories={[
    { id: "plastic", label: "Plast" },
    { id: "paper", label: "Papír" },
    { id: "glass", label: "Sklo" },
  ]}
  items={[
    { id: "bottle", label: "PET lahev", category: "plastic" },
    { id: "newspaper", label: "Noviny", category: "paper" },
    { id: "jar", label: "Zavařovací sklenice", category: "glass" },
  ]}
>
  <CategorySort.Category id="plastic" />
  <CategorySort.Category id="paper" />
  <CategorySort.Category id="glass" />
  <CategorySort.Submit />
  <CategorySort.Feedback />
</CategorySort>
```

## Akceptační kritéria

- Ordering podporuje drag & drop (mouse + touch)
- Šipky zůstávají jako fallback
- CategorySort komponenta s partial credit skórováním
- Vizuální feedback při přetahování (ghost, drop zone highlight)
- Keyboard accessible alternativa pro CategorySort
- ARIA atributy pro screen readery
- Integrace s Assessment (skórování, interaction logging)
- Unit testy
