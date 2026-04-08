import type { ComponentChildren, VNode } from 'preact'
import { useCallback, useContext } from 'preact/hooks'
import { CategorySortContext } from './context.ts'

export interface CategorySortCategoryProps {
  id: string
  children?: ComponentChildren
  class?: string
}

export function Category({ id: categoryId, children, class: className }: CategorySortCategoryProps): VNode {
  const ctx = useContext(CategorySortContext)
  if (!ctx) throw new Error('CategorySort.Category must be used within CategorySort.Root')

  const category = ctx.categories.find(c => c.id === categoryId)
  if (!category) throw new Error(`Category "${categoryId}" not found`)

  const isDragOver = ctx.dropTargetCategoryId === categoryId && ctx.draggedItemId !== null

  // Items assigned to this category
  const assignedItems = ctx.items.filter(item => ctx.assignments.get(item.id) === categoryId)

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    ctx.onDragOverCategory(categoryId)
  }, [categoryId, ctx.onDragOverCategory])

  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    ctx.onDragOverCategory(categoryId)
  }, [categoryId, ctx.onDragOverCategory])

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    ctx.onDropOnCategory(categoryId)
  }, [categoryId, ctx.onDropOnCategory])

  const onDragLeave = useCallback((_e: DragEvent) => {
    // Handled by next dragenter
  }, [])

  // Keyboard: allow selecting category for an item
  const onSelect = useCallback((itemId: string) => {
    if (ctx.submitted) return
    ctx.assign(itemId, categoryId)
  }, [categoryId, ctx.assign, ctx.submitted])

  const onClick = useCallback(() => {
    if (ctx.submitted) return
    if (ctx.selectedItemId) {
      ctx.assignSelectedToCategory(categoryId)
    }
  }, [categoryId, ctx.submitted, ctx.selectedItemId, ctx.assignSelectedToCategory])

  return (
    <div
      class={className}
      data-category={categoryId}
      data-drag-over={isDragOver || undefined}
      data-has-selected-item={ctx.selectedItemId !== null || undefined}
      aria-dropeffect={ctx.draggedItemId !== null ? 'move' : undefined}
      aria-label={`Category: ${category.label}`}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      onClick={onClick}
    >
      {typeof children === 'function'
        ? (children as any)({ category, assignedItems, isDragOver, onSelect })
        : (
          <>
            <div data-category-label>{category.label}</div>
            <div data-category-items role="list">
              {assignedItems.map(item => {
                const isCorrect = ctx.submitted ? item.category === categoryId : null
                return (
                  <div
                    key={item.id}
                    role="listitem"
                    data-item={item.id}
                    data-correct={isCorrect !== null ? String(isCorrect) : undefined}
                  >
                    {item.label}
                  </div>
                )
              })}
            </div>
          </>
        )}
    </div>
  )
}
