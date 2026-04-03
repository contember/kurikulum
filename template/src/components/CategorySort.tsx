import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { CategorySort as CS, CategorySortContext } from '@kurikulum/core'
import type { CategoryDef, CategoryItemDef } from '@kurikulum/core'

export interface CategorySortProps {
  id: string
  categories: CategoryDef[]
  items: CategoryItemDef[]
  partialCredit?: boolean
  question?: string
  weight?: number
  children?: ComponentChildren
}

export function CategorySort({ id, categories, items, partialCredit, question, weight, children }: CategorySortProps): VNode {
  return (
    <CS.Root id={id} categories={categories} items={items} partialCredit={partialCredit} weight={weight} aria-label={question}>
      {question && <legend class="font-semibold mb-2">{question}</legend>}
      {children ?? (
        <>
          <CategorySortItems />
          <CategorySortCategories />
          <CS.Submit class="mt-3 px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Odeslat
          </CS.Submit>
        </>
      )}
    </CS.Root>
  )
}

function CategorySortItems(): VNode | null {
  const ctx = useContext(CategorySortContext)
  if (!ctx) return null

  const unassigned = ctx.items.filter(item => !ctx.assignments.has(item.id))
  if (unassigned.length === 0 && !ctx.submitted) return null

  return (
    <div class="flex flex-wrap gap-2 mb-4" role="list" aria-label="Items to sort">
      {unassigned.map(item => (
        <CS.Item
          key={item.id}
          id={item.id}
          class="px-3 py-2 border border-border rounded-default bg-surface cursor-grab data-[dragging]:opacity-50 data-[dragging]:cursor-grabbing select-none transition-opacity"
        >
          {item.label}
        </CS.Item>
      ))}
    </div>
  )
}

function CategorySortCategories(): VNode | null {
  const ctx = useContext(CategorySortContext)
  if (!ctx) return null

  return (
    <div class="grid gap-4" style={{ gridTemplateColumns: `repeat(${ctx.categories.length}, 1fr)` }}>
      {ctx.categories.map(cat => (
        <CS.Category
          key={cat.id}
          id={cat.id}
          class="p-3 border-2 border-dashed border-border rounded-default min-h-[100px] data-[drag-over]:border-primary data-[drag-over]:bg-primary/5 transition-colors"
        />
      ))}
    </div>
  )
}

export { CS as CategorySortCore }
