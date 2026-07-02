import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'

import { router } from '@/app/router'
import { Loading } from '@/components/ui/Loading'
import { useAuthStore } from '@/features/auth/store/auth.store'

export default function App() {
  const bootstrapSession = useAuthStore((state) => state.bootstrapSession)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)

  useEffect(() => {
    void bootstrapSession()
  }, [bootstrapSession])

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-page-bg)] px-4">
        <div className="w-full max-w-md">
          <Loading />
        </div>
      </div>
    )
  }

  return <RouterProvider router={router} />
}
