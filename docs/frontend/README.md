# Documentación técnica — Frontend

Guía de onboarding para desarrolladores que se incorporan al frontend del sistema de gestión de inventario (High Meds C.A.).

Esta documentación describe **cómo está construido, cómo agregar cosas y dónde vive cada pieza**, no cómo usarlo desde el punto de vista del usuario final. Para overview ejecutivo del sistema completo, ver `DOCUMENTACION-TECNICA.md` en la raíz.

---

## 1. Stack técnico

| Capa                | Tecnología                             | Notas                                              |
| ------------------- | -------------------------------------- | -------------------------------------------------- |
| Framework           | React 18.3                             | Sin React Compiler, sin Server Components          |
| Lenguaje            | TypeScript 5.9                         | Modo estricto vía `tsconfig.app.json`              |
| Build / dev server  | Vite 7.1 + `@vitejs/plugin-react`      | HMR, dev proxy hacia backend                       |
| Estado del servidor | TanStack Query 5                       | Fuente única para datos remotos                    |
| Estado global (UI)  | Zustand 5                              | Solo se usa para sesión de autenticación           |
| Routing             | React Router DOM 7                     | `createBrowserRouter`, rutas anidadas              |
| Tablas              | TanStack React Table 8                 | Paginación cliente, filtro global                  |
| Formularios         | React Hook Form 7 + Zod 4              | Validación declarativa por schema                  |
| HTTP client         | Axios 1.11                             | Interceptores para JWT y refresh automático        |
| Estilos             | Tailwind CSS 4 (via `@tailwindcss/vite`) | Design tokens como CSS variables                 |
| Íconos              | lucide-react                           | Íconos como componentes React                      |
| Toasts              | react-hot-toast                        | Feedback de mutaciones                             |
| E2E tests           | Playwright 1.61                        | Suites `login`, `admin-connected`                  |

**No hay Redux, no hay Next.js, no hay SSR.** Es una SPA clásica que se hidrata contra un backend Express REST.

---

## 2. Comandos

```bash
npm install           # instalar dependencias
npm run dev           # servidor de desarrollo (Vite), puerto 5173
npm run build         # tsc -b && vite build → dist/
npm run preview       # servir dist/ para verificar el build
npm run test:e2e      # correr Playwright contra un backend levantado
```

**No hay script de lint ni de typecheck aislado**: `npm run build` corre `tsc -b` antes de Vite, así que el build falla si hay errores de tipos.

Los E2E requieren credenciales de prueba inyectadas mediante `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` y `E2E_NEW_USER_PASSWORD`. Copiar `.env.e2e.example` como `.env.e2e`, completar los valores localmente y no compartir ni versionar ese archivo. Playwright carga ese archivo solo para los E2E; las variables exportadas en el proceso tienen prioridad. Si falta una variable requerida, la suite falla durante la carga con el nombre de la variable ausente y sin imprimir su valor.

Las credenciales que estuvieron expuestas previamente en el historial del repositorio deben rotarse en el sistema correspondiente. La rotación es una acción externa y no forma parte de este frontend.

Para desarrollo:

1. Levantar primero el backend en `http://localhost:3000` (repo `sistema-inventario-backend`).
2. Levantar el frontend con `npm run dev`.
3. El dev server proxea `/api/*` al backend (ver `vite.config.ts`).

### 2.1. Imagen de producción

El `Dockerfile` construye la SPA con Node.js 22 y `npm ci`, y copia únicamente `dist/` a una imagen Nginx sin privilegios que escucha en el puerto `8080`.

```bash
docker build -t sistema-inventario-frontend:local .
docker run --rm -p 127.0.0.1:8080:8080 \
  -e BACKEND_ORIGIN=https://backend.example.com \
  sistema-inventario-frontend:local
```

`BACKEND_ORIGIN` es obligatorio y acepta únicamente el esquema HTTP(S) y la autoridad del backend, sin credenciales, ruta, consulta, fragmento ni barra final. El backend debe exponer su API bajo `/api`; Nginx conserva ese prefijo al reenviar las solicitudes. La ruta local `/healthz` verifica el proceso del frontend sin consultar el backend.

