import type { ComponentChildren } from 'preact'

/** Base props shared by all headless component parts */
export interface HeadlessPartProps {
  class?: string
  children?: ComponentChildren
}
