import { Check, Mail, MessageCircle, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import type { SupplierRow } from '@/data/mockSelectors'

export type SupplierModalType = 'create' | 'edit'

interface SupplierModalsProps {
  modalType: SupplierModalType | null
  supplier: SupplierRow | null
  onClose: () => void
}

export function SupplierModals({ modalType, supplier, onClose }: SupplierModalsProps) {
  if (modalType === 'create') {
    return <CreateSupplierModal onClose={onClose} />
  }

  if (modalType === 'edit' && supplier) {
    return <EditSupplierModal onClose={onClose} supplier={supplier} />
  }

  return null
}

function CreateSupplierModal({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState(true)

  return (
    <ModalFrame onClose={onClose} title="Nuevo proveedor">
      <div className="max-h-[614px] flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <SupplierForm active={active} onToggleActive={() => setActive((current) => !current)} />
      </div>
      <Footer onClose={onClose} primaryLabel="Crear proveedor" />
    </ModalFrame>
  )
}

function EditSupplierModal({ onClose, supplier }: { onClose: () => void; supplier: SupplierRow }) {
  const [active, setActive] = useState(supplier.active)

  return (
    <ModalFrame
      onClose={onClose}
      title="Editar proveedor"
      titleSuffix={`${supplier.name} · ${supplier.products} productos asociados`}
    >
      <div className="max-h-[614px] flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <SupplierForm active={active} onToggleActive={() => setActive((current) => !current)} supplier={supplier} />
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <button className="rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)]" type="button">
          Desactivar proveedor
        </button>
        <div className="flex gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancelar
          </Button>
          <button className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)]" type="button">
            Guardar cambios
          </button>
        </div>
      </div>
    </ModalFrame>
  )
}

function SupplierForm({
  active,
  onToggleActive,
  supplier,
}: {
  active: boolean
  onToggleActive: () => void
  supplier?: SupplierRow
}) {
  return (
    <form className="space-y-6">
      <Field>
        <FieldLabel>Razon social / Nombre</FieldLabel>
        <TextInput defaultValue={supplier?.name} placeholder="Ej. Laboratorios Farma C.A." />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel>RIF</FieldLabel>
          <TextInput defaultValue={supplier?.rif} mono placeholder="J-12345678-9" />
        </Field>
        <Field>
          <FieldLabel>Persona de contacto</FieldLabel>
          <TextInput defaultValue={supplier?.contactName} placeholder="Nombre y Apellido" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel icon={<MessageCircle className="h-4 w-4 text-[var(--color-success-text)]" />}>WhatsApp</FieldLabel>
          <PhoneInput defaultValue={supplier?.whatsapp} helper="Se usara para enviar las solicitudes de reposicion" />
        </Field>
        <Field>
          <FieldLabel>Telefono alternativo</FieldLabel>
          <PhoneInput defaultValue={supplier?.altPhone ?? undefined} />
        </Field>
      </div>

      <Field>
        <FieldLabel icon={<Mail className="h-4 w-4 text-[var(--color-primary)]" />}>Correo electronico</FieldLabel>
        <TextInput defaultValue={supplier?.email ?? undefined} placeholder="correo@empresa.com" type="email" />
      </Field>

      <Field>
        <FieldLabel>Direccion</FieldLabel>
        <textarea
          className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          defaultValue={supplier?.address}
          placeholder="Direccion completa"
          rows={2}
        />
      </Field>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <div>
          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Estado</span>
          <span className="block text-xs text-[var(--color-text-muted)]">Si esta inactivo, no aparecera en nuevas reposiciones.</span>
        </div>
        <div className="flex items-center gap-3">
          <Toggle checked={active} onChange={onToggleActive} />
          <span className="text-sm text-[var(--color-text)]">{active ? 'Activo' : 'Inactivo'}</span>
        </div>
      </div>
    </form>
  )
}

function ModalFrame({
  children,
  onClose,
  title,
  titleSuffix,
}: {
  children: ReactNode
  onClose: () => void
  title: string
  titleSuffix?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-[#23323d]/60 backdrop-blur-sm" onClick={onClose} type="button" />
      <div className="relative z-10 flex w-full max-w-[520px] flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <h2 className="text-[20px] font-medium text-[var(--color-text)]">{title}</h2>
            {titleSuffix ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{titleSuffix}</p> : null}
          </div>
          <button className="rounded-full p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Footer({ onClose, primaryLabel }: { onClose: () => void; primaryLabel: string }) {
  return (
    <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
      <div className="flex gap-3">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancelar
        </Button>
        <button className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)]" type="button">
          {primaryLabel}
        </button>
      </div>
    </div>
  )
}

function Field({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

function FieldLabel({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <label className="mb-1.5 flex items-center text-sm text-[var(--color-text-secondary)]">
      {icon ? <span className="mr-1.5">{icon}</span> : null}
      {children}
    </label>
  )
}

function TextInput({ defaultValue, mono = false, placeholder, type = 'text' }: { defaultValue?: string; mono?: boolean; placeholder?: string; type?: string }) {
  return (
    <input
      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] ${mono ? 'font-data-mono' : ''}`}
      defaultValue={defaultValue}
      placeholder={placeholder}
      type={type}
    />
  )
}

function PhoneInput({ defaultValue, helper }: { defaultValue?: string; helper?: string }) {
  return (
    <div>
      <div className="flex rounded-lg shadow-sm">
        <span className="inline-flex items-center rounded-l-lg border border-r-0 border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 font-data-mono text-sm text-[var(--color-text-secondary)]">
          +58
        </span>
        <input
          className="block w-full flex-1 rounded-none rounded-r-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          defaultValue={stripCountryCode(defaultValue)}
          placeholder="412-000-0000"
          type="text"
        />
      </div>
      {helper ? <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">{helper}</p> : null}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      aria-pressed={checked}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-[var(--color-success-text)]' : 'bg-[var(--color-surface-variant)]'}`}
      onClick={onChange}
      type="button"
    >
      <span className={`absolute top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border)] bg-white transition ${checked ? 'translate-x-5' : 'translate-x-[2px]'}`}>
        {checked ? <Check className="h-3 w-3 text-[var(--color-success-text)]" /> : null}
      </span>
    </button>
  )
}

function stripCountryCode(value?: string) {
  if (!value) {
    return ''
  }

  const normalized = value.replace(/\D/g, '')

  if (normalized.startsWith('58')) {
    return `${normalized.slice(2, 5)}-${normalized.slice(5, 8)}-${normalized.slice(8)}`
  }

  return value
}
