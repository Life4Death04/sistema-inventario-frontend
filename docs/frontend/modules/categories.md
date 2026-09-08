# Módulo `categories`

Gestión de categorías de productos. No tiene página propia — se accede mediante un modal global desde el catálogo de productos.

---

## Responsabilidades

- Listar categorías.
- CRUD desde un modal centralizado (`CategoryManagementModal`).
- Proveer el catálogo de categorías al resto de módulos para displays y selects.

---

## Estructura

```
src/features/categories/
├── api/
│   ├── categories.api.ts          # CRUD
│   └── useCategories.ts           # hook de listado
└── components/
    └── CategoryManagementModal.tsx
```

Sin `pages/` propio. Sin `lib/` (no requiere transformación — los DTOs se consumen directos).

---

## Endpoints consumidos

| Método | Path                | Función                    |
| ------ | ------------------- | -------------------------- |
| GET    | `/categories`       | `listCategories(params)`   |
| GET    | `/categories/:id`   | `getCategory(id)`          |
| POST   | `/categories`       | `createCategory(input)`    |
| PATCH  | `/categories/:id`   | `updateCategory(id, in)`   |
| DELETE | `/categories/:id`   | `deleteCategory(id)`       |

---

## Tipos

```ts
interface Category {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

interface CreateCategoryInput {
  name: string
  description?: string
}

interface UpdateCategoryInput {
  name?: string
  description?: string | null
}
```

---

## Modal (`CategoryManagementModal`)

Modal global que se abre desde el header del catálogo de productos (`ProductsPage`) con el botón "Categorías". Solo visible si `canManageProducts(role)`.

### UI

Slider lateral que ocupa la mitad derecha de la pantalla. Contenido:

- Header: título + botón cerrar.
- Formulario superior: crear nueva categoría (name + description).
- Lista inferior: cada categoría con edit inline + botón borrar.

### Reglas

- **No se puede borrar una categoría que tiene productos asociados**. Backend responde 409 (`CATEGORY_HAS_PRODUCTS`). Frontend muestra toast con el mensaje.
- **Nombres únicos**. Backend valida y devuelve 409 (`CATEGORY_NAME_TAKEN`) si se repite.

### Invalidación

Cualquier mutación invalida:

```ts
queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
```

Y opcionalmente `queryKeys.products.all` si la mutación puede afectar cómo se resuelven los nombres de categoría en el catálogo (por ejemplo, rename).

---

## Consumo en otros módulos

`useCategories` se llama desde:

- **`products`**: para el select del formulario y para resolver `categoryName` en el detalle.
- **`inventory`**: para el select de filtro y para resolver el nombre de categoría en cada row.
- **`alerts`**: para resolver el nombre de categoría en el `ProductRow` embebido.

**Patrón**: casi siempre se llama con `{ limit: 100 }`. Si el sistema supera 100 categorías, hay que paginar y todas las llamadas van a mostrar solo las primeras 100.

Optimización implícita: comparten `queryKey`, así que un solo request cubre a todas las vistas.

---

## Dependencias cross-módulo

- **`products`**: dispara la apertura del modal.
- **`auth`**: gating con `manage:products` (no hay permiso dedicado `manage:categories` — se asume que quien gestiona productos gestiona categorías).

---

## Gotchas

- **Sin permiso propio**: la matriz de permisos no tiene `manage:categories`. Se reusa `manage:products`. Si en el futuro se separan (por ejemplo, un rol "Category Manager"), hay que agregar el permiso y refactorear el gating del modal.
- **El modal se puebla con `limit: 100`**. Escalado limitado.
- **No hay confirmación de borrado**. El botón elimina directo. Deuda técnica: agregar confirm modal antes del delete.
- **Editar inline es propenso a errores**: cambio de foco puede disparar update. Verificar el debounce.
- **La categoría "Sin categoría"** que se muestra en productos sin categoría es un label del frontend (`toProductRow`). No existe como entidad real. Si el backend permite `categoryId: null`, el label aparece; si no, es sintáctico.
