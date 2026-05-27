import { useLocale } from 'kurikulum'
import { toChildArray } from 'preact'
import type { ComponentChildren, VNode } from 'preact'
import { useState } from 'preact/hooks'

export interface TabProps {
  label: string
  children?: ComponentChildren
}

/**
 * Declarative marker for a single tab. Rendered only through `<Tabs>`, which
 * reads its `label` and content. Returning the children keeps it usable on its
 * own, but the normal usage is as a child of `<Tabs>`.
 */
export function Tab({ children }: TabProps): VNode {
  return <>{children}</>
}

export interface TabsProps {
  children?: ComponentChildren
}

/**
 * Tabbed content. Wrap one or more `<Tab label="…">` children; the first tab is
 * active by default and clicking a tab swaps the visible panel. Pure
 * presentation — does not participate in page completion.
 */
export function Tabs({ children }: TabsProps): VNode {
  const { t } = useLocale()
  const [active, setActive] = useState(0)
  const tabs = toChildArray(children)
    .filter((c): c is VNode => typeof c === 'object' && c !== null && 'props' in c)
    .map(c => c.props as TabProps)

  return (
    <div class="my-4">
      <div role="tablist" aria-label={t('tabs.aria')} class="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            data-active={i === active}
            onClick={() => setActive(i)}
            class="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 data-[active=true]:border-primary data-[active=true]:text-primary"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" class="prose prose-sm max-w-none pt-4">
        {tabs[active]?.children}
      </div>
    </div>
  )
}
