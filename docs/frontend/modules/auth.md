# Módulo `auth`

Autenticación, sesión, refresh de tokens, matriz de permisos y ruteo protegido.

Este módulo es **la base de todo lo demás**: cualquier feature con acceso restringido depende de él.

---

## Responsabilidades

- Login contra `/api/auth/login` (email + password).
- Persistencia del access token JWT en memoria y `localStorage`.
- Refresh silencioso de tokens vencidos (401 → refresh → retry, sin que el usuario lo note).
- Bootstrap de sesión al cargar la app (recupera al usuario si hay token válido).
- Logout con revocación server-side.
- Matriz de permisos por rol para gating de UI y rutas.

---

## Estructura

```
src/features/auth/
├── api/
│   └── auth.api.ts              # loginRequest, refreshRequest, logoutRequest, meRequest
├── lib/
│   ├── authSession.ts           # token en memoria + localStorage + versionado
│   └── permissions.ts           # AppPermission, rolePermissions, helpers
├── pages/
│   └── LoginPage.tsx            # formulario de login con RHF + Zod
├── schemas/
│   └── auth.schema.ts           # loginSchema (Zod)
└── store/
    └── auth.store.ts            # Zustand: user, isBootstrapping, login/logout/bootstrap
```

---

## Endpoints consumidos

| Método | Path            | Uso                                        |
| ------ | --------------- | ------------------------------------------ |
| POST   | `/auth/login`   | Login con email/password → user + JWT      |
| POST   | `/auth/refresh` | Rotación silenciosa del access token       |
| POST   | `/auth/logout`  | Invalida refresh token en el backend       |
| GET    | `/auth/me`      | Bootstrap: recupera al user actual         |

Body de login (`LoginFormValues`):

```ts
{ email: string; password: string }
```

Response de login (`LoginResponse`):

```ts
{ user: AuthUser; token: string }   // token es el JWT de access
```

El **refresh token** viaja como cookie HttpOnly seteada por el backend. El frontend nunca lo lee ni lo maneja — solo confía en que `withCredentials: true` la envía en cada request a `/auth/refresh`.

---

## Store de sesión (Zustand)

`src/features/auth/store/auth.store.ts` expone:

```ts
interface AuthState {
  user: AuthUser | null
  isBootstrapping: boolean
  login: (email, password) => Promise<AuthUser>
  logout: () => Promise<void>
  bootstrapSession: () => Promise<void>
  clearSession: () => void
}
```

### Bootstrap

Al montarse `<App/>`, se dispara `bootstrapSession()`:

1. Si no hay token en `localStorage` → `user = null`, `isBootstrapping = false`, fin.
2. Si hay token → llama `GET /auth/me`.
3. Si el `me` retorna 200 → guarda el user.
4. Si retorna 401/403 → `clearSession()`.
5. Cualquier otro error → deja `user = null` pero no limpia la sesión (podría ser un problema de red temporal).

`bootstrapPromise` es un singleton para evitar bootstraps concurrentes (por ejemplo si `<App/>` se remonta en dev por HMR).

### Login

```ts
login: async (email, password) => {
  const { user, token } = await loginRequest({ email, password })
  setAccessToken(token)   // guarda en memoria + localStorage
  set({ user })
  return user
}
```

### Logout

```ts
logout: async () => {
  try {
    await logoutRequest()   // POST /auth/logout — best-effort
  } finally {
    get().clearSession()    // limpia local aunque el request falle
  }
}
```

**Regla**: aunque el request de logout falle (red caída, backend down), el frontend limpia la sesión local. Es preferible dejar al usuario "logueado en el servidor pero fuera en el cliente" que dejarlo dentro visualmente con un backend que ya no lo reconoce.

### `clearSession` como side-effect global

`clearSession()` no solo limpia el store — dispara `clearSessionState()` en `authSession.ts`, que:

1. Bumpea el `sessionVersion` (invalida refreshes en vuelo).
2. Borra el token de memoria y `localStorage`.
3. Ejecuta el `sessionClearedHandler` registrado por el store (que hace `setState({ user: null, isBootstrapping: false })`).

