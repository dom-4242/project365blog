import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'

export function Footer() {
  const t = useTranslations('Footer')

  return (
    <footer className="border-t border-outline-variant/15 mt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-headline font-bold tracking-tighter text-on-surface">
          PROJECT <span className="text-primary">365</span>
        </p>

        <div className="flex items-center gap-6">
          <p className="text-xs font-label text-on-surface-variant tracking-widest uppercase">
            {t('tagline')}
          </p>
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
    </footer>
  )
}
