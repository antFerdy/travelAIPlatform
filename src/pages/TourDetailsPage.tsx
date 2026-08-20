import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { PageContainer } from '@/components/layout/Layout'
import { TourImage } from '@/components/tours/TourImage'
import { Badge, RatingBadge, StarsBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { upcomingDepartures } from '@/domain/availability'
import { useTour } from '@/hooks/useTours'
import { cn } from '@/lib/cn'
import { formatDateRange, formatNights, formatPrice, formatSeatsLeft } from '@/lib/format'
import { MEAL_PLAN_LABELS } from '@/types/tour'

export function TourDetailsPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const navigate = useNavigate()
  const { data: tour, isPending, isError, error, refetch } = useTour(tourId)
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>()

  if (isPending) {
    return (
      <PageContainer className="flex flex-col gap-4 py-8">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </PageContainer>
    )
  }

  if (isError) {
    return (
      <PageContainer className="py-8">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  const departures = upcomingDepartures(tour)
  const selected = departures.find((departure) => departure.id === selectedDepartureId)

  const goToBooking = () => {
    const params = selected ? `?departureId=${selected.id}` : ''
    void navigate(`/tours/${tour.id}/book${params}`)
  }

  return (
    <PageContainer className="py-8">
      <nav aria-label="Хлебные крошки" className="text-ink-500 mb-4 text-sm">
        <Link to="/tours" className="hover:text-brand-700">
          Туры
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-700">{tour.country}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Gallery images={tour.images} alt={`${tour.city}, ${tour.country}`} />

          <div className="flex flex-col gap-3">
            <p className="text-ink-500 text-sm">
              {tour.country}, {tour.city}
            </p>
            <h1 className="text-ink-900 text-2xl font-semibold sm:text-3xl">{tour.title}</h1>

            <div className="flex flex-wrap items-center gap-3">
              <StarsBadge stars={tour.hotelStars} />
              <RatingBadge rating={tour.rating} reviewsCount={tour.reviewsCount} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{formatNights(tour.nights)}</Badge>
              <Badge tone="sand">{MEAL_PLAN_LABELS[tour.mealPlan]}</Badge>
            </div>
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="text-ink-900 text-lg font-semibold">О туре</h2>
            <p className="text-ink-600 leading-relaxed">{tour.description}</p>
          </section>

          {tour.includes.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-ink-900 text-lg font-semibold">Что включено</h2>
              <ul className="text-ink-600 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {tour.includes.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-brand-600" aria-hidden="true">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-ink-900 text-lg font-semibold">Выберите вылет</h2>

            {departures.length === 0 ? (
              <p className="text-ink-500 text-sm">
                Ближайших вылетов нет. Оставьте заявку — менеджер подберёт даты.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {departures.map((departure) => {
                  const isSelected = departure.id === selectedDepartureId
                  const soldOut = departure.seatsLeft === 0

                  return (
                    <li key={departure.id}>
                      <button
                        type="button"
                        disabled={soldOut}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedDepartureId(departure.id)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                          soldOut && 'cursor-not-allowed opacity-50',
                          isSelected
                            ? 'border-brand-600 bg-brand-50'
                            : 'border-ink-200 bg-white hover:border-brand-300',
                        )}
                      >
                        <span className="text-ink-800 text-sm font-medium">
                          {formatDateRange(departure.startDate, departure.endDate)}
                        </span>
                        <span
                          className={cn(
                            'text-xs',
                            soldOut
                              ? 'text-ink-400'
                              : departure.seatsLeft <= 4
                                ? 'text-red-600'
                                : 'text-ink-500',
                          )}
                        >
                          {soldOut ? 'мест нет' : formatSeatsLeft(departure.seatsLeft)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div>
              <p className="text-ink-900 text-2xl font-semibold">
                {formatPrice(tour.pricePerPerson)}
              </p>
              <p className="text-ink-500 text-sm">за одного гостя</p>
            </div>

            {selected ? (
              <p className="text-ink-600 bg-brand-50 rounded-lg px-3 py-2 text-sm">
                Вылет {formatDateRange(selected.startDate, selected.endDate)}
              </p>
            ) : (
              <p className="text-ink-500 text-sm">Выберите дату вылета слева или на следующем шаге.</p>
            )}

            <Button size="lg" fullWidth onClick={goToBooking}>
              Забронировать
            </Button>

            <p className="text-ink-400 text-xs">
              Оплата на сайте не принимается. После заявки с вами свяжется менеджер.
            </p>
          </div>
        </aside>
      </div>
    </PageContainer>
  )
}

function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)
  const cover = images[active] ?? images[0] ?? ''

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl">
        <TourImage src={cover} alt={alt} loading="eager" />
      </div>

      {images.length > 1 ? (
        <div className="flex gap-3">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`Показать фото ${index + 1}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
              className={cn(
                'h-20 w-28 overflow-hidden rounded-lg ring-2 transition-all',
                index === active ? 'ring-brand-600' : 'ring-transparent hover:ring-brand-300',
              )}
            >
              <TourImage src={image} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
