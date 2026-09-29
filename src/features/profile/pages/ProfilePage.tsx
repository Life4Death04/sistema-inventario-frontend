import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/features/auth/store/auth.store'

export function ProfilePage() {
  const { t } = useTranslation(['profile', 'common'])
  const user = useAuthStore((state) => state.user)
  const notAvailable = t('common:state.notAvailable')

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.6fr)]">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('profile:pageLabel')}</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{t('profile:title')}</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('profile:fields.fullName')}</p>
            <p className="mt-2 text-sm text-[var(--color-text)]">{user?.fullName ?? notAvailable}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('profile:fields.email')}</p>
            <p className="mt-2 text-sm text-[var(--color-text)]">{user?.email ?? notAvailable}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('profile:fields.phone')}</p>
            <p className="mt-2 text-sm text-[var(--color-text)]">{user?.phone ?? notAvailable}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('profile:fields.role')}</p>
            <p className="mt-2 text-sm text-[var(--color-text)]">{user ? t(`profile:roles.${user.role}`) : notAvailable}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