La configuración de producción también resuelve rutas directas de la SPA mediante `index.html`, evita que errores de `/api` caigan al HTML, conserva la indicación HTTPS válida del proxy frontal, mantiene `index.html` sujeto a revalidación y aplica caché inmutable a los recursos versionados bajo `/assets/`.

### 2.2. Orquestación local con Docker Compose

`compose.yaml` construye el `Dockerfile` anterior y publica el puerto `8080` del contenedor exclusivamente en `http://127.0.0.1:10000`.

Crear el archivo privado de despliegue a partir del ejemplo y completar el origen real del backend localmente:

```bash
cp .env.deploy.example .env.deploy
```

`.env.deploy` está ignorado por Git. `BACKEND_ORIGIN` conserva el contrato descrito en la sección anterior. Compose usa `FRONTEND_ENV_FILE` únicamente para interpolar la ruta de `env_file`; el contenido del archivo seleccionado se inyecta al contenedor y no depende de `--env-file`.

Validar la configuración sin imprimir los valores resueltos:

```bash
docker compose config --quiet
```

El ejemplo versionado también permite validar el modelo sin crear el archivo privado:

```bash
FRONTEND_ENV_FILE=.env.deploy.example docker compose config --quiet
```

Construir e iniciar el servicio:

```bash
docker compose up --build -d
```

Consultar estado, salud y logs acotados:

```bash
docker compose ps
curl --fail --silent --show-error http://127.0.0.1:10000/healthz
docker compose logs --tail=100 frontend
```

Detener y eliminar los recursos del proyecto:

```bash
docker compose down
```

Para actualizar, obtener primero la versión autorizada del repositorio y reconstruir únicamente este servicio:

```bash
docker compose build --pull frontend
docker compose up -d frontend
docker compose ps
```

La publicación fija `127.0.0.1:10000:8080`; por tanto, Docker no expone el frontend en interfaces externas, en `0.0.0.0` ni en el comodín IPv6. En una unidad de trabajo posterior, Tailscale Funnel reenviará el puerto HTTPS público `10000` al destino local `http://127.0.0.1:10000`. La configuración de Funnel y la administración mediante systemd no forman parte de esta orquestación.

---

## 3. Estructura de carpetas

```
src/
├── main.tsx                     # entry point, monta <Providers><App/></Providers>
├── app/
│   ├── App.tsx                  # bootstrap de sesión + RouterProvider
│   ├── providers.tsx            # QueryClientProvider + Toaster
│   └── router.tsx               # definición de rutas
├── components/
│   ├── layout/                  # AppLayout, Header, Sidebar, ProtectedRoute, RoleProtectedRoute, navigation
│   └── ui/                      # primitivas reutilizables (Button, Card, Input, Table, MetricCard, etc.)
├── features/                    # una carpeta por dominio de negocio
│   ├── alerts/
│   ├── auth/
│   ├── categories/
│   ├── inventory/
│   ├── inventory-movements/
│   ├── movements/
│   ├── products/
│   ├── profile/
│   ├── replenishment/
│   ├── suppliers/
│   └── users/
├── lib/
│   ├── axios.ts                 # instancia HTTP con interceptores
│   ├── queryClient.ts           # config global de TanStack Query
│   ├── queryKeys.ts             # árbol tipado de query keys
│   └── utils.ts                 # formatCurrency, formatDate
├── styles/
│   └── index.css                # Tailwind + design tokens en CSS variables
├── types/
│   ├── api.types.ts             # tipos de los DTOs del backend (fuente de verdad)
│   └── common.types.ts          # re-exports + tipos compartidos por UI
└── data/                        # mocks legacy (no consumidos en la app real)
```

**Alias de import**: `@/` → `src/` (configurado en `vite.config.ts` y `tsconfig.app.json`). Todos los imports internos deben usarlo, evitar rutas relativas profundas.

**Convención de carpetas por feature**: cada feature vive bajo `src/features/<dominio>/` y sigue el mismo esqueleto:

```
features/<dominio>/
├── api/          # funciones que llaman a Axios (*.api.ts) + hooks de TanStack Query (use*.ts)
├── components/   # componentes visuales del dominio (tablas, modales)
├── lib/          # mappers de DTO a "row" (view model) y helpers puros del dominio
├── pages/        # componentes de página, montados por el router
├── schemas/      # (opcional) schemas Zod para formularios
└── store/        # (opcional) stores Zustand
```

No todas las features tienen todas las subcarpetas. `alerts` no tiene `components` propios porque reutiliza los del catálogo de productos. `inventory-movements` no tiene `pages` porque se consume desde otras features (`movements`, `inventory`, `products`).

---

## 4. Arquitectura de datos

### 4.1. Cliente HTTP (`src/lib/axios.ts`)

Hay **dos instancias de Axios**:

- `apiClient`: la instancia pública que usa todo el código de la app. Envía `Authorization: Bearer <token>`, corre interceptores, y hace refresh automático en 401.
- `refreshClient`: instancia interna reservada para pegarle a `/auth/refresh`. Vive fuera de los interceptores para evitar bucles infinitos de refresh.

Comportamientos clave:

- `baseURL = '/api'` → siempre pasa por el proxy de Vite en dev, o por la ruta relativa en producción.
- `timeout = 10s`.
- `withCredentials: true` → envía la cookie HttpOnly del refresh token.
- **Interceptor de request**: adjunta el access token en memoria si existe (ver `authSession.ts`).
- **Interceptor de response**: si recibe 401 en una ruta no excluida, llama a `refreshAccessToken()`, marca el request con `_retry` y lo reintenta una sola vez. Si el refresh falla → `clearSessionState()` → el usuario cae a `/login`.
- **Coalescencia de refresh**: un solo `Promise` compartido con `refreshPromise`, así múltiples 401 concurrentes disparan un solo refresh.
- **Versionado de sesión**: si `sessionVersion` cambia entre inicio y fin del refresh, el token nuevo se descarta (protege contra race conditions cuando el usuario hace logout mientras un refresh está en vuelo).

Rutas excluidas del refresh: `/auth/login`, `/auth/refresh`, `/auth/logout`.

### 4.2. TanStack Query (`src/lib/queryClient.ts`, `src/lib/queryKeys.ts`)

Config global:

```ts
{
  staleTime: 5 * 60 * 1000,   // 5 minutos
  retry: 0,                    // sin reintentos automáticos
  refetchOnWindowFocus: false, // sin refetch al cambiar de tab
}
```

**Decisión**: `retry: 0` porque el backend tiene contratos deterministas — un 400/404 no se arregla reintentando, y un 500 se surface a UI para que el usuario decida.

**Query keys**: viven en un objeto tipado (`queryKeys`) en `src/lib/queryKeys.ts`. Estructura jerárquica:

```ts
queryKeys.products.all              // ['products']
queryKeys.products.list(params)     // ['products', 'list', {...}]
queryKeys.products.detail(id)       // ['products', 'detail', <id>]
queryKeys.products.suppliers(id)    // ['products', 'detail', <id>, 'suppliers']
queryKeys.products.movements(id, p) // ['products', 'detail', <id>, 'movements', {...}]
```

**Regla**: nunca escribir un array literal como query key en un componente. Siempre pasar por `queryKeys`. Esto habilita invalidación jerárquica: invalidar `queryKeys.products.all` invalida todas las listas, detalles, y sub-recursos de productos.

**Invalidación compartida**: `receiveReplenishmentInvalidationKeys` es una lista central de keys que deben invalidarse cuando se marca una reposición como recibida (impacta requests, stock de productos, inventario, movimientos y alertas).

### 4.3. Sesión de autenticación (`src/features/auth/`)

La sesión es el único caso de **estado global no-servidor** de la app. Vive en Zustand (`store/auth.store.ts`), no en TanStack Query, porque:

1. El estado de sesión no es "datos remotos que se pueden refrescar" — es un contexto de la app.
2. Muchos componentes leen `role` para gating de UI, y hacerlo por query key sería overhead innecesario.

Piezas:

- **`authSession.ts`**: módulo singleton con el access token en memoria + `localStorage`. Expone `getAccessToken()`, `setAccessToken()`, `clearSessionState()`, y `getSessionVersion()`/`bumpSessionVersion()` para invalidar refreshes en vuelo.
- **`auth.store.ts`** (Zustand): expone `user`, `isBootstrapping`, `login()`, `logout()`, `bootstrapSession()`, `clearSession()`.
- **`auth.api.ts`**: `loginRequest`, `refreshRequest`, `logoutRequest`, `meRequest` — thin wrappers sobre Axios.
- **`permissions.ts`**: matriz `role → permissions[]` y helpers (`hasPermission`, `canManageProducts`, `canCreateMovementType`, etc.). Es la fuente única de verdad para el gating de UI por rol.

**Flujo de bootstrap** (al cargar la app):

```
main.tsx → Providers → App.tsx
  ↓
useEffect → bootstrapSession()
  ↓
¿Hay token en localStorage?
  ├── No  → user=null, isBootstrapping=false, muestra rutas públicas
  └── Sí  → GET /auth/me
            ├── OK    → set user, isBootstrapping=false
            └── 401   → clearSession() → user=null
```

`bootstrapPromise` es un singleton que evita bootstraps concurrentes si `bootstrapSession()` se llama múltiples veces.

### 4.4. Contratos del backend (`src/types/api.types.ts`)

Este archivo es la **fuente única de verdad de tipos DTO**. Cada endpoint del backend tiene su interfaz correspondiente. Cambios en el backend deben reflejarse acá.

Nomenclatura:

- `Foo` → DTO de listado / básico
- `FooDetail` → DTO enriquecido para vistas de detalle
- `FooSummary` → subset de campos usado como embed dentro de otro DTO (evita fan-out en el frontend)
- `PaginatedResponse<T>` → paginación estilo `{ data, meta: { page, limit, total, totalPages } }`
- `PageSizePaginatedResponse<T>` → variante que usa `pageSize` en vez de `limit` (reposición)

Enums de dominio: `UserRole`, `ProductUnit`, `MovementType`, `AdjustmentDirection`, `ReplenishmentStatus`.

### 4.5. Convención "row" (view model)

Los DTO del backend se transforman en **rows** (view models) antes de renderizarse. Cada feature con vista tabular tiene su `lib/xxxRows.ts` con:

- Un tipo `XxxRow` que agrega labels legibles (ej. `activeIngredientLabel = activeIngredient ?? 'Sin principio activo'`).
- Una función `toXxxRow(dto): Row` que aplica la transformación.
- Helpers derivados (ej. `getProductStatus(stock, minStock) → 'Optimo' | 'Critico' | 'Agotado'`).

**Regla**: los componentes de UI **no leen DTOs crudos**. Siempre trabajan con rows. Esto:

1. Aísla la UI de cambios en el contrato del backend.
2. Centraliza los "labels de vacío" (`'Sin categoría'`, `'No enviada'`, etc.).
3. Facilita testing de la lógica de presentación sin montar componentes.

---

## 5. Routing y protección

Definido en `src/app/router.tsx` con `createBrowserRouter`.

Estructura:

```
/login                          → LoginPage (público)
/                               → <ProtectedRoute>       (requiere sesión)
  └── <AppLayout>                                        (chrome: sidebar + header)
      ├── /productos            → ProductsPage
      ├── /inventario           → InventoryPage
      ├── /movimientos          → MovementsPage
      ├── /alertas              → AlertsPage
      ├── /reposicion           → <RoleProtectedRoute permission="view:replenishment">
      ├── /proveedores          → <RoleProtectedRoute permission="view:suppliers">
      ├── /usuarios             → <RoleProtectedRoute permission="view:users">
      └── /perfil               → ProfilePage
```

Dos capas de protección:

- **`ProtectedRoute`**: exige que exista `user` en el auth store. Si no, redirige a `/login` guardando el `location.from` para volver después del login.
- **`RoleProtectedRoute`**: exige un `AppPermission` específico. Si el rol no lo tiene, redirige a `/productos` (ruta safe por defecto).

**El sidebar también respeta permisos**: `Sidebar.tsx` filtra `navigation.filter(item => hasPermission(user?.role, item.permission))`. Un OPERATOR nunca ve el link de "Usuarios".

