# Módulo `profile`

Vista de perfil del usuario autenticado. Solo lectura.

---

## Responsabilidades

- Mostrar los datos del usuario logueado (nombre, email, teléfono, rol).

---

## Estructura

```
src/features/profile/
└── pages/
    └── ProfilePage.tsx
```

Sin `api/`, sin `components/`, sin `lib/`. Es la feature más simple del sistema.

---

## Datos que consume

Lee directamente del store de auth:

```ts
const user = useAuthStore((state) => state.user)
```

**No hace requests propios**. Todos los datos vienen del `AuthUser` cacheado en el store desde el login/bootstrap.

---

## Ruteo

Ruta: `/perfil`.
Permiso: `view:profile`. Todos los roles lo tienen — es una vista neutral disponible para cualquier usuario logueado.

Se accede desde el sidebar (item separado abajo, junto al botón de logout).

---

## Traducción de roles

```ts
const roleLabels = {
  ADMIN: 'Administrador',
  MANAGER: 'Encargado de inventario',
  OPERATOR: 'Personal operativo',
}
```

Diccionario local. Nota: es distinto del que usa `users` (`'Administrador' / 'Encargado' / 'Operativo'`). Ambos módulos definen labels propios en vez de tener un único diccionario compartido — deuda técnica menor.

---

## UI

Layout de dos columnas (`grid-cols-[minmax(0,0.9fr)_minmax(280px,0.6fr)]` en desktop):

- Columna izquierda: card con los datos del usuario en grid 2x2 (nombre, correo, teléfono, rol).
- Columna derecha: card con una nota descriptiva sobre la convención visual usada en el sistema.

---

## Gotchas

- **No hay edición de perfil**. El usuario no puede cambiar su nombre, email, teléfono ni contraseña desde acá. Solo el ADMIN puede editar usuarios (incluido a sí mismo, con restricciones) desde `/usuarios`.
- **`user` puede ser `null` transitoriamente** si el store aún no bootstrapeó. Todos los campos hacen `?? 'No disponible'`.
- **La card derecha es texto estático de marketing/onboarding visual**. Deuda: reemplazar por acciones reales (cambiar password, cerrar sesiones activas, etc.).
- **Doble diccionario de roles** entre este módulo y `users`. Consolidar en `features/auth/lib/permissions.ts` como `roleLabels` compartido si se toca.
