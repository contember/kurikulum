import { createContext } from 'preact'

export interface OrderingItemDef {
  order: number
}

export interface OrderingContextValue {
  items: OrderingItemDef[]
  currentOrder: number[]
  moveUp(position: number): void
  moveDown(position: number): void
  submitted: boolean
  isStandalone: boolean
  submit(): void
  id: string
  correct: boolean | null
  score: number | null
  registerItem(order: number): number
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
}

export const OrderingItemContext = createContext<OrderingItemContextValue | null>(null)
