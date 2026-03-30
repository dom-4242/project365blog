'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface FlashMessageProps {
  message: string
  type?: 'success' | 'error'
}

export function FlashMessage({ message, type = 'success' }: FlashMessageProps) {
  const [visible, setVisible] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Auto-dismiss after 4 seconds and clean the URL param
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      router.replace(pathname)
    }, 4000)
    return () => clearTimeout(t)
  }, [router, pathname])

  const dismiss = () => {
    setVisible(false)
    router.replace(pathname)
  }

  if (!visible) return null

  const styles =
    type === 'success'
      ? 'bg-movement-100 dark:bg-movement-600/10 border-movement-200 dark:border-movement-600/20 text-movement-800 dark:text-movement-300'
      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'

  const icon = type === 'success' ? '✓' : '✕'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 px-4 py-3 mb-5 rounded-xl border text-sm font-medium ${styles}`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true">{icon}</span>
        {message}
      </div>
      <button
        onClick={dismiss}
        aria-label="Meldung schließen"
        className="opacity-60 hover:opacity-100 transition-opacity text-base leading-none"
      >
        ×
      </button>
    </div>
  )
}
