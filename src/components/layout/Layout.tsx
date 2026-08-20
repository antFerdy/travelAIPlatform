import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'

import { cn } from '@/lib/cn'

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>{children}</div>
}

export function Header() {
  return (
    <header className="border-ink-200 sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <PageContainer className="flex h-16 items-center justify-between">
        <Link to="/tours" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            🌊
          </span>
          <span className="text-ink-900 text-lg font-semibold">Дальний берег</span>
        </Link>

        <nav aria-label="Основная навигация">
          <NavLink
            to="/tours"
            className={({ isActive }) =>
              cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:text-ink-900',
              )
            }
          >
            Все туры
          </NavLink>
        </nav>
      </PageContainer>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-ink-200 mt-16 border-t bg-white">
      <PageContainer className="text-ink-500 flex flex-col gap-2 py-8 text-sm">
        <p className="text-ink-700 font-medium">Дальний берег</p>
        <p>
          Учебный проект. Оплата на сайте не принимается — бронь подтверждает менеджер по телефону.
        </p>
      </PageContainer>
    </footer>
  )
}
