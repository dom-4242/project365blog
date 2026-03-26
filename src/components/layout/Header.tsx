import Link from 'next/link'
import { Navigation } from './Navigation'

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Project 365
        </Link>
        <Navigation />
      </div>
    </header>
  )
}
