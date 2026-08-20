import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { plural } from '@/lib/format'

type BadgeTone = 'neutral' | 'brand' | 'sand' | 'alert'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-50 text-brand-800',
  sand: 'bg-sand-100 text-sand-700',
  alert: 'bg-red-50 text-red-700',
}

export type BadgeProps = {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Рейтинг числом — компактнее пяти звёзд и не врёт при 4.6. */
export function RatingBadge({ rating, reviewsCount }: { rating: number; reviewsCount: number }) {
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span className="bg-brand-700 rounded-md px-1.5 py-0.5 font-semibold text-white">
        {rating.toFixed(1)}
      </span>
      <span className="text-ink-500">{reviewsCount} отзывов</span>
    </span>
  )
}

export function StarsBadge({ stars }: { stars: number }) {
  // Звёзды декоративны: скринридер получает подпись, а не пять одинаковых
  // символов, из которых непонятно, сколько из них закрашено.
  return (
    <span role="img" aria-label={`Отель ${stars} ${plural(stars, ['звезда', 'звезды', 'звёзд'])}`}>
      <span className="text-sand-500 text-sm" aria-hidden="true">
        {'★'.repeat(stars)}
        <span className="text-ink-300">{'★'.repeat(5 - stars)}</span>
      </span>
    </span>
  )
}
