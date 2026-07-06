import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Check, Eye, EyeOff, LoaderCircle, X } from 'lucide-react'
import { useState, type ChangeEvent, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import {
  createUser,
  deleteUser,
  updateUser,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/features/users/api/users.api'
import type { UserRow } from '@/features/users/lib/userRows'
import { queryKeys } from '@/lib/queryKeys'
import type { ApiErrorEnvelope, UserRole } from '@/types/api.types'

export type UserModalType = 'create' | 'edit' | 'detail'

interface UserModalsProps {
  modalType: UserModalType | null
  user: UserRow | null
  onClose: () => void
}

interface CreateUserFormValues {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
}

interface EditUserFormValues {
  fullName: string
  email: string
  role: UserRole
  active: boolean
  changePassword: boolean
  password: string
  confirmPassword: string
}

const roleOptions = [
  {
    value: 'OPERATOR',
    label: 'Personal operativo',
    helper: 'Acceso de consulta al catalogo y existencias, y registro de movimientos autorizados.',
  },
  {
    value: 'MANAGER',
    label: 'Encargado de inventario',
    helper: 'Hereda las vistas del Operativo y añade gestion de inventario, alertas, reposicion y proveedores.',
  },
  {
    value: 'ADMIN',
    label: 'Administrador',
    helper: 'Gestion integral del sistema, configuracion de accesos y control operativo completo.',
  },
] as const

export function UserModals({ modalType, user, onClose }: UserModalsProps) {
  const queryClient = useQueryClient()

  const invalidateUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: async () => {
      await invalidateUsers()
      toast.success('Usuario creado correctamente')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getUserErrorMessage(error, 'create'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserInput }) =>
      updateUser(userId, input),
    onSuccess: async () => {
      await invalidateUsers()
      toast.success('Usuario actualizado correctamente')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getUserErrorMessage(error, 'update'))
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: async () => {
      await invalidateUsers()
      toast.success('Usuario desactivado correctamente')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getUserErrorMessage(error, 'deactivate'))
    },
  })

  if (modalType === 'create') {
    return (
      <CreateUserModal
        isSubmitting={createMutation.isPending}
        onClose={onClose}
        onSubmit={(values) => createMutation.mutate(toCreateUserInput(values))}
      />
    )
  }

  if (modalType === 'edit' && user) {
    return (
      <EditUserModal
        isDeactivating={deactivateMutation.isPending}
        isSubmitting={updateMutation.isPending}
        onClose={onClose}
        onDeactivate={() => deactivateMutation.mutate(user.id)}
        onSubmit={(values) =>
          updateMutation.mutate({
            userId: user.id,
            input: toUpdateUserInput(user, values),
          })
        }
        user={user}
      />
    )
  }

  if (modalType === 'detail' && user) {
    return (
      <UserDetailModal
        isActivating={updateMutation.isPending}
        isDeactivating={deactivateMutation.isPending}
        onActivate={() => updateMutation.mutate({ userId: user.id, input: { active: true } })}
        onClose={onClose}
        onDeactivate={() => deactivateMutation.mutate(user.id)}
        user={user}
      />
    )
  }

  return null
}