### 5.1. Layout responsive

`AppLayout.tsx` implementa:

- Sidebar fijo en desktop (≥768px), drawer overlay en mobile.
- Header que se auto-oculta al scrollear hacia abajo en mobile (`isChromeVisible`).
- Cierra el sidebar automáticamente al cambiar de ruta.

---

## 6. Sistema de diseño

**Tailwind 4** con design tokens como **CSS variables** definidas en `src/styles/index.css`. Los componentes usan clases como `bg-[var(--color-surface)]` en vez de valores directos.

Tokens principales:

- Colores: `--color-primary`, `--color-primary-strong`, `--color-surface`, `--color-surface-strong`, `--color-surface-tint`, `--color-page-bg`, `--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-danger-*`, `--color-warning-*`, `--color-success-*`, `--color-info-*`.
- Radios: `--radius-panel`, `--radius-control`.
- Fuentes: `font-data-mono` para código de producto, IDs, cantidades.

**Regla**: nuevos componentes deben usar tokens, no hex literales. Los pocos hex hardcodeados que quedan (ej. en `LoginPage`) son deuda técnica.

### 6.1. Primitivas de UI (`src/components/ui/`)

| Componente   | Rol                                                  |
| ------------ | ---------------------------------------------------- |
| `Button`     | Botón base con variantes `primary` / `secondary`     |
| `Card`       | Contenedor con borde suave y padding standard        |
| `Input`      | Input controlado con estilos consistentes            |
| `Loading`    | Spinner centrado                                     |
| `MetricCard` | Card para métricas con `tone` (default/success/warning/danger/info) |
| `Table`      | Wrapper visual base para tablas                      |
| `Badge`      | Pill de estado                                       |

**No hay librería de componentes tipo shadcn / Radix**. Todo es propio, minimal, sin dependencias externas de componentes.

---

## 7. Patrones aplicados

### 7.1. Container / Presentational

Las páginas son **containers**: manejan estado local (query, filtros, modales), hacen los queries, y pasan datos ya masticados a componentes visuales.

Los componentes bajo `components/` son **presentationales**: reciben props tipados, no llaman a Axios ni a stores. Son testeables aisladamente.

Excepciones controladas: los modales de mutación (`ProductCatalogModals`, `SupplierModals`, etc.) sí llaman a `useMutation` internamente, porque el ciclo de vida del modal está acoplado a la mutación.

### 7.2. "Rows" como view model

Ya explicado en 4.5. Es un mapper puro entre DTO y UI.

### 7.3. Modales agrupados por dominio

Cada dominio con múltiples modales expone **un componente switch** que renderiza el modal activo según `modalType`:

```tsx
<ProductCatalogModals
  modalType={activeModal}
  product={selectedProduct}
  onClose={closeModal}
  onOpenModal={openModal}
  role={user?.role}
/>
```

Alternativa considerada: portals independientes por modal. Descartada porque agrupar reduce el volumen de props duplicadas y centraliza el manejo del estado `activeModal`.

### 7.4. Invalidación explícita post-mutación

Las mutaciones no confían en `staleTime`: llaman explícitamente a `queryClient.invalidateQueries` para las keys afectadas. Ejemplo en `useCreateInventoryMovement`:

```ts
onSuccess: async (movement) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryMovements.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(movement.productId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all }),
  ])
}
```

**Regla**: una mutación debe invalidar TODAS las queries cuyo resultado pueda haber cambiado. Cuando la lista es grande y se comparte con otras mutaciones, extraerla a `queryKeys.ts` (ver `receiveReplenishmentInvalidationKeys`).

### 7.5. Placeholders para DTOs incompletos

Reposición usa **placeholders defensivos** (`REPLENISHMENT_SUPPLIER_PLACEHOLDER`, etc.) porque los DTOs traen los summaries como opcionales. Si el backend deja de mandar el summary embebido, la UI muestra `[AQUI SE DEBERÍA MOSTRAR EL PROVEEDOR]` en vez de romperse con `undefined`. Es un canario visible.

---

