import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'

export function Footer() {
  const t = useTranslations('Footer')
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#0e0e0e] border-t border-outline-variant/15 mt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Main row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

          {/* Logo */}
          <p className="font-headline font-black tracking-tighter text-lg text-on-surface">
            PROJECT <span className="text-primary">365</span>
          </p>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="/feed.xml"
              title={t('rssTitle')}
              className="flex items-center gap-1.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
            >
              <Icon name="rss_feed" size={14} />
              {t('rss')}
            </a>
          </div>

        </div>

        {/* Bottom row */}
        <div className="mt-8 pt-6 border-t border-outline-variant/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs font-label tracking-widest uppercase text-on-surface-variant">
            {t('tagline')}
          </p>
          <p className="text-xs text-on-surface-variant">
            © {year} Dom · project365.dom42.ch
          </p>
        </div>

      </div>
    </footer>
  )
}
