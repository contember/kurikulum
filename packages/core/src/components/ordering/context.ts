import { createContext } from 'preact'

export interface OrderingItemDef {
  order: number
}

export interface OrderingContextValue {
  items: OrderingItemDef[]
  currentOrder: number[]
  moveUp(position: number): void
  moveDown(position: number): void
  moveToPosition(fromPosition: number, toPosition: number): void
  submitted: boolean
  isStandalone: boolean
  submit(): void
  id: string
  correct: boolean | null
  score: number | null
  registerItem(order: number): number
  dragEnabled: boolean
  draggedPosition: number | null
  dropTargetPosition: number | null
  onDragStart(position: number): void
  onDragOver(position: number): void
  onDragEnd(): void
  onDrop(position: number): void
}

export const OrderingContext = createContext<OrderingContextValue | null>(null)

export interface OrderingItemContextValue {
  itemIndex: number
  order: number
  position: number
  correct: boolean | null
  disabled: boolean
  isFirst: boolean
  isLast: boolean
  moveUp(): void
  moveDown(): void
  dragEnabled: boolean
  isDragging: boolean
  isDragOver: boolean
  dragHandlers: {
    draggable: boolean
    onDragStart(e: DragEvent): void
    onDragOver(e: DragEvent): void
    onDragEnd(e: DragEvent): void
    onDrop(e: DragEvent): void
    onDragEnter(e: DragEvent): void
    onDragLeave(e: DragEvent): void
    onTouchStart(e: TouchEvent): void
    onTouchMove(e: TouchEvent): void
    onTouchEnd(e: TouchEvent): void
  }
}

export const OrderingItemContext = createContext<OrderingItemContextValue | null>(null)
