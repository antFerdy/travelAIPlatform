import { Link, useParams } from 'react-router'

import { PageContainer } from '@/components/layout/Layout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { ApiError } from '@/api'
import { parseNumericParam, useBooking, useCountryLookup, useTour } from '@/hooks/useTours'
import { formatDateRange, formatPeople, formatPrice } from '@/lib/format'
import { BOOKING_STATUS_LABELS } from '@/types/booking'

export function BookingSuccessPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const booking = useBooking(parseNumericParam(bookingId))
  const tour = useTour(booking.data?.tourId)
  const countryById = useCountryLookup()

  if (bookingId !== undefined && parseNumericParam(bookingId) === undefined) {
    return (
      <PageContainer className="py-16">
        <ErrorState title="Бронь не найдена" error={new ApiError(404, 'Некорректный номер брони')} />
      </PageContainer>
    )
  }

  if (booking.isPending) {
    return (
      <PageContainer className="flex flex-col gap-4 py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    )
  }

  if (booking.isError) {
    return (
      <PageContainer className="py-16">
        <ErrorState
          title="Бронь не найдена"
          error={booking.error}
          onRetry={() => void booking.refetch()}
        />
      </PageContainer>
    )
  }

  const countryName = tour.data ? countryById.get(tour.data.countryId)?.name : undefined

  return (
    <PageContainer className="py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-5xl" aria-hidden="true">
            ✅
          </span>
          <h1 className="text-ink-900 text-2xl font-semibold sm:text-3xl">Бронь принята</h1>
          <p className="text-ink-500">
            Номер брони <strong className="text-ink-900">№{booking.data.id}</strong>. Детали
            отправлены на {booking.data.customerEmail}.
          </p>
          <Badge tone="sand">{BOOKING_STATUS_LABELS[booking.data.status]}</Badge>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <dl className="flex flex-col gap-3">
            <Row label="Тур" value={tour.data?.title ?? '—'} />
            <Row label="Направление" value={countryName ?? '—'} />
            <Row
              label="Даты"
              value={tour.data ? formatDateRange(tour.data.startDate, tour.data.endDate) : '—'}
            />
            <Row label="Человек" value={formatPeople(booking.data.numPeople)} />
            <Row label="Заказчик" value={booking.data.customerName} />
            <Row label="Телефон" value={booking.data.customerPhone} />

            {tour.data ? (
              <div className="border-ink-200 flex items-baseline justify-between border-t pt-3">
                <dt className="text-ink-700 font-medium">Стоимость тура</dt>
                <dd className="text-ink-900 text-xl font-semibold">
                  {formatPrice(tour.data.price, tour.data.currency)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <p className="text-ink-600 bg-brand-50 rounded-xl px-4 py-3 text-sm">
          Оплата не требуется. Менеджер свяжется с вами в течение рабочего дня, подтвердит бронь и
          назовёт итоговую сумму на {formatPeople(booking.data.numPeople)}.
        </p>

        <div className="flex justify-center">
          <Link to="/tours">
            <Button variant="secondary">Смотреть другие туры</Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-500 text-sm">{label}</dt>
      <dd className="text-ink-800 text-right text-sm font-medium">{value}</dd>
    </div>
  )
}
