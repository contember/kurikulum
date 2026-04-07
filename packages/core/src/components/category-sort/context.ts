import { createContext } from 'preact'

export interface CategoryDef {
  id: string
  label: string
}

export interface CategoryItemDef {
  id: string
  label: string
  category: string // correct category id
}

export interface CategorySortContextValue {
  categories: CategoryDef[]
  items: CategoryItemDef[]
  assignments: Map<string, string> // itemId -> categoryId
  assign(itemId: string, categoryId: string): void
  unassign(itemId: string): void
  submitted: boolean
  isStandalone: boolean
  submit(): void
  id: string
  correct: boolean | null
  score: number | null
  draggedItemId: string | null
  dropTargetCategoryId: string | null
  onDragStart(itemId: string): void
  onDragOverCategory(categoryId: string): void
  onDragEnd(): void
  onDropOnCategory(categoryId: string): void

  // Click-to-assign
  selectedItemId: string | null
  toggleSelectItem(itemId: string): void
  assignSelectedToCategory(categoryId: string): void
}

export const CategorySortContext = createContext<CategorySortContextValue | null>(null)