function UserDetailModal({
  isActivating,
  isDeactivating,
  onActivate,
  onClose,
  onDeactivate,
  user,
}: {
  isActivating: boolean
  isDeactivating: boolean
  onActivate: () => void
  onClose: () => void
  onDeactivate: () => void
  user: UserRow
}) {
  const isPending = isActivating || isDeactivating

  return (
    <ModalFrame onClose={onClose} title="Detalle del usuario">
      <div className="space-y-4 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold ${user.active ? 'bg-[var(--color-surface-tint)]/18 text-[var(--color-primary)]' : 'bg-[var(--color-surface-strong)] text-[var(--color-text-muted)]'}`}>
            {user.initials}
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--color-text)]">{user.fullName}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">Rol</p>
            <p className="mt-1 text-sm text-[var(--color-text)]">{user.role}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">Estado</p>
            <p className={`mt-1 text-sm font-medium ${user.active ? 'text-[var(--color-success-text)]' : 'text-[var(--color-text-muted)]'}`}>
              {user.active ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
        <Button disabled={isPending} onClick={onClose} type="button" variant="ghost">
          Cerrar
        </Button>
        {user.active ? (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[var(--color-danger-bg)] px-4 py-2 text-sm font-medium text-[var(--color-danger-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            onClick={onDeactivate}
            type="button"
          >
            {isDeactivating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {isDeactivating ? 'Desactivando...' : 'Desactivar'}
          </button>
        ) : (
          <Button disabled={isPending} onClick={onActivate} type="button">
            {isActivating ? 'Activando...' : 'Activar'}
          </Button>
        )}
      </div>
    </ModalFrame>
  )
}

function CreateUserModal({
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: CreateUserFormValues) => void
}) {
  const [values, setValues] = useState<CreateUserFormValues>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'OPERATOR',
  })
  const [passwordMode] = useState<'define' | 'link'>('define')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const currentRole = roleOptions.find((option) => option.value === values.role) ?? roleOptions[0]

  const handleSubmit = () => {
    const validationError = validateCreateUserForm(values)

    if (validationError) {
      toast.error(validationError)
      return
    }

    onSubmit(values)
  }

  return (
    <ModalFrame onClose={onClose} title="Nuevo usuario">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <Field>
          <FieldLabel>Nombre completo</FieldLabel>
          <TextInput onChange={(event) => updateCreateField(setValues, 'fullName', event.target.value)} placeholder="Ej. Ana Garcia" value={values.fullName} />
        </Field>

        <Field>
          <FieldLabel>Correo electronico</FieldLabel>
          <TextInput onChange={(event) => updateCreateField(setValues, 'email', event.target.value)} placeholder="ana.garcia@highmeds.com" type="email" value={values.email} />
          <HelperText>Sera su usuario para iniciar sesion.</HelperText>
        </Field>

        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel>Rol</FieldLabel>
            <span className={`inline-flex rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getRoleTagClasses(values.role)}`}>
              {currentRole.label}
            </span>
          </div>
          <SelectField onChange={(event) => updateCreateField(setValues, 'role', event.target.value as UserRole)} value={values.role}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <HelperText>{currentRole.helper}</HelperText>
        </Field>

        <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
          <FieldLabel>Contrasena inicial</FieldLabel>
          <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1">
            <SegmentButton active={passwordMode === 'define'} onClick={() => {}}>
              Definir ahora
            </SegmentButton>
            <SegmentButton active={passwordMode === 'link'} disabled onClick={() => {}}>
              Enviar enlace
            </SegmentButton>
          </div>

          <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-page-bg)]/40 p-3 text-sm text-[var(--color-text-secondary)]">
            El envío de enlace aún no está soportado por el backend actual. La creación real se hace con contraseña definida.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Contrasena</FieldLabel>
              <PasswordInput
                onChange={(event) => updateCreateField(setValues, 'password', event.target.value)}
                onToggleVisibility={() => setShowPassword((current) => !current)}
                showPassword={showPassword}
                value={values.password}
              />
              <HelperText>Minimo 8 caracteres.</HelperText>
            </Field>
            <Field>
              <FieldLabel>Confirmar contrasena</FieldLabel>
              <PasswordInput
                onChange={(event) => updateCreateField(setValues, 'confirmPassword', event.target.value)}
                onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
                showPassword={showConfirmPassword}
                value={values.confirmPassword}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[color:rgba(245,248,251,0.5)] px-6 py-4">
        <Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">
          Cancelar
        </Button>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          onClick={handleSubmit}
          type="button"
        >
          {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          Crear usuario
        </button>
      </div>
    </ModalFrame>
  )
}

