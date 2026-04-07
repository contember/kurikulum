import type { VNode } from 'preact'
import { Glossary as G, useGlossary } from '@kurikulum/core'
import type { GlossaryEntry } from '@kurikulum/core'

export interface GlossaryProps {
  entries: GlossaryEntry[]
  children?: preact.ComponentChildren
}

export function Glossary({ entries, children }: GlossaryProps): VNode {
  return (
    <G.Root entries={entries}>
      {children}
    </G.Root>
  )
}

export function GlossaryPanel(): VNode | null {
  return (
    <G.Panel class="fixed inset-y-0 right-0 z-40 w-80 bg-bg-surface border-l border-border shadow-lg flex flex-col">
      <GlossaryPanelContent />
    </G.Panel>
  )
}

function GlossaryPanelContent(): VNode {
  const ctx = useGlossary()

  return (
    <>
      <div class="flex items-center justify-between p-4 border-b border-border">
        <h2 class="text-lg font-semibold text-text">Slovníček</h2>
        <button
          type="button"
          onClick={ctx.close}
          class="p-1 text-text-secondary hover:text-text rounded-default focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Zavřít slovníček"
        >
          ✕
        </button>
      </div>
      <div class="p-4">
        <G.Search
          class="w-full px-3 py-2 border border-border rounded-default bg-bg-surface text-text placeholder-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder="Hledat pojem…"
        />
      </div>
      <dl class="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {ctx.filtered.map((entry) => (
          <div key={entry.term} class="border-b border-border pb-3 last:border-0">
            <dt class="font-semibold text-text">{entry.term}</dt>
            <dd class="text-sm text-text-secondary mt-1">{entry.definition}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

export function GlossaryTerm({ term, children }: { term: string; children?: preact.ComponentChildren }): VNode {
  return (
    <G.Term
      term={term}
      class="inline-block border-b border-dashed border-primary text-primary cursor-pointer"
    >
      {children}
    </G.Term>
  )
}

export function GlossaryToggle(): VNode {
  const ctx = useGlossary()

  return (
    <button
      type="button"
      onClick={ctx.toggle}
      class="px-3 py-2 text-sm bg-bg-surface text-text border border-border rounded-default hover:bg-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={ctx.isOpen ? 'Zavřít slovníček' : 'Otevřít slovníček'}
      aria-expanded={ctx.isOpen}
    >
      Slovníček
    </button>
  )
}
