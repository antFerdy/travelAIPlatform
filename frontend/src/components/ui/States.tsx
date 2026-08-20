import type { ReactNode } from 'react'

import { ApiError } from '@/api'
import { cn } from '@/lib/cn'

import { Button } from './Button'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-ink-200 animate-pulse rounded-lg', className)} aria-hidden="true" />
}

export function TourCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    </div>
  )
}

export type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">
        🧭
      </span>
      <h2 className="text-ink-800 text-lg font-semibold">{title}</h2>
      {description ? <p className="text-ink-500 max-w-md text-sm">{description}</p> : null}
      {action}
    </div>
  )
}

export type ErrorStateProps = {
  title?: string
  error: unknown
  onRetry?: () => void
}

export function ErrorState({ title = 'Не удалось загрузить данные', error, onRetry }: ErrorStateProps) {
  // У ApiError есть формулировка для пользователя: технический текст 500-й
  // или сетевого сбоя показывать незачем.
  const message =
    error instanceof ApiError
      ? error.userMessage
      : error instanceof Error
        ? error.message
        : 'Неизвестная ошибка'

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-16 text-center"
    >
      <span className="text-4xl" aria-hidden="true">
        ⚠️
      </span>
      <h2 className="text-ink-800 text-lg font-semibold">{title}</h2>
      <p className="text-ink-500 max-w-md text-sm">{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Попробовать снова
        </Button>
      ) : null}
    </div>
  )
}
