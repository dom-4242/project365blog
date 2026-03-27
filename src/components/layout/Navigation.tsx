import Link from 'next/link'

export function Navigation() {
  return (
    <nav aria-label="Hauptnavigation">
      <Link
        href="/"
        className="text-sm font-medium text-sand-500 hover:text-[#1a1714] transition-colors"
      >
        Journal
      </Link>
    </nav>
  )
}
