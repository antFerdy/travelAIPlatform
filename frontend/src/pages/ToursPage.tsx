import { PageContainer } from '@/components/layout/Layout'
import { TourCard } from '@/components/tours/TourCard'
import { TourFilters } from '@/components/tours/TourFilters'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, TourCardSkeleton } from '@/components/ui/States'
import { useTourFilters } from '@/hooks/useTourFilters'
import { useCountries, useTours } from '@/hooks/useTours'
import { plural } from '@/lib/format'

export function ToursPage() {
  const { filters, setFilters, resetFilters, activeCount } = useTourFilters()
  const countries = useCountries()
  const tours = useTours(filters)

  const items = tours.data?.pages.flatMap((page) => page.items) ?? []
  const total = tours.data?.pages[0]?.total ?? 0

  return (
    <PageContainer className="py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-ink-900 text-2xl font-semibold sm:text-3xl">Туры</h1>
        <p className="text-ink-500 text-sm">
          Подберите поездку по стране, бюджету и датам вылета. Бронь — без оплаты на сайте.
        </p>
      </div>

      <TourFilters
        filters={filters}
        countries={countries.data ?? []}
        activeCount={activeCount}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <div className="mt-8">
        {tours.isPending ? (
          <ToursGridShell>
            {Array.from({ length: 6 }, (_, index) => (
              <TourCardSkeleton key={index} />
            ))}
          </ToursGridShell>
        ) : tours.isError ? (
          <ErrorState error={tours.error} onRetry={() => void tours.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Под эти условия туров нет"
            description="Попробуйте расширить диапазон цен или сдвинуть даты вылета."
            action={
              activeCount > 0 ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="text-ink-500 mb-4 text-sm" aria-live="polite">
              {total} {plural(total, ['тур', 'тура', 'туров'])}
            </p>

            <ToursGridShell>
              {items.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </ToursGridShell>

            {tours.hasNextPage ? (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={tours.isFetchingNextPage}
                  onClick={() => void tours.fetchNextPage()}
                >
                  {tours.isFetchingNextPage ? 'Загружаем…' : 'Показать ещё'}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PageContainer>
  )
}

function ToursGridShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  )
}
