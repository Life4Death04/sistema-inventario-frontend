import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/features/auth/store/auth.store'

const roleLabels = {
  ADMIN: 'Administrador',
  MANAGER: 'Encargado de inventario',
  OPERATOR: 'Personal operativo',
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.6fr)]">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Mi Perfil</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Informacion del usuario</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Nombre completo</p>
            <p className="mt-2 text-sm text-[var(--color-text)]">{user?.fullName ?? 'No disponible'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Correo</p>
            <p className="mt-2 text-sm text-[var(--color-text)]">{user?.email ?? 'No disponible'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Telefono</p>
            <p className="mt-2 text-sm text-[var(--color-text)]">{user?.phone ?? 'No disponible'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Rol</p>
            <p className="mt-2 text-sm text-[var(--color-text)]">{user ? roleLabels[user.role] : 'No disponible'}</p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Convencion visual</p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          Esta vista ya usa el estilo base del sistema: superficies blancas, bordes suaves, acento azul clinico y espaciado comodo para operar desde 375px en adelante.
        </p>
      </Card>
    </div>
  )
}
