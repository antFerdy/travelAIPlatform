import { Link } from 'react-router'

import { formatDateRange, formatNights, formatPrice } from '@/lib/format'
import { categoryLabel, type Tour } from '@/types/tour'

import { Badge } from '../ui/Badge'
import { TourImage } from './TourImage'

export type TourCardProps = {
  tour: Tour
  /** Приходит из справочника стран: в самом туре есть только countryId. */
  countryName?: string | undefined
}

export function TourCard({ tour, countryName }: TourCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/tours/${tour.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <TourImage src={tour.imageUrl} alt={countryName ? `${tour.title}, ${countryName}` : tour.title} />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-ink-500 text-sm">{countryName ?? '—'}</p>
          {tour.category ? <Badge tone="sand">{categoryLabel(tour.category)}</Badge> : null}
        </div>

        <h3 className="text-ink-900 text-base leading-snug font-semibold">
          <Link to={`/tours/${tour.id}`} className="hover:text-brand-700">
            {tour.title}
          </Link>
        </h3>

        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{formatNights(tour.durationDays)}</Badge>
        </div>

        <div className="mt-auto flex flex-col gap-1 pt-2">
          <p className="text-ink-500 text-xs">{formatDateRange(tour.startDate, tour.endDate)}</p>
          <p className="text-ink-900 text-lg font-semibold">
            {formatPrice(tour.price, tour.currency)}
          </p>
        </div>
      </div>
    </article>
  )
}
