export function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-16">
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>Project 365 — {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
