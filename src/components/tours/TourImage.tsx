import { useState } from 'react'

import { cn } from '@/lib/cn'

const PLACEHOLDER = '/tour-placeholder.svg'

export type TourImageProps = {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

/**
 * Картинки каталога лежат на внешнем хосте. Если он недоступен, показываем
 * локальную заглушку — приложение не должно выглядеть сломанным без сети.
 */
export function TourImage({ src, alt, className, loading = 'lazy' }: TourImageProps) {
  const [failed, setFailed] = useState(false)

  return (
    <img
      src={failed ? PLACEHOLDER : src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={cn('bg-brand-100 h-full w-full object-cover', className)}
    />
  )
}
