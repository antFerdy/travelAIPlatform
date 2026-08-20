import { GROUP_DISCOUNT_THRESHOLD, calculateTotal } from '@/domain/pricing'
import { formatGuests, formatPrice } from '@/lib/format'

export type PriceBreakdownProps = {
  pricePerPerson: number
  guests: number
}

export function PriceBreakdown({ pricePerPerson, guests }: PriceBreakdownProps) {
  const { base, discount, discountRate, total } = calculateTotal({ pricePerPerson, guests })

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm">
      <Row label={`${formatPrice(pricePerPerson)} × ${formatGuests(guests)}`} value={formatPrice(base)} />

      {discount > 0 ? (
        <Row
          label={`Скидка за группу от ${GROUP_DISCOUNT_THRESHOLD} гостей — ${Math.round(discountRate * 100)}%`}
          value={`− ${formatPrice(discount)}`}
          tone="discount"
        />
      ) : null}

      <div className="border-ink-200 mt-1 flex items-baseline justify-between border-t pt-3">
        <span className="text-ink-700 font-medium">Итого</span>
        {/* <output> — семантика вычисленного результата: роль status, значение
            озвучивается при пересчёте и однозначно находится в тестах. */}
        <output aria-label="Итого к оплате" className="text-ink-900 text-xl font-semibold">
          {formatPrice(total)}
        </output>
      </div>

      <p className="text-ink-400 text-xs">
        Сумма справочная. Оплата на сайте не принимается — бронь подтверждает менеджер.
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'discount'
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className={tone === 'discount' ? 'text-brand-700' : 'text-ink-500'}>{label}</span>
      <span className={tone === 'discount' ? 'text-brand-700' : 'text-ink-800'}>{value}</span>
    </div>
  )
}
