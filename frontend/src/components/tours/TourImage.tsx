import { useState } from 'react'

import { cn } from '@/lib/cn'

const PLACEHOLDER = '/tour-placeholder.svg'

export type TourImageProps = {
  /** image_url у бэкенда необязателен — тогда сразу показываем заглушку. */
  src?: string | undefined
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

/**
 * Картинки каталога лежат на внешнем хосте. Если его нет или ссылка не задана,
 * показываем локальную заглушку — приложение не должно выглядеть сломанным.
 *
 * Запоминаем именно упавший адрес, а не факт падения: один элемент может
 * переиспользоваться под разные фото, и флаг «сломалось» залипал бы.
 *
 * Изображение позиционируется абсолютно: `h-full` внутри контейнера
 * с aspect-ratio разрешается ненадёжно. Родителю нужен `relative`.
 */
export function TourImage({ src, alt, className, loading = 'lazy' }: TourImageProps) {
  const [failedSrc, setFailedSrc] = useState<string>()

  const resolved = !src || failedSrc === src ? PLACEHOLDER : src

  return (
    <img
      src={resolved}
      alt={alt}
      loading={loading}
      onError={() => src && setFailedSrc(src)}
      className={cn('bg-brand-100 absolute inset-0 h-full w-full object-cover', className)}
    />
  )
}
