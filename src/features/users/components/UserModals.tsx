import { Check, Eye, EyeOff, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import type { UserRow } from '@/data/mockSelectors'

export type UserModalType = 'create' | 'edit'

interface UserModalsProps {
  modalType: UserModalType | null
  user: UserRow | null
  onClose: () => void
}

const roleOptions = [
  { value: 'OPERATOR', label: 'Personal operativo', helper: 'Acceso de consulta al catalogo y existencias, y registro de movimientos autorizados.' },
  { value: 'MANAGER', label: 'Encargado de inventario', helper: 'Hereda las vistas del Operativo y añade gestion de inventario, alertas, reposicion y proveedores.' },
  { value: 'ADMIN', label: 'Administrador', helper: 'Gestion integral del sistema, configuracion de accesos y control operativo completo.' },
] as const

export function UserModals({ modalType, user, onClose }: UserModalsProps) {
  if (modalType === 'create') {
    return <CreateUserModal onClose={onClose} />
  }

  if (modalType === 'edit' && user) {
    return <EditUserModal onClose={onClose} user={user} />
  }

  return null
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState<(typeof roleOptions)[number]['value']>('OPERATOR')
  const [active, setActive] = useState(true)
  const [passwordMode, setPasswordMode] = useState<'define' | 'link'>('define')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const currentRole = roleOptions.find((option) => option.value === role) ?? roleOptions[0]

  return (
    <ModalFrame onClose={onClose} title="Nuevo usuario">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <Field>
          <FieldLabel>Nombre completo</FieldLabel>
          <TextInput placeholder="Ej. Ana Garcia" />
        </Field>

        <Field>
          <FieldLabel>Correo electronico</FieldLabel>
          <TextInput placeholder="ana.garcia@highmeds.com" type="email" />
          <HelperText>Sera su usuario para iniciar sesion.</HelperText>
        </Field>

        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel>Rol</FieldLabel>
            <span className={`inline-flex rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getRoleTagClasses(role)}`}>
              {currentRole.label}
            </span>
          </div>
          <SelectField onChange={(event) => setRole(event.target.value as (typeof roleOptions)[number]['value'])} value={role}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <HelperText>{currentRole.helper}</HelperText>
        </Field>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Estado</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{active ? 'Activo' : 'Inactivo'}</p>
          </div>
          <Toggle checked={active} onChange={() => setActive((current) => !current)} />
        </div>

        <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
          <FieldLabel>Contrasena inicial</FieldLabel>
          <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1">
            <SegmentButton active={passwordMode === 'define'} onClick={() => setPasswordMode('define')}>
              Definir ahora
            </SegmentButton>
            <SegmentButton active={passwordMode === 'link'} onClick={() => setPasswordMode('link')}>
              Enviar enlace
            </SegmentButton>
          </div>

          {passwordMode === 'define' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Contrasena</FieldLabel>
                <PasswordInput onToggleVisibility={() => setShowPassword((current) => !current)} showPassword={showPassword} value="secretpass" />
                <HelperText>Minimo 8 caracteres.</HelperText>
              </Field>
              <Field>
                <FieldLabel>Confirmar contrasena</FieldLabel>
                <PasswordInput onToggleVisibility={() => setShowConfirmPassword((current) => !current)} showPassword={showConfirmPassword} value="secretpass" />
              </Field>
            </div>
          ) : (
            <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 text-sm text-[var(--color-text-secondary)]">
              Se enviara un enlace de activacion por correo para que el usuario defina su contrasena inicial.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[color:rgba(245,248,251,0.5)] px-6 py-4">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancelar
        </Button>
        <button className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)]" type="button">
          Crear usuario
        </button>
      </div>
    </ModalFrame>
  )
}