## 8. Manejo de errores

- **Errores de query**: cada página muestra un mensaje state-message inline (`No fue posible cargar los <cosa> reales`). No hay error boundary global.
- **Errores de mutación**: se surfacen con `react-hot-toast`. El texto sale del `ApiErrorEnvelope` del backend (`error.response.data.message`), con fallback genérico.
- **Errores de auth (401)**: manejados por el interceptor de Axios. El usuario no ve el 401 crudo — ve la redirección a `/login`.
- **Formularios**: React Hook Form + `zodResolver`. Los errores de validación se renderizan bajo cada campo.

---

## 9. Cómo agregar una feature nueva

Ejemplo: agregar módulo "Lotes de vencimiento".

1. **Crear la carpeta**: `src/features/expiration-batches/`.
2. **Definir DTOs** en `src/types/api.types.ts`. Nunca crear tipos en el archivo de la feature — el contrato con el backend es global.
3. **Agregar query keys** en `src/lib/queryKeys.ts` siguiendo la jerarquía existente.
4. **Crear la capa API**:
   - `api/expirationBatches.api.ts` con las funciones Axios (`listExpirationBatches`, `getExpirationBatch`, etc.).
   - `api/useExpirationBatches.ts` con los hooks `useQuery` / `useMutation`.
5. **Crear el view model** en `lib/expirationBatchRows.ts`.
6. **Crear componentes** en `components/` (tabla, modales).
7. **Crear la página** en `pages/ExpirationBatchesPage.tsx`.
8. **Agregar permiso** en `src/features/auth/lib/permissions.ts`: nuevo `AppPermission` + entradas en `rolePermissions`.
9. **Agregar navegación** en `src/components/layout/navigation.ts`: nuevo `NavigationItem` con `permission`.
10. **Agregar la ruta** en `src/app/router.tsx`. Envolver en `<RoleProtectedRoute permission="view:expiration-batches">` si es de acceso restringido.
11. **Verificar** con `npm run build`.

---

## 10. Índice de módulos

Cada módulo tiene su propia guía en `docs/frontend/modules/`:

- [`auth.md`](modules/auth.md) — Login, sesión, refresh, permisos, ruteo protegido.
- [`products.md`](modules/products.md) — Catálogo, CRUD, gestión de categorías y proveedores por producto.
- [`inventory.md`](modules/inventory.md) — Vista de existencias derivada de productos.
- [`movements.md`](modules/movements.md) — Historial de movimientos de stock.
- [`inventory-movements.md`](modules/inventory-movements.md) — Capa API compartida de movimientos (feature "servicio").
- [`alerts.md`](modules/alerts.md) — Alertas de stock derivadas, badge en sidebar.
- [`replenishment.md`](modules/replenishment.md) — Solicitudes de reposición y su máquina de estados.
- [`suppliers.md`](modules/suppliers.md) — Proveedores, asociación con productos.
- [`users.md`](modules/users.md) — Gestión de usuarios y roles.
- [`categories.md`](modules/categories.md) — Categorías de productos (modal global).
- [`profile.md`](modules/profile.md) — Vista de perfil del usuario autenticado.

---

## 11. Deuda técnica y gotchas conocidos

- `src/data/mockDatabase.ts` y `mockSelectors.ts` son código legacy de la fase de mocks. Ya no se consumen desde ninguna página real; se dejaron por si alguna suite E2E los usa.
- Algunas páginas antiguas usan hex hardcodeados en vez de tokens (`LoginPage`, `ProductsPage`). Migrar a `var(--color-*)` cuando se toquen.
- `MovementsPage` tiene un input readonly con `"01/06 - 08/06"` como placeholder de un date range picker que nunca se implementó.
- `ReplenishmentPage` usa placeholders `[AQUI SE DEBERÍA MOSTRAR...]` cuando el backend devuelve DTOs sin summaries embebidos. Si esos textos aparecen en producción, es un bug del backend (falta de enrichment).
- No hay tests unitarios de frontend, solo E2E con Playwright.
- El script `npm run test:e2e` requiere que el backend esté corriendo. No hay MSW ni mocks de red para las suites.
