import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'

import { cn } from '@/lib/cn'

const CONTROL_CLASS =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 ' +
  'placeholder:text-ink-400 focus:border-brand-500 focus:outline-none ' +
  'aria-[invalid=true]:border-red-400'

type FieldShellProps = {
  id: string
  label: string
  hint?: string | undefined
  error?: string | undefined
  children: ReactNode
}

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink-700 text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-ink-500 text-xs">{hint}</p>
      ) : null}
    </div>
  )
}

export type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string
  hint?: string
  error?: string
}

export function InputField({ label, hint, error, className, ...rest }: InputFieldProps) {
  const id = useId()

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL_CLASS, className)}
        {...rest}
      />
    </FieldShell>
  )
}

export type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

export function SelectField({ label, hint, error, className, children, ...rest }: SelectFieldProps) {
  const id = useId()

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL_CLASS, className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  )
}

export type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string
  hint?: string
  error?: string
}

export function TextareaField({ label, hint, error, className, ...rest }: TextareaFieldProps) {
  const id = useId()

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL_CLASS, 'resize-y', className)}
        {...rest}
      />
    </FieldShell>
  )
}