Esta indirección permite que el interceptor de Axios pueda llamar a `clearSessionState()` (desde `lib/axios.ts`) sin depender directamente del store — evita ciclos de import.

---

## `authSession.ts` — módulo singleton

Vive fuera del store porque los interceptores de Axios lo necesitan **síncronamente** en cada request. Un store React se leería con hooks, y los interceptores no son componentes.

Estado interno:

- `accessToken: string | null` — inicializado desde `localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)`.
- `sessionVersion: number` — contador que se incrementa en cada `clearSession`.
- `sessionClearedHandler: () => void | null` — callback que el store registra al inicializarse.

API pública:

- `getAccessToken()` / `setAccessToken(token)` — set + persist en `localStorage`.
- `getSessionVersion()` / `bumpSessionVersion()` — para detectar races durante el refresh.
- `registerSessionClearedHandler(fn)` — el store se registra acá al importarse.
- `clearSessionState()` — limpia todo y notifica al handler.

### Race protection del refresh

En `lib/axios.ts`, cuando arranca un refresh:

```ts
const versionAtStart = getSessionVersion()
const { data } = await refreshClient.post('/auth/refresh')
if (getSessionVersion() !== versionAtStart) {
  throw new Error('Session changed while refreshing token.')
}
setAccessToken(data.token)
```

**Escenario que protege**: usuario hace logout mientras un refresh está en vuelo. El refresh vuelve con un token válido, pero como la versión cambió, no lo guardamos. Evita "resucitar" una sesión que el usuario ya cerró.

---

## `permissions.ts` — matriz de permisos

Fuente única de verdad para gating de UI por rol.

### Permisos definidos

```ts
type AppPermission =
  | 'view:products'         | 'manage:products'
  | 'view:inventory'
  | 'view:movements'        | 'create:movement:any' | 'create:movement:out'
  | 'view:alerts'
  | 'view:replenishment'    | 'manage:replenishment'
  | 'view:suppliers'        | 'manage:suppliers'
  | 'view:users'            | 'manage:users'
  | 'view:profile'
```

### Matriz por rol

| Permiso                  | ADMIN | MANAGER | OPERATOR |
| ------------------------ | :---: | :-----: | :------: |
| `view:products`          |  ✅   |   ✅    |    ✅    |
| `manage:products`        |  ✅   |   ✅    |    ❌    |
| `view:inventory`         |  ✅   |   ✅    |    ✅    |
| `view:movements`         |  ✅   |   ✅    |    ✅    |
| `create:movement:any`    |  ✅   |   ✅    |    ❌    |
| `create:movement:out`    |  ❌   |   ❌    |    ✅    |
| `view:alerts`            |  ✅   |   ✅    |    ✅    |
| `view:replenishment`     |  ✅   |   ✅    |    ❌    |
| `manage:replenishment`   |  ✅   |   ✅    |    ❌    |
| `view:suppliers`         |  ✅   |   ✅    |    ❌    |
| `manage:suppliers`       |  ✅   |   ✅    |    ❌    |
| `view:users`             |  ✅   |   ❌    |    ❌    |
| `manage:users`           |  ✅   |   ❌    |    ❌    |
| `view:profile`           |  ✅   |   ✅    |    ✅    |

**Regla clave**: el OPERATOR solo puede crear movimientos de tipo `OUT` (salida). No puede crear entradas ni ajustes. `canCreateMovementType(role, type)` implementa esa lógica.

### Helpers

- `hasPermission(role, permission)` — check base.
- `canManageProducts(role)` / `canManageSuppliers(role)` / `canManageUsers(role)` — shortcuts semánticos.
- `canViewRoute(role, permission)` — alias de `hasPermission`.
- `canCreateMovementType(role, type)` — considera `create:movement:any` y `create:movement:out`.

### Cómo agregar un permiso nuevo

