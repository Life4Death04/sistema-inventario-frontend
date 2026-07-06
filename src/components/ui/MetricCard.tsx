interface MetricCardProps {
  label: string
  value: number
  tone?: 'default' | 'info' | 'success' | 'danger' | 'warning'
}

export function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
  const toneClass: Record<NonNullable<MetricCardProps['tone']>, string> = {
    default: 'text-[var(--color-text)]',
    info: 'text-[var(--color-primary)]',
    success: 'text-[var(--color-success-text)]',
    danger: 'text-[var(--color-danger-text)]',
    warning: 'text-[var(--color-warning-text)]',
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">
        {label}
      </p>
      <p className={`text-[30px] font-semibold leading-[38px] ${toneClass[tone]}`}>{value}</p>
    </div>
  )
}
