import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label: string
}

export function Input({ error, label, className = '', ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[var(--color-text-secondary)]">
      <span className="font-medium text-[var(--color-text)]">{label}</span>
      <input
        className={`rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)] ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-[var(--color-danger-text)]">{error}</span> : null}
    </label>
  )
}