1. Agregar el string al type `AppPermission`.
2. Agregar el permiso a los arrays de los roles correspondientes en `rolePermissions`.
3. Si el permiso protege una ruta → agregar `<RoleProtectedRoute permission="nuevo:permiso">` en el router.
4. Si protege un item de sidebar → agregar `permission: 'nuevo:permiso'` al `NavigationItem`.

**No definir permisos ad-hoc en cada feature**. Todo pasa por `permissions.ts`.

---

## LoginPage

Formulario simple con React Hook Form + Zod (`loginSchema`).

Comportamiento:

- Al montar, si el usuario intentaba entrar a una ruta protegida, la ruta original queda en `location.state.from.pathname`. Después del login exitoso, navega ahí; si no, va a `/`.
- Errores del backend se surfacean con `react-hot-toast`, tomando el `message` del `ApiErrorEnvelope`.
- Botón de mostrar/ocultar password con `Eye`/`EyeOff` de lucide.
- No hay "recordarme" (el refresh token cookie ya persiste la sesión entre reloads).
- El link "Olvidaste tu contraseña" es visual — **no hay flujo de recuperación** implementado.

### Validación (Zod)

```ts
loginSchema = z.object({
  email: z.string().email('Ingresa un correo valido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})
```

Nota: la longitud mínima es del cliente. El backend puede tener reglas más estrictas.

---

## Componentes de ruteo protegido

Viven en `src/components/layout/`, no en `features/auth/`, porque son componentes de infraestructura del router.

### `ProtectedRoute`

```tsx
if (isBootstrapping) return <Loading />
if (!user) return <Navigate replace state={{ from: location }} to="/login" />
return <Outlet />
```

Envuelve **todas las rutas autenticadas**. Muestra loading mientras el bootstrap corre, redirige a login si no hay user.

### `RoleProtectedRoute`

```tsx
if (!hasPermission(user?.role, permission)) {
  return <Navigate replace to="/productos" />
}
return <Outlet />
```

Se usa en rutas con acceso restringido. Redirige a `/productos` (ruta safe universal) si el rol no tiene el permiso.

**Decisión de redirect target**: `/productos` porque los tres roles tienen `view:products`. Si en el futuro el OPERATOR pierde acceso a productos, hay que revisar este fallback.

---

## Flujo end-to-end de una request autenticada

```
1. Componente llama al hook: useProducts() → useQuery → listProducts()
2. Axios request se prepara
3. Interceptor request: adjunta Authorization: Bearer <token>
4. Backend valida JWT
5a. OK → 200 → data llega al hook
5b. Token expirado → 401
    ↓
    Interceptor response detecta 401
    ↓
    ¿Es ruta excluida (/auth/*)? Sí → propaga el error
    ↓
    ¿Ya intentó retry (_retry=true)? Sí → propaga el error
    ↓
    refreshAccessToken() (coalescido por refreshPromise)
      ↓
      POST /auth/refresh con cookie
        ↓
        200 → nuevo token → setAccessToken → retry request original
        ↓
        401 → clearSessionState → propaga error → user cae a /login
```

---

## Gotchas

- **El token vive en `localStorage`**. Es vulnerable a XSS. Mitigación: el refresh token va en cookie HttpOnly, así que un atacante con XSS solo tiene un access token de duración limitada (10 min según config del backend). Un token store más seguro sería in-memory-only + refresh, pero se perdería la persistencia entre reloads.
- **`bootstrapPromise` en HMR**: en desarrollo, HMR puede remontar `<App/>`. El singleton evita duplicar el bootstrap; si ves comportamiento raro en dev pero no en producción, revisá que el promise se resetee en el `finally`.
- **`sessionClearedHandler` se registra una sola vez al importar `auth.store.ts`**. Si se hace tree-shaking agresivo y el store no se importa, el handler nunca se registra y `clearSessionState()` no notifica al store. En la práctica esto no pasa porque `<App/>` importa el store directamente.
- **La cookie del refresh token requiere `withCredentials: true` en Axios y CORS con `credentials: true` en el backend**. Si un dev cambia el backend sin coordinar, el refresh silencioso deja de funcionar y todos los usuarios ven "sesión expirada" cada 10 minutos.
