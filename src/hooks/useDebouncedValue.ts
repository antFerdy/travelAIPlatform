import { useEffect, useState } from 'react'

/**
 * Отложенное значение. Нужно, чтобы ввод цены не переписывал строку запроса
 * на каждое нажатие клавиши.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)

    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
