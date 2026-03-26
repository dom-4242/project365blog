import Link from 'next/link'

export function Navigation() {
  return (
    <nav>
      <ul className="flex gap-6">
        <li>
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Start
          </Link>
        </li>
        <li>
          <Link href="/journal" className="text-gray-600 hover:text-gray-900">
            Journal
          </Link>
        </li>
      </ul>
    </nav>
  )
}
