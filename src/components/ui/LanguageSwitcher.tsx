import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const SUPPORTED_LANGUAGES = ['es', 'en'] as const

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const activeLanguage: SupportedLanguage = i18n.language.startsWith('en') ? 'en' : 'es'

  const handleSelect = (language: SupportedLanguage) => {
    if (language !== activeLanguage) {
      void i18n.changeLanguage(language)
    }
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-page-bg)] p-1 ${className}`}
      role="group"
    >
      <Globe className="ml-1.5 h-4 w-4 text-[var(--color-text-muted)]" />
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          aria-pressed={activeLanguage === language}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition ${
            activeLanguage === language
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
          }`}
          onClick={() => handleSelect(language)}
          type="button"
        >
          {language}
        </button>
      ))}
    </div>
  )
}