function EditUserModal({ onClose, user }: { onClose: () => void; user: UserRow }) {
  const [role, setRole] = useState<(typeof roleOptions)[number]['value']>(user.roleKey)
  const [active, setActive] = useState(user.active)
  const [changePassword, setChangePassword] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const currentRole = roleOptions.find((option) => option.value === role) ?? roleOptions[0]
  const createdAt = formatDateTime(user.createdAt)
  const lastAccess = user.lastAccess ? formatDateTime(user.lastAccess) : 'Sin acceso reciente'

  return (
    <ModalFrame
      header={
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${getRoleAvatarClasses(user.roleKey)}`}>
            {user.initials}
          </div>
          <div>
            <h2 className="text-[20px] font-medium leading-7 text-[var(--color-text)]">Editar usuario</h2>
            <p className="mt-1 font-data-mono text-xs text-[var(--color-text-secondary)]">
              Registrado el {createdAt} · Ultimo acceso {lastAccess}
            </p>
          </div>
        </div>
      }
      onClose={onClose}
    >
      <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
        <section className="space-y-5">
          <SectionLabel>Datos basicos</SectionLabel>
          <Field>
            <FieldLabel>Nombre completo</FieldLabel>
            <TextInput defaultValue={user.fullName} />
          </Field>

          <Field>
            <FieldLabel>Rol</FieldLabel>
            <SelectField onChange={(event) => setRole(event.target.value as (typeof roleOptions)[number]['value'])} value={role}>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <div className="flex items-start gap-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-page-bg)] p-3">
              <span className={`mt-0.5 inline-flex rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getRoleTagClasses(role)}`}>
                {currentRole.label}
              </span>
              <p className="text-sm text-[var(--color-text-secondary)]">{currentRole.helper}</p>
            </div>
          </Field>

          <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-4 pt-2">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">Estado</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Controla si el usuario puede acceder al sistema</p>
            </div>
            <div className="flex items-center gap-3">
              <Toggle checked={active} onChange={() => setActive((current) => !current)} />
              <span className="text-sm font-medium text-[var(--color-text)]">{active ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <SectionLabel>Datos de acceso</SectionLabel>
          <Field>
            <FieldLabel>Correo electronico</FieldLabel>
            <TextInput defaultValue={user.email} type="email" />
            <HelperText>Se usa para iniciar sesion.</HelperText>
          </Field>

          <div className="space-y-4 rounded-[8px] border border-[var(--color-primary)]/20 bg-[rgba(232,241,250,0.35)] p-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input checked={changePassword} className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]" onChange={() => setChangePassword((current) => !current)} type="checkbox" />
              <span className="text-sm font-medium text-[var(--color-text)]">Cambiar contrasena</span>
            </label>

            {changePassword ? (
              <div className="space-y-4 border-t border-[var(--color-border)]/60 pt-4">
                <Field>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel>Nueva contrasena</FieldLabel>
                    <span className="text-sm text-[var(--color-text-secondary)]">Minimo 8 caracteres</span>
                  </div>
                  <PasswordInput onToggleVisibility={() => setShowPassword((current) => !current)} placeholder="••••••••" showPassword={showPassword} />
                </Field>

                <Field>
                  <FieldLabel>Confirmar contrasena</FieldLabel>
                  <PasswordInput onToggleVisibility={() => setShowConfirmPassword((current) => !current)} placeholder="••••••••" showPassword={showConfirmPassword} />
                </Field>

                <button className="text-sm font-medium text-[var(--color-primary)] transition hover:underline" type="button">
                  Enviar enlace de restablecimiento por correo
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <button className="rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)]" type="button">
          Desactivar usuario
        </button>
        <div className="flex gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancelar
          </Button>
          <button className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)]" type="button">
            Guardar cambios
          </button>
        </div>
      </div>
    </ModalFrame>
  )
}

function ModalFrame({
  children,
  header,
  onClose,
  title,
}: {
  children: ReactNode
  header?: ReactNode
  onClose: () => void
  title?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5">
      <button className="absolute inset-0 bg-[#0e1d27]/40 backdrop-blur-[2px]" onClick={onClose} type="button" />
      <div className="relative flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-5">
          {header ?? <h2 className="text-[20px] font-medium leading-7 text-[var(--color-text)]">{title}</h2>}
          <button className="rounded-full p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-sm font-medium text-[var(--color-text)]">{children}</label>
}

function HelperText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--color-text-secondary)]">{children}</p>
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{children}</h3>
}

function TextInput({ defaultValue, placeholder, type = 'text' }: { defaultValue?: string; placeholder?: string; type?: string }) {
  return (
    <input
      className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
      defaultValue={defaultValue}
      placeholder={placeholder}
      type={type}
    />
  )
}

function SelectField({ children, onChange, value }: { children: ReactNode; onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void; value: string }) {
  return (
    <select
      className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
      onChange={onChange}
      value={value}
    >
      {children}
    </select>
  )
}

function PasswordInput({
  onToggleVisibility,
  placeholder,
  showPassword,
  value,
}: {
  onToggleVisibility: () => void
  placeholder?: string
  showPassword: boolean
  value?: string
}) {
  return (
    <div className="relative">
      <input
        className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 pr-10 font-data-mono text-sm tracking-widest text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
        defaultValue={value}
        placeholder={placeholder}
        type={showPassword ? 'text' : 'password'}
      />
      <button className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]" onClick={onToggleVisibility} type="button">
        {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      aria-pressed={checked}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
      onClick={onChange}
      type="button"
    >
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border)] bg-white transition ${checked ? 'translate-x-4' : 'translate-x-0'}`}>
        {checked ? <Check className="h-3 w-3 text-[var(--color-primary)]" /> : null}
      </span>
    </button>
  )
}

function SegmentButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition ${active ? 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function getRoleTagClasses(role: (typeof roleOptions)[number]['value']) {
  if (role === 'ADMIN') {
    return 'bg-[var(--color-surface-tint)]/18 text-[var(--color-primary)]'
  }

  if (role === 'MANAGER') {
    return 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
  }

  return 'bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)]'
}

function getRoleAvatarClasses(role: UserRow['roleKey']) {
  if (role === 'ADMIN') {
    return 'bg-[var(--color-surface-tint)]/18 text-[var(--color-primary)]'
  }

  if (role === 'MANAGER') {
    return 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
  }

  return 'bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)]'
}

function formatDateTime(value: string) {
  const date = new Date(value)
  const datePart = new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  return `${datePart} ${timePart}`
}
