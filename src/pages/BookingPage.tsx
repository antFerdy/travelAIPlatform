import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { z } from 'zod'

import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { PageContainer } from '@/components/layout/Layout'
import { TourImage } from '@/components/tours/TourImage'
import { Button } from '@/components/ui/Button'
import { InputField, SelectField, TextareaField } from '@/components/ui/Field'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { upcomingDepartures } from '@/domain/availability'
import { useCreateBooking, useTour } from '@/hooks/useTours'
import { formatDateRange, formatNights, formatPrice } from '@/lib/format'
import { MAX_GUESTS, MIN_GUESTS } from '@/types/booking'

const bookingFormSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя и фамилию'),
  email: z.string().trim().email('Проверьте адрес — на него придёт подтверждение'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{10,20}$/, 'Телефон в формате +7 701 000 00 00'),
  departureId: z.string().min(1, 'Выберите дату вылета'),
  // Приведение делает react-hook-form через valueAsNumber, поэтому здесь
  // ожидается уже число: z.coerce размыл бы входной тип формы до unknown.
  guests: z.number().int().min(MIN_GUESTS).max(MAX_GUESTS),
  comment: z.string().trim().max(500, 'Не более 500 символов').optional(),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

export function BookingPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const { data: tour, isPending, isError, error, refetch } = useTour(tourId)
  const createBooking = useCreateBooking()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      departureId: searchParams.get('departureId') ?? '',
      guests: 2,
      comment: '',
    },
  })

  // useWatch вместо watch(): подписка мемоизируется и не ломает React Compiler.
  const guests = useWatch({ control, name: 'guests' }) || MIN_GUESTS
  const departureId = useWatch({ control, name: 'departureId' })

  if (isPending) {
    return (
      <PageContainer className="flex flex-col gap-4 py-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-96 w-full" />
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
  const selected = departures.find((departure) => departure.id === departureId)
  const notEnoughSeats = selected !== undefined && selected.seatsLeft < guests

  const onSubmit = handleSubmit(async (values) => {
    try {
      const booking = await createBooking.mutateAsync({
        tourId: tour.id,
        departureId: values.departureId,
        guests: values.guests,
        customer: { name: values.name, email: values.email, phone: values.phone },
        ...(values.comment ? { comment: values.comment } : {}),
      })

      void navigate(`/bookings/${booking.id}`)
    } catch {
      // Отказ уже отражён через createBooking.isError, а введённые данные
      // остаются в форме. Пробрасывать дальше нечего — иначе это необработанный
      // промис, который валит тесты и засоряет консоль пользователю.
    }
  })

  return (
    <PageContainer className="py-8">
      <nav aria-label="Хлебные крошки" className="text-ink-500 mb-4 text-sm">
        <Link to="/tours" className="hover:text-brand-700">
          Туры
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/tours/${tour.id}`} className="hover:text-brand-700">
          {tour.title}
        </Link>
      </nav>

      <h1 className="text-ink-900 mb-6 text-2xl font-semibold sm:text-3xl">Бронирование</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <legend className="text-ink-900 px-1 text-lg font-semibold">Контакты</legend>

            <InputField
              label="Имя и фамилия"
              autoComplete="name"
              placeholder="Айгерим Сериковна"
              error={errors.name?.message}
              {...register('name')}
            />

            <InputField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.kz"
              error={errors.email?.message}
              {...register('email')}
            />

            <InputField
              label="Телефон"
              type="tel"
              autoComplete="tel"
              placeholder="+7 701 000 00 00"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <legend className="text-ink-900 px-1 text-lg font-semibold">Поездка</legend>

            <SelectField
              label="Дата вылета"
              error={errors.departureId?.message}
              {...register('departureId')}
            >
              <option value="">Выберите вылет</option>
              {departures.map((departure) => (
                <option key={departure.id} value={departure.id} disabled={departure.seatsLeft === 0}>
                  {formatDateRange(departure.startDate, departure.endDate)}
                  {departure.seatsLeft === 0 ? ' — мест нет' : ''}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Гостей"
              error={errors.guests?.message}
              {...(notEnoughSeats
                ? { hint: `На этот вылет осталось мест: ${selected.seatsLeft}` }
                : {})}
              {...register('guests', { valueAsNumber: true })}
            >
              {Array.from(
                { length: MAX_GUESTS - MIN_GUESTS + 1 },
                (_, index) => index + MIN_GUESTS,
              ).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </SelectField>

            <TextareaField
              label="Комментарий"
              rows={3}
              placeholder="Пожелания по номеру, трансферу, питанию"
              error={errors.comment?.message}
              {...register('comment')}
            />
          </fieldset>

          {notEnoughSeats ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              На выбранный вылет осталось мест: {selected.seatsLeft}. Уменьшите число гостей или
              выберите другую дату.
            </p>
          ) : null}

          {createBooking.isError ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {createBooking.error instanceof Error
                ? createBooking.error.message
                : 'Не удалось создать бронь'}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={isSubmitting || notEnoughSeats}>
            {isSubmitting ? 'Отправляем…' : 'Забронировать без оплаты'}
          </Button>
        </form>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="relative aspect-[16/9]">
              <TourImage src={tour.images[0] ?? ''} alt={`${tour.city}, ${tour.country}`} />
            </div>
            <div className="flex flex-col gap-1 p-4">
              <p className="text-ink-500 text-sm">
                {tour.country}, {tour.city}
              </p>
              <p className="text-ink-900 font-semibold">{tour.title}</p>
              <p className="text-ink-500 text-sm">
                {formatNights(tour.nights)} · {formatPrice(tour.pricePerPerson)} за гостя
              </p>
              {selected ? (
                <p className="text-ink-600 mt-1 text-sm">
                  {formatDateRange(selected.startDate, selected.endDate)}
                </p>
              ) : null}
            </div>
          </div>

          <PriceBreakdown pricePerPerson={tour.pricePerPerson} guests={guests} />
        </aside>
      </div>
    </PageContainer>
  )
}
