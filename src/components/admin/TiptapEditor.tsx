'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import { clsx } from 'clsx'
import { Icon } from '@/components/ui/Icon'

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={clsx(
        'p-1.5 rounded text-sm transition-colors',
        active
          ? 'bg-surface-container-high text-on-surface'
          : 'text-on-surface-variant hover:bg-surface-container hover:bg-surface-container-high hover:text-on-surface'
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-surface-container-high mx-1" />
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? 'Schreibe deinen Eintrag...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          class: 'text-nutrition-700 underline',
        },
      }),
      Typography,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[360px] px-4 py-4',
      },
    },
  })

  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('URL eingeben:')
    if (!url) return
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="border border-surface-container-high rounded-xl overflow-hidden bg-surface-container focus-within:border-on-surface-variant transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-surface-container bg-surface-container">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Fett (⌘B)"
        >
          <Icon name="format_bold" size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Kursiv (⌘I)"
        >
          <Icon name="format_italic" size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Überschrift 2"
        >
          <Icon name="format_h2" size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Überschrift 3"
        >
          <Icon name="format_h3" size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Liste"
        >
          <Icon name="format_list_bulleted" size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Nummerierte Liste"
        >
          <Icon name="format_list_numbered" size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Zitat"
        >
          <Icon name="format_quote" size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={addLink}
          active={editor.isActive('link')}
          title="Link einfügen"
        >
          <Icon name="link" size={18} />
        </ToolbarButton>

        {editor.isActive('link') && (
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Link entfernen"
          >
            <Icon name="link_off" size={18} />
          </ToolbarButton>
        )}

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Trennlinie"
        >
          <Icon name="horizontal_rule" size={18} />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-stone prose-lg prose-invert max-w-none [&_.tiptap]:focus:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-on-surface-variant [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  )
}
