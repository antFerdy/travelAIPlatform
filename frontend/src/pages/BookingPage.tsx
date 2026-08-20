import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { z } from 'zod'

import { PageContainer } from '@/components/layout/Layout'
import { TourImage } from '@/components/tours/TourImage'
import { Button } from '@/components/ui/Button'
import { InputField, SelectField } from '@/components/ui/Field'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { ApiError } from '@/api'
import { parseNumericParam, useCountryLookup, useCreateBooking, useTour } from '@/hooks/useTours'
import { formatDateRange, formatNights, formatPrice } from '@/lib/format'
import { MAX_PEOPLE, MIN_PEOPLE } from '@/types/booking'

/**
 * Валидация повторяет требования `POST /api/v1/bookings`: имя и телефон
 * непустые, email — настоящий адрес, число человек больше нуля. Сервер
 * проверяет то же самое и отвечает 422; здесь мы просто не тратим на это запрос.
 */
const bookingFormSchema = z.object({
  customerName: z.string().trim().min(2, 'Укажите имя и фамилию'),
  customerEmail: z.string().trim().email('Проверьте адрес — на него придёт подтверждение'),
  customerPhone: z.string().trim().min(5, 'Укажите номер, по которому с вами свяжутся'),
  // Приведение делает react-hook-form через valueAsNumber, поэтому здесь
  // ожидается уже число: z.coerce размыл бы входной тип формы до unknown.
  numPeople: z.number().int().min(MIN_PEOPLE).max(MAX_PEOPLE),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

export function BookingPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const id = parseNumericParam(tourId)
  const navigate = useNavigate()

  const { data: tour, isPending, isError, error, refetch } = useTour(id)
  const countryById = useCountryLookup()
  const createBooking = useCreateBooking()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      numPeople: 2,
    },
  })

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

  const countryName = countryById.get(tour.countryId)?.name

  const onSubmit = handleSubmit(async (values) => {
    try {
      const booking = await createBooking.mutateAsync({
        tourId: tour.id,
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        numPeople: values.numPeople,
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
              error={errors.customerName?.message}
              {...register('customerName')}
            />

            <InputField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.kz"
              error={errors.customerEmail?.message}
              {...register('customerEmail')}
            />

            <InputField
              label="Телефон"
              type="tel"
              autoComplete="tel"
              placeholder="+7 701 000 00 00"
              error={errors.customerPhone?.message}
              {...register('customerPhone')}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <legend className="text-ink-900 px-1 text-lg font-semibold">Поездка</legend>

            <SelectField
              label="Сколько человек"
              error={errors.numPeople?.message}
              {...register('numPeople', { valueAsNumber: true })}
            >
              {Array.from(
                { length: MAX_PEOPLE - MIN_PEOPLE + 1 },
                (_, index) => index + MIN_PEOPLE,
              ).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </SelectField>

            <p className="text-ink-500 text-sm">
              Даты поездки заданы туром: {formatDateRange(tour.startDate, tour.endDate)}.
            </p>
          </fieldset>

          {createBooking.isError ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {createBooking.error instanceof Error
                ? createBooking.error.message
                : 'Не удалось создать бронь'}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Отправляем…' : 'Забронировать без оплаты'}
          </Button>
        </form>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="relative aspect-[16/9]">
              <TourImage src={tour.imageUrl} alt={tour.title} />
            </div>
            <div className="flex flex-col gap-1 p-4">
              {countryName ? <p className="text-ink-500 text-sm">{countryName}</p> : null}
              <p className="text-ink-900 font-semibold">{tour.title}</p>
              <p className="text-ink-500 text-sm">{formatNights(tour.durationDays)}</p>
              <p className="text-ink-600 mt-1 text-sm">
                {formatDateRange(tour.startDate, tour.endDate)}
              </p>
              <p className="text-ink-900 mt-2 text-xl font-semibold">
                {formatPrice(tour.price, tour.currency)}
              </p>
              <p className="text-ink-400 text-xs">
                Стоимость тура по данным каталога. Итог по числу человек подтвердит менеджер —
                сервер бронирования сумму не рассчитывает.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </PageContainer>
  )
}