function EditUserModal({
  isDeactivating,
  isSubmitting,
  onClose,
  onDeactivate,
  onSubmit,
  user,
}: {
  isDeactivating: boolean
  isSubmitting: boolean
  onClose: () => void
  onDeactivate: () => void
  onSubmit: (values: EditUserFormValues) => void
  user: UserRow
}) {
  const [values, setValues] = useState<EditUserFormValues>({
    fullName: user.fullName,
    email: user.email,
    role: user.roleKey,
    active: user.active,
    changePassword: false,
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const currentRole = roleOptions.find((option) => option.value === values.role) ?? roleOptions[0]
  const createdAt = formatDateTime(user.createdAt)
  const lastAccess = user.lastAccess ? formatDateTime(user.lastAccess) : 'Sin acceso reciente'
  const isPending = isSubmitting || isDeactivating

  const handleSubmit = () => {
    const validationError = validateEditUserForm(values)

    if (validationError) {
      toast.error(validationError)
      return
    }

    onSubmit(values)
  }

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
            <TextInput onChange={(event) => updateEditField(setValues, 'fullName', event.target.value)} value={values.fullName} />
          </Field>

          <Field>
            <FieldLabel>Rol</FieldLabel>
            <SelectField onChange={(event) => updateEditField(setValues, 'role', event.target.value as UserRole)} value={values.role}>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <div className="flex items-start gap-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-page-bg)] p-3">
              <span className={`mt-0.5 inline-flex rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getRoleTagClasses(values.role)}`}>
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
              <Toggle checked={values.active} onChange={() => updateEditField(setValues, 'active', !values.active)} />
              <span className="text-sm font-medium text-[var(--color-text)]">{values.active ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <SectionLabel>Datos de acceso</SectionLabel>
          <Field>
            <FieldLabel>Correo electronico</FieldLabel>
            <TextInput onChange={(event) => updateEditField(setValues, 'email', event.target.value)} type="email" value={values.email} />
            <HelperText>Se usa para iniciar sesion.</HelperText>
          </Field>

          <div className="space-y-4 rounded-[8px] border border-[var(--color-primary)]/20 bg-[rgba(232,241,250,0.35)] p-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={values.changePassword}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                onChange={() => updateEditField(setValues, 'changePassword', !values.changePassword)}
                type="checkbox"
              />
              <span className="text-sm font-medium text-[var(--color-text)]">Cambiar contrasena</span>
            </label>

            {values.changePassword ? (
              <div className="space-y-4 border-t border-[var(--color-border)]/60 pt-4">
                <Field>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel>Nueva contrasena</FieldLabel>
                    <span className="text-sm text-[var(--color-text-secondary)]">Minimo 8 caracteres</span>
                  </div>
                  <PasswordInput
                    onChange={(event) => updateEditField(setValues, 'password', event.target.value)}
                    onToggleVisibility={() => setShowPassword((current) => !current)}
                    placeholder="••••••••"
                    showPassword={showPassword}
                    value={values.password}
                  />
                </Field>

                <Field>
                  <FieldLabel>Confirmar contrasena</FieldLabel>
                  <PasswordInput
                    onChange={(event) => updateEditField(setValues, 'confirmPassword', event.target.value)}
                    onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
                    placeholder="••••••••"
                    showPassword={showConfirmPassword}
                    value={values.confirmPassword}
                  />
                </Field>

                <button className="cursor-not-allowed text-sm font-medium text-[var(--color-text-muted)]" disabled type="button">
                  Enviar enlace de restablecimiento por correo
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <button
          className="rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          onClick={onDeactivate}
          type="button"
        >
          {isDeactivating ? <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" /> : null}
          Desactivar usuario
        </button>
        <div className="flex gap-3">
          <Button disabled={isPending} onClick={onClose} type="button" variant="ghost">
            Cancelar
          </Button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
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
      <div aria-label={title ?? 'Modal de usuario'} aria-modal="true" className="relative flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]" role="dialog">
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

function TextInput({
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  value: string
}) {
  return (
    <input
      className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  )
}

function SelectField({
  children,
  onChange,
  value,
}: {
  children: ReactNode
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  value: string
}) {
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
  onChange,
  onToggleVisibility,
  placeholder,
  showPassword,
  value,
}: {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onToggleVisibility: () => void
  placeholder?: string
  showPassword: boolean
  value: string
}) {
  return (
    <div className="relative">
      <input
        className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 pr-10 font-data-mono text-sm tracking-widest text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
        onChange={onChange}
        placeholder={placeholder}
        type={showPassword ? 'text' : 'password'}
        value={value}
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

function SegmentButton({
  active,
  children,
  disabled = false,
  onClick,
}: {
  active: boolean
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition ${active ? 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function updateCreateField<K extends keyof CreateUserFormValues>(
  setValues: Dispatch<SetStateAction<CreateUserFormValues>>,
  key: K,
  value: CreateUserFormValues[K],
) {
  setValues((current) => ({ ...current, [key]: value }))
}

function updateEditField<K extends keyof EditUserFormValues>(
  setValues: Dispatch<SetStateAction<EditUserFormValues>>,
  key: K,
  value: EditUserFormValues[K],
) {
  setValues((current) => ({ ...current, [key]: value }))
}

function validateCreateUserForm(values: CreateUserFormValues) {
  if (!values.fullName.trim()) {
    return 'El nombre completo es obligatorio'
  }

  if (!values.email.trim()) {
    return 'El correo electronico es obligatorio'
  }

  if (!isValidEmail(values.email)) {
    return 'Ingrese un correo electronico valido'
  }

  if (!values.role) {
    return 'Seleccione un rol valido'
  }

  if (values.password.length < 8) {
    return 'La contrasena debe tener al menos 8 caracteres'
  }

  if (values.password !== values.confirmPassword) {
    return 'La confirmacion de contrasena no coincide'
  }

  return null
}

function validateEditUserForm(values: EditUserFormValues) {
  if (!values.fullName.trim()) {
    return 'El nombre completo es obligatorio'
  }

  if (!values.email.trim()) {
    return 'El correo electronico es obligatorio'
  }

  if (!isValidEmail(values.email)) {
    return 'Ingrese un correo electronico valido'
  }

  if (values.changePassword) {
    if (values.password.length < 8) {
      return 'La nueva contrasena debe tener al menos 8 caracteres'
    }

    if (values.password !== values.confirmPassword) {
      return 'La confirmacion de contrasena no coincide'
    }
  }

  return null
}

function toCreateUserInput(values: CreateUserFormValues): CreateUserInput {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    password: values.password,
    role: values.role,
  }
}

function toUpdateUserInput(user: UserRow, values: EditUserFormValues): UpdateUserInput {
  const input: UpdateUserInput = {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    role: values.role,
    active: values.active,
  }

  if (values.changePassword && values.password.trim()) {
    input.password = values.password
  }

  if (user.phone !== null) {
    input.phone = user.phone
  }

  return input
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function getUserErrorMessage(error: unknown, action: 'create' | 'update' | 'deactivate') {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return 'Ocurrio un error inesperado al gestionar usuarios'
  }

  const apiError = error.response?.data
  const status = error.response?.status
  const code = apiError?.error?.toUpperCase() ?? ''
  const message = apiError?.message?.trim()
  const normalizedMessage = message?.toLowerCase() ?? ''

  if (
    code.includes('EMAIL') &&
    (code.includes('DUPLICATE') ||
      code.includes('ALREADY_EXISTS') ||
      normalizedMessage.includes('ya existe') ||
      normalizedMessage.includes('duplicate'))
  ) {
    return 'Ya existe un usuario con ese correo'
  }

  if (
    code.includes('LAST_ADMIN') ||
    normalizedMessage.includes('ultimo administrador') ||
    normalizedMessage.includes('last admin')
  ) {
    return 'No se puede desactivar o degradar el último administrador'
  }

  if (
    status === 404 ||
    code.includes('NOT_FOUND') ||
    normalizedMessage.includes('no encontrado') ||
    normalizedMessage.includes('not found') ||
    normalizedMessage.includes('inactivo')
  ) {
    return 'El usuario no existe, ya está inactivo o no pudo encontrarse'
  }

  if (message) {
    return message
  }

  if (status === 400) {
    if (action === 'deactivate') {
      return 'No fue posible desactivar el usuario'
    }

    return 'Revise los datos del usuario antes de guardar'
  }

  return 'No fue posible completar la operacion sobre usuarios'
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
