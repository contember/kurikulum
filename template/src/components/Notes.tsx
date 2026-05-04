import { Notes as N, useLocale, useNotes } from 'kurikulum'
import type { VNode } from 'preact'

export interface NotesProps {
  children?: preact.ComponentChildren
}

export function Notes({ children }: NotesProps): VNode {
  return (
    <N.Root>
      {children}
    </N.Root>
  )
}

export function NotesPanel(): VNode | null {
  return (
    <N.Panel class="fixed inset-y-0 right-0 z-40 w-80 bg-bg-surface border-l border-border shadow-lg flex flex-col">
      <NotesPanelContent />
    </N.Panel>
  )
}

function NotesPanelContent(): VNode {
  const ctx = useNotes()
  const { t } = useLocale()

  return (
    <>
      <div class="flex items-center justify-between p-4 border-b border-border">
        <h2 class="text-lg font-semibold text-text">{t('notes.title')}</h2>
        <button
          type="button"
          onClick={ctx.close}
          class="p-1 text-text-secondary hover:text-text rounded-default focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t('notes.toggle.close')}
        >
          ✕
        </button>
      </div>
      <textarea
        class="flex-1 p-4 text-sm text-text bg-bg-surface resize-none focus:outline-none placeholder-text-secondary"
        placeholder={t('notes.placeholder')}
        value={ctx.text}
        onInput={(e) => ctx.setText((e.target as HTMLTextAreaElement).value)}
        aria-label={t('notes.title')}
      />
    </>
  )
}

export function NotesToggle(): VNode {
  const ctx = useNotes()
  const { t } = useLocale()

  return (
    <button
      type="button"
      onClick={ctx.toggle}
      class="px-3 py-2 text-sm bg-bg-surface text-text border border-border rounded-default hover:bg-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={ctx.isOpen ? t('notes.toggle.close') : t('notes.toggle.open')}
      aria-expanded={ctx.isOpen}
    >
      {t('notes.title')}
    </button>
  )
}
