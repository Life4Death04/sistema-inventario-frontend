import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return <section className={`rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 ${className}`}>{children}</section>
}
