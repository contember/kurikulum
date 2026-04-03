import type { VNode } from 'preact'
import { useState } from 'preact/hooks'
import { Notes as N, useNotes } from '@kurikulum/core'

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

  return (
    <>
      <div class="flex items-center justify-between p-4 border-b border-border">
        <h2 class="text-lg font-semibold text-text">Poznámky</h2>
        <button
          type="button"
          onClick={ctx.close}
          class="p-1 text-text-secondary hover:text-text rounded-default focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Zavřít poznámky"
        >
          ✕
        </button>
      </div>
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        {ctx.notes.length === 0 ? (
          <p class="text-sm text-text-secondary mt-4">Zatím žádné poznámky.</p>
        ) : (
          <ul class="space-y-3 mt-4">
            {ctx.notes.map((note, i) => (
              <li key={`${note.pageId}-${note.createdAt}-${i}`} class="border-b border-border pb-3 last:border-0">
                <div class="text-xs text-text-secondary mb-1">{note.pageId}</div>
                <div class="text-sm text-text">{note.text}</div>
                <button
                  type="button"
                  onClick={() => {
                    const pageNotes = ctx.notes.filter((n) => n.pageId === note.pageId)
                    const idx = pageNotes.indexOf(note)
                    if (idx >= 0) ctx.removeNote(note.pageId, idx)
                  }}
                  class="text-xs text-danger hover:underline mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Smazat poznámku"
                >
                  Smazat
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export function NotesEditor({ pageId }: { pageId?: string }): VNode {
  return (
    <N.Editor pageId={pageId}>
      {({ notes, addNote, removeNote }) => (
        <NotesEditorContent notes={notes} addNote={addNote} removeNote={removeNote} />
      )}
    </N.Editor>
  )
}

function NotesEditorContent({ notes, addNote, removeNote }: {
  notes: { text: string; createdAt: number }[]
  addNote: (text: string) => void
  removeNote: (index: number) => void
}): VNode {
  const [text, setText] = useState('')

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (text.trim()) {
      addNote(text.trim())
      setText('')
    }
  }

  return (
    <div class="mt-4">
      {notes.length > 0 && (
        <ul class="space-y-2 mb-3">
          {notes.map((note, i) => (
            <li key={`${note.createdAt}-${i}`} class="flex items-start gap-2 text-sm text-text bg-bg-muted rounded-default p-2">
              <span class="flex-1">{note.text}</span>
              <button
                type="button"
                onClick={() => removeNote(i)}
                class="text-xs text-danger hover:underline shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Smazat poznámku"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} class="flex gap-2">
        <input
          type="text"
          value={text}
          onInput={(e) => setText((e.target as HTMLInputElement).value)}
          placeholder="Přidat poznámku…"
          maxLength={200}
          class="flex-1 px-3 py-2 text-sm border border-border rounded-default bg-bg-surface text-text placeholder-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Nová poznámka"
        />
        <button
          type="submit"
          class="px-3 py-2 text-sm bg-primary text-white rounded-default hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Přidat
        </button>
      </form>
    </div>
  )
}

export function NotesIndicator(): VNode | null {
  return (
    <N.Indicator class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-medium bg-primary text-white rounded-full" />
  )
}

export function NotesToggle(): VNode {
  const ctx = useNotes()

  return (
    <button
      type="button"
      onClick={ctx.toggle}
      class="px-3 py-2 text-sm bg-bg-surface text-text border border-border rounded-default hover:bg-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={ctx.isOpen ? 'Zavřít poznámky' : 'Otevřít poznámky'}
      aria-expanded={ctx.isOpen}
    >
      Poznámky
    </button>
  )
}
