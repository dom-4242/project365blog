import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('Footer')

  return (
    <footer className="border-t border-surface-container-high mt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-display font-bold text-on-surface">
          Project <span className="text-nutrition-600">365</span>
        </p>
        <div className="flex items-center gap-4">
          <p className="text-xs text-on-surface-variant tracking-wide">
            {t('tagline')}
          </p>
          <a
            href="/feed.xml"
            title={t('rssTitle')}
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-nutrition-600 hover:text-nutrition-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
            </svg>
            {t('rss')}
          </a>
        </div>
      </div>
    </footer>
  )
}
