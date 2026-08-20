import { Link } from 'react-router'

import { PageContainer } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <PageContainer className="py-24">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-5xl" aria-hidden="true">
          🗺️
        </span>
        <h1 className="text-ink-900 text-2xl font-semibold">Такой страницы нет</h1>
        <p className="text-ink-500 max-w-md">
          Возможно, тур сняли с продажи или в ссылке опечатка.
        </p>
        <Link to="/tours">
          <Button>Вернуться к турам</Button>
        </Link>
      </div>
    </PageContainer>
  )
}
