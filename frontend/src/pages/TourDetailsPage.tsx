import { Link, useParams } from 'react-router'

import { PageContainer } from '@/components/layout/Layout'
import { TourImage } from '@/components/tours/TourImage'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { parseNumericParam, useCountryLookup, useTour } from '@/hooks/useTours'
import { ApiError } from '@/api'
import { formatDate, formatDateRange, formatNights, formatPrice } from '@/lib/format'
import { categoryLabel } from '@/types/tour'

export function TourDetailsPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const id = parseNumericParam(tourId)
  const { data: tour, isPending, isError, error, refetch } = useTour(id)
  const countryById = useCountryLookup()

  if (id === undefined) {
    return (
      <PageContainer className="py-8">
        <ErrorState title="Тур не найден" error={new ApiError(404, 'Некорректный адрес тура')} />
      </PageContainer>
    )
  }

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

  const countryName = countryById.get(tour.countryId)?.name

  return (
    <PageContainer className="py-8">
      <nav aria-label="Хлебные крошки" className="text-ink-500 mb-4 text-sm">
        <Link to="/tours" className="hover:text-brand-700">
          Туры
        </Link>
        {countryName ? (
          <>
            <span className="mx-2">/</span>
            <span className="text-ink-700">{countryName}</span>
          </>
        ) : null}
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
            <TourImage src={tour.imageUrl} alt={tour.title} loading="eager" />
          </div>

          <div className="flex flex-col gap-3">
            {countryName ? <p className="text-ink-500 text-sm">{countryName}</p> : null}
            <h1 className="text-ink-900 text-2xl font-semibold sm:text-3xl">{tour.title}</h1>

            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{formatNights(tour.durationDays)}</Badge>
              {tour.category ? <Badge tone="sand">{categoryLabel(tour.category)}</Badge> : null}
            </div>
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="text-ink-900 text-lg font-semibold">О туре</h2>
            <p className="text-ink-600 leading-relaxed">{tour.description}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-ink-900 text-lg font-semibold">Даты поездки</h2>
            <dl className="text-ink-600 flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Начало</dt>
                <dd>{formatDate(tour.startDate)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Окончание</dt>
                <dd>{formatDate(tour.endDate)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Длительность</dt>
                <dd>{formatNights(tour.durationDays)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div>
              <p className="text-ink-900 text-2xl font-semibold">
                {formatPrice(tour.price, tour.currency)}
              </p>
              <p className="text-ink-500 text-sm">стоимость тура</p>
            </div>

            <p className="text-ink-600 bg-brand-50 rounded-lg px-3 py-2 text-sm">
              {formatDateRange(tour.startDate, tour.endDate)}
            </p>

            <Link to={`/tours/${tour.id}/book`}>
              <Button size="lg" fullWidth>
                Забронировать
              </Button>
            </Link>

            <p className="text-ink-400 text-xs">
              Оплата на сайте не принимается. После заявки с вами свяжется менеджер.
            </p>
          </div>
        </aside>
      </div>
    </PageContainer>
  )
}
