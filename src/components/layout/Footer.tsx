export function Footer() {
  return (
    <footer className="border-t border-sand-200 dark:border-[#4a4540] mt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-display font-bold text-[#1a1714] dark:text-[#faf9f7]">
          Project <span className="text-nutrition-600">365</span>
        </p>
        <p className="text-xs text-sand-400 tracking-wide">
          365 Tage · Öffentlich · Ehrlich
        </p>
      </div>
    </footer>
  )
}
