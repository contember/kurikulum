import { CategorySort as CS, CategorySortContext } from '@kurikulum/core'
import type { CategoryDef, CategoryItemDef } from '@kurikulum/core'
import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'

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
      {question && <legend class="text-base font-semibold text-text mb-4">{question}</legend>}
      {children ?? (
        <>
          <CategorySortItems />
          <CategorySortCategories />
          <CS.Submit class="mt-5 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-default hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors">
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
    <div class="mb-5">
      <div class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Položky k roztřídění</div>
      <div class="flex flex-wrap gap-2" role="list" aria-label="Items to sort">
        {unassigned.map(item => (
          <CS.Item
            key={item.id}
            id={item.id}
            class="px-3.5 py-2 border border-border rounded-lg bg-surface text-sm font-medium text-text cursor-grab select-none transition-all duration-150 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm data-[dragging]:opacity-40 data-[dragging]:cursor-grabbing active:cursor-grabbing data-[selected]:border-primary data-[selected]:bg-primary/10 data-[selected]:text-primary data-[selected]:ring-2 data-[selected]:ring-primary/20"
          >
            {item.label}
          </CS.Item>
        ))}
      </div>
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
          class="rounded-lg border-2 border-dashed border-border overflow-hidden min-h-[120px] data-[drag-over]:border-primary data-[drag-over]:bg-primary/5 data-[has-selected-item]:cursor-pointer data-[has-selected-item]:hover:border-primary/60 transition-colors"
        >
          {({ assignedItems }: { assignedItems: CategoryItemDef[] }) => (
            <>
              <div class="px-3 py-2 bg-bg-muted border-b border-border/50 text-sm font-semibold text-text">
                {cat.label}
              </div>
              <div class="p-2 space-y-1.5" role="list">
                {assignedItems.map(item => (
                  <CS.Item
                    key={item.id}
                    id={item.id}
                    class="px-3 py-1.5 rounded-md bg-primary/8 border border-primary/20 text-sm text-text cursor-grab select-none data-[dragging]:opacity-40 data-[correct=true]:bg-success/10 data-[correct=true]:border-success/30 data-[correct=true]:text-success data-[correct=false]:bg-danger/10 data-[correct=false]:border-danger/30 data-[correct=false]:text-danger transition-colors"
                  >
                    {item.label}
                  </CS.Item>
                ))}
                {assignedItems.length === 0 && !ctx.submitted && (
                  <div class="text-xs text-text-muted py-4 text-center select-none">
                    Přetáhněte sem
                  </div>
                )}
              </div>
            </>
          )}
        </CS.Category>
      ))}
    </div>
  )
}

export { CS as CategorySortCore }
