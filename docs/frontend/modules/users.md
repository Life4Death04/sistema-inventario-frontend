# Módulo `users`

Gestión de usuarios del sistema. Solo accesible por ADMIN.

---

## Responsabilidades

- CRUD de usuarios.
- Filtros por rol (Todos / Administradores / Encargados / Operativos).
- Métricas por rol.

---

## Estructura

```
src/features/users/
├── api/
│   ├── users.api.ts               # CRUD
│   └── useUsers.ts                # hook de listado
├── components/
│   ├── UserModals.tsx             # detail, create, edit
│   └── UsersTanStackTable.tsx
├── lib/
│   └── userRows.ts                # toUserRow + labels
└── pages/
    └── UsersPage.tsx
```

---

## Endpoints consumidos

| Método | Path             | Función                    |
| ------ | ---------------- | -------------------------- |
| GET    | `/users`         | `listUsers(params)`        |
| GET    | `/users/:id`     | `getUser(id)`              |
| POST   | `/users`         | `createUser(input)`        |
| PATCH  | `/users/:id`     | `updateUser(id, input)`    |
| DELETE | `/users/:id`     | `deleteUser(id)`           |

---

## Tipos

```ts
interface AuthUser {
  id: string
  fullName: string
  email: string
  role: UserRole                // 'ADMIN' | 'MANAGER' | 'OPERATOR'
  active: boolean
  phone: string | null
  createdAt: string
}

interface User extends AuthUser {
  updatedAt: string
}
```

`AuthUser` es el shape mínimo que expone `/auth/me`. `User` es la variante con `updatedAt` para vistas administrativas.

### Input de create/update

```ts
interface CreateUserInput {
  fullName: string
  email: string
  password: string
  role?: UserRole      // default MANAGER en backend
  phone?: string
}

interface UpdateUserInput {
  fullName?: string
  email?: string
  password?: string
  role?: UserRole
  phone?: string
  active?: boolean
}
```

**Regla del password**: nunca vuelve en las respuestas GET. Solo se acepta en POST (create) y PATCH (change password).

---

## Página (`UsersPage`)

### Acceso

Ruta protegida por `<RoleProtectedRoute permission="view:users">`. Solo ADMIN.

### Estado local

```ts
const [query, setQuery] = useState('')
const [roleFilter, setRoleFilter] = useState<'ALL' | UserRow['roleKey']>('ALL')
const [activeModal, setActiveModal] = useState<UserModalType | null>(null)
const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
```

### Métricas

```ts
{
  active:    users.filter(u => u.active).length,
  admins:    users.filter(u => u.roleKey === 'ADMIN').length,
  managers:  users.filter(u => u.roleKey === 'MANAGER').length,
  operators: users.filter(u => u.roleKey === 'OPERATOR').length,
}
```

---

## View model — `UserRow`

Definido en `lib/userRows.ts`. Agrega:

- `roleKey: UserRole` — el enum crudo.
- `roleLabel: string` — traducción a español (`'Administrador'`, `'Encargado'`, `'Operativo'`).
- Otros labels de vacío estándar (`phoneLabel = phone ?? 'Sin teléfono'`).

Los filtros de rol usan `roleKey` (para no acoplarse a strings de UI); los renderers usan `roleLabel`.

---

## Modales (`UserModals`)

| `modalType`  | Función                              |
| ------------ | ------------------------------------ |
| `'detail'`   | Ver info del usuario                 |
| `'create'`   | Nuevo usuario                        |
| `'edit'`     | Editar (incluye cambiar rol y activar/desactivar) |

**No hay modal de delete confirmation dedicado** — se maneja desde el modal de edición con toggle de `active`.

### Reglas de negocio (validadas en backend, protegidas en frontend)

- **No se puede desactivar al último ADMIN**. El backend responde 400 con `LAST_ADMIN_LOCK`. El frontend surfacea el error con toast.
- **No se puede editar el propio usuario** para cambiar el rol o desactivarlo (evita que un admin se auto-elimine). Backend valida.
- **El password es opcional en edición** — si el campo viene vacío, no se actualiza.
- **El email debe ser único**. Backend responde 409 si ya existe.

---

## Tabla (`UsersTanStackTable`)

Columnas: nombre completo, email, rol (badge), teléfono, estado, acciones.

Acciones: **Ver detalle** y **Editar** (solo si `canManage`). No hay botón "Eliminar" — se hace desde el modal de edición.

---

## Dependencias cross-módulo

- **`auth`**: comparte el tipo `AuthUser` y el enum `UserRole`. Gating con `manage:users` y `view:users`.
- **`profile`**: muestra el mismo tipo de datos que este módulo, pero solo del usuario autenticado (self-view).

---

## Gotchas

- **La creación de usuario requiere password**. La UI debería recordarle al ADMIN comunicar la contraseña al nuevo usuario por canal seguro (no está automatizado).
- **`role` default en backend es `MANAGER`** si no se envía. El frontend siempre lo envía explícito para evitar sorpresas.
- **No hay flujo de "resetear contraseña"** — solo cambiar desde el modal de edición. El usuario final no puede cambiar su propia contraseña desde `/perfil` (feature futura).
- **Al desactivar un usuario, sus sesiones activas no se invalidan automáticamente**. El backend rechaza requests con tokens de usuarios inactivos, pero el user con token en memoria puede seguir viendo la UI hasta que haga una request. Considerar un poll de `/auth/me` en el sidebar o un websocket para invalidar en tiempo real (fuera de alcance de tesis).
- **El botón "Nuevo usuario" está siempre visible** para el ADMIN, pero el limit de usuarios no está capado. Escalable sin cambios de UI.
