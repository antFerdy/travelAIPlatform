import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

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
