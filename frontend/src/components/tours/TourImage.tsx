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
 *
 * Изображение позиционируется абсолютно: `h-full` внутри контейнера с
 * aspect-ratio разрешается ненадёжно, и фото оказывалось ниже рамки карточки.
 * Родитель обязан иметь `relative` и заданный размер.
 */
export function TourImage({ src, alt, className, loading = 'lazy' }: TourImageProps) {
  // Запоминаем именно упавший адрес, а не факт падения: галерея переиспользует
  // один и тот же элемент, и флаг «сломалось» залипал бы на рабочих кадрах.
  const [failedSrc, setFailedSrc] = useState<string>()

  return (
    <img
      src={failedSrc === src ? PLACEHOLDER : src}
      alt={alt}
      loading={loading}
      onError={() => setFailedSrc(src)}
      className={cn('bg-brand-100 absolute inset-0 h-full w-full object-cover', className)}
    />
  )
}
