import Image from 'next/image'

interface BannerImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
}

/**
 * next/image wrapper that sets unoptimized for SVGs.
 * The Next.js image optimizer cannot process SVGs and returns 400 for them.
 */
export function BannerImage({ src, alt, className, priority, sizes }: BannerImageProps) {
  const isSvg = src.toLowerCase().endsWith('.svg')
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      priority={priority}
      sizes={sizes}
      unoptimized={isSvg}
    />
  )
}
