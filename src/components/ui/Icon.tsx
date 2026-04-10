/**
 * Material Symbols Outlined icon component.
 *
 * Usage:
 *   <Icon name="search" />
 *   <Icon name="close" size={20} fill />
 *   <Icon name="format_bold" className="text-primary" />
 *
 * Icon names: https://fonts.google.com/icons
 */

interface IconProps {
  /** Material Symbols ligature name, e.g. "search", "close", "format_bold" */
  name: string
  /** Font size in px (also controls optical size). Default: 20 */
  size?: number
  /** Render filled variant (FILL=1). Default: false (outlined) */
  fill?: boolean
  /** Additional Tailwind / CSS classes */
  className?: string
  'aria-hidden'?: boolean
  'aria-label'?: string
}

export function Icon({
  name,
  size = 20,
  fill = false,
  className,
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}: IconProps) {
  const opsz = Math.min(Math.max(size, 20), 48)
  return (
    <span
      className={`material-symbols-outlined select-none leading-none${className ? ` ${className}` : ''}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${opsz}`,
      }}
      aria-hidden={ariaHidden || undefined}
      aria-label={ariaLabel}
    >
      {name}
    </span>
  )
}
