'use client'

import { useState, useTransition } from 'react'
import { logPages, deleteLog, saveBook, deleteBook } from '@/app/admin/reading/actions'

interface Book {
  id: string
  title: string
  author: string | null
  totalPages: number | null
  startDate: string | null
  endDate: string | null
  completed: boolean
  pagesLogged: number
}

interface LogEntry {
  id: string
  date: string
  pagesRead: number
  bookTitle: string
}

interface ReadingPanelProps {
  books: Book[]
  todayDate: string
  recentLogs: LogEntry[]
}

function BookForm({ book, onDone }: { book?: Book; onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(book?.title ?? '')
  const [author, setAuthor] = useState(book?.author ?? '')
  const [totalPages, setTotalPages] = useState(book?.totalPages?.toString() ?? '')
  const [startDate, setStartDate] = useState(book?.startDate ?? '')
  const [endDate, setEndDate] = useState(book?.endDate ?? '')
  const [completed, setCompleted] = useState(book?.completed ?? false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveBook({ id: book?.id, title, author, totalPages, startDate, endDate, completed })
      if (result.error) setError(result.error)
      else onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
      <p className="text-xs font-semibold text-on-surface">{book ? 'Buch bearbeiten' : 'Neues Buch'}</p>
      {error && <p className="text-xs text-error">{error}</p>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel *" required
        className="w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm bg-surface-container text-on-surface focus:outline-none" />
      <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Autor"
        className="w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm bg-surface-container text-on-surface focus:outline-none" />
      <div className="grid grid-cols-3 gap-2">
        <input value={totalPages} onChange={(e) => setTotalPages(e.target.value)} type="number" placeholder="Seiten"
          className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm bg-surface-container text-on-surface focus:outline-none" />
        <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date"
          className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm bg-surface-container text-on-surface focus:outline-none" />
        <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date"
          className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm bg-surface-container text-on-surface focus:outline-none" />
      </div>
      <label className="flex items-center gap-2 text-sm text-on-surface-variant">
        <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} className="rounded" />
        Abgeschlossen
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-medium disabled:opacity-50">
          {isPending ? 'Speichern…' : 'Speichern'}
        </button>
        <button type="button" onClick={onDone} className="px-4 py-1.5 text-on-surface-variant text-xs hover:text-on-surface">
          Abbrechen
        </button>
      </div>
    </form>
  )
}

export function ReadingPanel({ books, todayDate, recentLogs }: ReadingPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedBookId, setSelectedBookId] = useState(books.find((b) => !b.completed)?.id ?? '')
  const [pages, setPages] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [showBookForm, setShowBookForm] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  const activeBooks = books.filter((b) => !b.completed)
  const completedBooks = books.filter((b) => b.completed)

  function handleLogPages(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await logPages({ date: todayDate, bookId: selectedBookId, pagesRead: pages })
      if (result.error) setError(result.error)
      else { setSaved(true); setPages('') }
    })
  }

  function handleDeleteLog(id: string) {
    startTransition(async () => { await deleteLog(id) })
  }

  function handleDeleteBook(id: string) {
    if (!confirm('Buch und alle Leseeinträge löschen?')) return
    startTransition(async () => { await deleteBook(id) })
  }

  return (
    <div className="space-y-8">
      {/* Seiten erfassen */}
      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Heute erfassen</h2>
        <form onSubmit={handleLogPages} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Buch</label>
            <select value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)}
              className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm bg-surface-container text-on-surface focus:outline-none">
              <option value="">— wählen —</option>
              {activeBooks.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Seiten</label>
            <input type="number" min="1" value={pages} onChange={(e) => setPages(e.target.value)}
              placeholder="z.B. 32" required
              className="w-24 border border-surface-container-high rounded-lg px-3 py-1.5 text-sm bg-surface-container text-on-surface focus:outline-none" />
          </div>
          <button type="submit" disabled={isPending}
            className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {isPending ? '…' : 'Eintragen'}
          </button>
          {saved && <span className="text-sm text-on-surface-variant">Gespeichert ✓</span>}
          {error && <span className="text-sm text-error">{error}</span>}
        </form>
      </section>

      {/* Aktuelle Bücher */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Aktuelle Bücher</h2>
          <button onClick={() => { setEditingBook(null); setShowBookForm(true) }}
            className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
            + Neues Buch
          </button>
        </div>

        {(showBookForm && !editingBook) && (
          <div className="mb-4">
            <BookForm onDone={() => setShowBookForm(false)} />
          </div>
        )}

        <div className="space-y-2">
          {activeBooks.length === 0 && <p className="text-sm text-on-surface-variant">Keine aktiven Bücher</p>}
          {activeBooks.map((book) => {
            const progress = book.totalPages && book.pagesLogged
              ? Math.min(100, Math.round((book.pagesLogged / book.totalPages) * 100))
              : null
            return (
              <div key={book.id}>
                {editingBook?.id === book.id ? (
                  <BookForm book={editingBook} onDone={() => setEditingBook(null)} />
                ) : (
                  <div className="p-3 bg-surface-container rounded-xl border border-surface-container-high">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{book.title}</p>
                        {book.author && <p className="text-xs text-on-surface-variant">{book.author}</p>}
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {book.pagesLogged} {book.totalPages ? `/ ${book.totalPages}` : ''} Seiten
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setEditingBook(book)} className="text-xs text-on-surface-variant hover:text-on-surface">Bearbeiten</button>
                        <button onClick={() => handleDeleteBook(book.id)} className="text-xs text-on-surface-variant hover:text-error">Löschen</button>
                      </div>
                    </div>
                    {progress !== null && (
                      <div className="mt-2 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Letzte Einträge */}
      {recentLogs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Letzte Einträge</h2>
          <div className="space-y-1">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-3 py-2 bg-surface-container rounded-lg text-sm">
                <span className="text-on-surface-variant font-mono text-xs">{log.date}</span>
                <span className="text-on-surface">{log.bookTitle}</span>
                <div className="flex items-center gap-3">
                  <span className="text-on-surface-variant">{log.pagesRead} S.</span>
                  <button onClick={() => handleDeleteLog(log.id)}
                    className="text-on-surface-variant hover:text-error transition-colors" aria-label="Löschen">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0" }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Abgeschlossene Bücher */}
      {completedBooks.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
            Abgeschlossen ({completedBooks.length})
          </h2>
          <div className="space-y-1">
            {completedBooks.map((book) => (
              <div key={book.id} className="flex items-center justify-between px-3 py-2 bg-surface-container rounded-lg text-sm">
                <div>
                  <span className="text-on-surface">{book.title}</span>
                  {book.author && <span className="text-on-surface-variant ml-2 text-xs">{book.author}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant">{book.pagesLogged} S.</span>
                  <button onClick={() => setEditingBook(book)} className="text-xs text-on-surface-variant hover:text-on-surface">Bearbeiten</button>
                  <button onClick={() => handleDeleteBook(book.id)} className="text-xs text-on-surface-variant hover:text-error">Löschen</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
