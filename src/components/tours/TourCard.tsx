import { Link } from 'react-router'

import { nearestDeparture } from '@/domain/availability'
import { formatDateShort, formatNights, formatPrice, formatSeatsLeft } from '@/lib/format'
import { MEAL_PLAN_LABELS, type Tour } from '@/types/tour'

import { Badge, RatingBadge, StarsBadge } from '../ui/Badge'
import { TourImage } from './TourImage'

export type TourCardProps = {
  tour: Tour
}

const LOW_SEATS_THRESHOLD = 4

export function TourCard({ tour }: TourCardProps) {
  const departure = nearestDeparture(tour)
  const cover = tour.images[0] ?? ''

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/tours/${tour.id}`} className="block aspect-[4/3] overflow-hidden">
        <TourImage src={cover} alt={`${tour.city}, ${tour.country}`} />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-ink-500 text-sm">
            {tour.country}, {tour.city}
          </p>
          <StarsBadge stars={tour.hotelStars} />
        </div>

        <h3 className="text-ink-900 text-base leading-snug font-semibold">
          <Link to={`/tours/${tour.id}`} className="hover:text-brand-700">
            {tour.title}
          </Link>
        </h3>

        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{formatNights(tour.nights)}</Badge>
          <Badge tone="sand">{MEAL_PLAN_LABELS[tour.mealPlan]}</Badge>
        </div>

        <RatingBadge rating={tour.rating} reviewsCount={tour.reviewsCount} />

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {departure ? (
              <p className="text-ink-500 text-xs">
                вылет {formatDateShort(departure.startDate)}
                {departure.seatsLeft <= LOW_SEATS_THRESHOLD ? (
                  <span className="ml-1 text-red-600">· {formatSeatsLeft(departure.seatsLeft)}</span>
                ) : null}
              </p>
            ) : (
              <p className="text-ink-400 text-xs">нет ближайших вылетов</p>
            )}
            <p className="text-ink-900 text-lg font-semibold">{formatPrice(tour.pricePerPerson)}</p>
            <p className="text-ink-400 text-xs">за одного гостя</p>
          </div>
        </div>
      </div>
    </article>
  )
}
