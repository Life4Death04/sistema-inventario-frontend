import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { RoleProtectedRoute } from '@/components/layout/RoleProtectedRoute'
import { AlertsPage } from '@/features/alerts/pages/AlertsPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { InventoryPage } from '@/features/inventory/pages/InventoryPage'
import { MovementsPage } from '@/features/movements/pages/MovementsPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { ReplenishmentPage } from '@/features/replenishment/pages/ReplenishmentPage'
import { SuppliersPage } from '@/features/suppliers/pages/SuppliersPage'
import { UsersPage } from '@/features/users/pages/UsersPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate replace to="productos" />,
          },
          {
            path: 'productos',
            element: <ProductsPage />,
          },
          {
            path: 'inventario',
            element: <InventoryPage />,
          },
          {
            path: 'movimientos',
            element: <MovementsPage />,
          },
          {
            path: 'alertas',
            element: <AlertsPage />,
          },
          {
            element: <RoleProtectedRoute permission="view:replenishment" />,
            children: [
              {
                path: 'reposicion',
                element: <ReplenishmentPage />,
              },
            ],
          },
          {
            element: <RoleProtectedRoute permission="view:suppliers" />,
            children: [
              {
                path: 'proveedores',
                element: <SuppliersPage />,
              },
            ],
          },
          {
            element: <RoleProtectedRoute permission="view:users" />,
            children: [
              {
                path: 'usuarios',
                element: <UsersPage />,
              },
            ],
          },
          {
            path: 'perfil',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
])
