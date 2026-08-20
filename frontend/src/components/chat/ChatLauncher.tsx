import type { ReactElement, RefObject } from 'react'

import { cn } from '@/lib/cn'

export type ChatLauncherProps = {
  open: boolean
  onClick: () => void
  buttonRef: RefObject<HTMLButtonElement | null>
}

/** Круглая кнопка в правом нижнем углу — единственная точка входа в чат. */
export function ChatLauncher({ open, onClick, buttonRef }: ChatLauncherProps): ReactElement {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={open ? 'Свернуть чат с ИИ-помощником' : 'Открыть чат с ИИ-помощником'}
      aria-expanded={open}
      className={cn(
        'bg-brand-700 hover:bg-brand-800 fixed right-5 bottom-5 z-30 flex h-14 w-14',
        'items-center justify-center rounded-full text-white shadow-lg transition-colors',
        // На узком экране окно занимает всё пространство — кнопка под ним не нужна.
        open && 'max-sm:hidden',
      )}
    >
      {open ? <CloseIcon /> : <BotIcon />}
    </button>
  )
}

function BotIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M12 3v3" />
      <circle cx="12" cy="2.5" r="1" fill="currentColor" stroke="none" />
      <rect x="4" y="6" width="16" height="12" rx="4" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9.5 15.2h5" />
      <path d="M2.5 11v3M21.5 11v3" />
    </svg>
  )
}

function CloseIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
