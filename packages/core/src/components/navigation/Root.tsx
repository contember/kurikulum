import type { VNode } from 'preact'
import { useNavigation } from '../../hooks/index.ts'
import { useLocale } from '../../i18n/index.ts'
import type { HeadlessPartProps } from '../types.ts'
import { NavigationContext } from './context.ts'

export interface NavigationRootProps extends HeadlessPartProps {
  'aria-label'?: string
}

export function Root({ children, class: className, 'aria-label': ariaLabel }: NavigationRootProps): VNode {
  const nav = useNavigation()
  const { t } = useLocale()

  return (
    <NavigationContext.Provider value={nav}>
      <nav role="navigation" aria-label={ariaLabel ?? t('nav.aria')} class={className}>
        {children}
      </nav>
    </NavigationContext.Provider>
  )
}
