import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail, Pill } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { getCredentialsHint } from '@/data/mockSelectors'
import { loginSchema } from '@/features/auth/schemas/auth.schema'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { LoginFormValues } from '@/types/common.types'

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const credentials = getCredentialsHint()
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: credentials.email,
      password: credentials.password,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true)

    try {
      await login(values.email, values.password)
      toast.success('Sesion iniciada correctamente')
      navigate(destination, { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible iniciar sesion'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f8fb] px-4 py-10">
      <div className="w-full max-w-[360px]">
        <div className="rounded-[12px] border border-[#e5ecf1] bg-white px-8 py-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[12px] bg-[#e1f5ee]">
              <Pill className="h-7 w-7 text-[#0f6e56]" />
            </div>
            <h1 className="text-[20px] font-semibold text-[#004782]">High Meds C.A.</h1>
            <p className="mt-1 text-[13px] text-[#5c6b78]">Sistema de gestion de inventario</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1">
              <label className="sr-only" htmlFor="email">
                Correo electronico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#95a3ae]" />
                <input
                  {...register('email')}
                  className="h-11 w-full rounded-[8px] border border-[#e5ecf1] bg-white pl-10 pr-4 text-sm text-[#0e1d27] outline-none transition focus:border-[#004782] focus:ring-2 focus:ring-[#004782]/10"
                  id="email"
                  placeholder="Correo electronico"
                  type="email"
                />
              </div>
              {errors.email?.message ? <span className="text-xs text-[#ba1a1a]">{errors.email.message}</span> : null}
            </div>

            <div className="flex flex-col gap-1">
              <label className="sr-only" htmlFor="password">
                Contrasena
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#95a3ae]" />
                <input
                  {...register('password')}
                  className="h-11 w-full rounded-[8px] border border-[#e5ecf1] bg-white pl-10 pr-10 text-sm text-[#0e1d27] outline-none transition focus:border-[#004782] focus:ring-2 focus:ring-[#004782]/10"
                  id="password"
                  placeholder="Contrasena"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#95a3ae] transition hover:text-[#004782]"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password?.message ? <span className="text-xs text-[#ba1a1a]">{errors.password.message}</span> : null}
            </div>

            <div className="-mt-2 flex justify-end">
              <span className="text-[13px] text-[#004782]">Olvidaste tu contrasena?</span>
            </div>

            <Button
              className="mt-1 h-10 w-full rounded-[8px] bg-[#185fa5] text-sm font-medium text-white hover:bg-[#004782]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesion'}
            </Button>
          </form>

          <div className="mt-6 rounded-[8px] bg-[#f6faff] px-4 py-3 text-sm text-[#5c6b78]">
            <p className="font-medium text-[#0e1d27]">Credenciales mock</p>
            <p className="mt-1">Correo: {credentials.email}</p>
            <p>Contrasena: {credentials.password}</p>
          </div>
        </div>

        <footer className="mt-8 text-center text-[11px] leading-4 text-[#95a3ae]">Aragua de Maturin, Monagas · Acceso restringido</footer>
      </div>
    </div>
  )
}
