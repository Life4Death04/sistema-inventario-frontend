# Módulo `products`

Catálogo de productos: listado, alta, edición, detalle, desactivación. Es el módulo más grande del frontend y el más entrelazado con otros dominios (inventario, movimientos, alertas, reposición, categorías, proveedores).

---

## Responsabilidades

- Listar productos activos (paginados, con búsqueda por texto).
- CRUD completo para roles ADMIN/MANAGER.
- Detalle enriquecido con categoría, proveedores asociados y últimos 3 movimientos.
- Punto de entrada para acciones cross-módulo: registrar movimiento, generar reposición desde un producto, gestionar categorías, gestionar asociación producto-proveedor.
- Métricas de estado del catálogo (críticos, agotados) en el header.

---

## Estructura

```
src/features/products/
├── api/
│   ├── products.api.ts          # funciones Axios + tipos de input
│   └── useProducts.ts           # hooks: useProducts, useProductDetail, useProductSuppliers
├── components/
│   ├── ProductCatalogModals.tsx # switch de modales (detail, create, edit, movement, replenishment, deactivate)
│   └── ProductsTanStackTable.tsx
├── lib/
│   └── productRows.ts           # toProductRow + getProductStatus
└── pages/
    └── ProductsPage.tsx
```

---

## Endpoints consumidos

| Método | Path                                        | Función                              |
| ------ | ------------------------------------------- | ------------------------------------ |
| GET    | `/products`                                 | `listProducts(params)`               |
| GET    | `/products/:id`                             | `getProduct(id)` → `ProductDetail`   |
| POST   | `/products`                                 | `createProduct(input)`               |
| PATCH  | `/products/:id`                             | `updateProduct(id, input)`           |
| DELETE | `/products/:id`                             | `deleteProduct(id)`                  |
| GET    | `/products/:id/suppliers`                   | `listProductSuppliers(productId)`    |
| POST   | `/products/:id/suppliers`                   | `attachProductSupplier(id, input)`   |
| DELETE | `/products/:id/suppliers/:supplierId`       | `detachProductSupplier(id, sid)`     |
| GET    | `/products/:id/inventory-movements`         | `listProductMovements(id, params)`   |

### Query params soportados en `listProducts`

```ts
{
  page?: number
  pageSize?: number
  search?: string
  categoryId?: string
  active?: boolean
  lowStock?: boolean
  supplierId?: string
  orderBy?: 'name' | 'stock' | 'price' | 'createdAt'
  order?: 'asc' | 'desc'
}
```

Los booleanos se serializan como strings (`'true'` / `'false'`) porque Axios los pasa como query params y el backend Express los parsea desde string. Esto lo hace `normalizeListProductsParams`.

---

## Tipos

`Product` (listado, ver `types/api.types.ts`):

```ts
{
  id: string
  code: string
  name: string
  activeIngredient: string | null
  description: string | null
  presentation: string | null
  brand: string | null
  unit: ProductUnit         // 'MG' | 'G' | 'KG' | 'ML' | 'L' | 'UNIT'
  unitContent: string       // decimal como string
  categoryId: string
  stock: number
  minStock: number
  price: string | null      // decimal como string; puede ser null (precios opcionales)
  active: boolean
  createdAt: string
  updatedAt: string
}
```

`ProductDetail extends Product`:

```ts
{
  category: ProductCategorySummary | null
  suppliers: ProductSupplierEntry[]   // [{ supplier: {...}, referencePrice: string | null }]
}
```

**Precios como strings**: los `Decimal` del backend se serializan como strings para no perder precisión. La conversión a número se hace solo cuando se necesita para cálculo, no para display.

---

## Hooks

```ts
useProducts(params?)              // lista paginada
useProductDetail(id | null)       // detalle enriquecido; disabled si id es null
useProductSuppliers(productId)    // proveedores asociados
```

Los tres son `useQuery`. Las mutaciones (`create`, `update`, `delete`, `attach/detach supplier`) se declaran **inline en `ProductCatalogModals.tsx`** con `useMutation`, no en `useProducts.ts`. Es intencional: cada mutación es específica del modal que la dispara, y llevar la lista de invalidaciones al hook global lo haría demasiado genérico.

---

## View model (`toProductRow`)

Transforma `Product` en `ProductRow` para consumo por la tabla:

- Agrega labels de vacío: `activeIngredientLabel = activeIngredient ?? 'Sin principio activo'`.
- Agrega `category: string` (el nombre resuelto, no el id).
- Deriva `status` con `getProductStatus(stock, minStock)`:
  - `stock === 0` → `'Agotado'`
  - `stock <= minStock` → `'Critico'`
  - otherwise → `'Optimo'`

Este `status` es el mismo que se usa en Inventario y en Alertas — mismo cálculo, tres módulos.

---

## Página (`ProductsPage`)

Estado local:

```ts
const [query, setQuery] = useState('')
const [openMenuId, setOpenMenuId] = useState<string | null>(null)  // menú de acciones abierto
const [activeModal, setActiveModal] = useState<ProductModalType | null>(null)
const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null)
const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
```

Queries:

```ts
useCategories({ limit: 100 })
useProducts({ active: true, pageSize: 100, search: query.trim() || undefined })
```

**Nota importante**: la página **solo lista productos activos** (`active: true`). Los productos "desactivados" no se ven en el catálogo. El único módulo que ve inactivos actualmente es `suppliers` (con el filtro activos/inactivos).

Métricas del header:

- Total = `products.length`
- Críticos = productos con `status === 'Critico'`
- Agotados = productos con `status === 'Agotado'`

Se calculan del lado cliente sobre los rows ya transformados.

---

## Modales (`ProductCatalogModals`)

Un componente switch que renderiza uno de estos modales según `modalType`:

| `modalType`     | Modal                          | Requiere                            |
| --------------- | ------------------------------ | ----------------------------------- |
| `'detail'`      | Detalle + últimos 3 movimientos | `product`                          |
| `'create'`      | Nuevo producto                 | —                                   |
| `'edit'`        | Editar producto                | `product`                           |
| `'movement'`    | Registrar movimiento (IN/OUT/ADJUSTMENT) | `product`, permiso           |
| `'replenishment'` | Generar solicitud de reposición | `product`, `manage:replenishment` |
| `'deactivate'`  | Confirmación de desactivación  | `product`, `manage:products`        |

### Modal de detalle — últimos 3 movimientos

Fue lo último que se conectó (commit `feat(products): show last 3 movements in catalog product detail modal`). Usa:

```ts
const movementsQuery = useProductInventoryMovements(product.id, { limit: 3 })
```

que apunta a `GET /products/:id/inventory-movements?limit=3`.

Estados renderizados:

- Loading: `"Cargando historial real..."`
- Error: `"No fue posible cargar el historial real."`
- Vacío: `"Sin movimientos recientes."`
- Data: 3 filas con icono, tipo (Entrada/Salida/Ajuste), motivo, usuario abreviado, cantidad con signo, fecha.

Helpers locales (viven en el mismo archivo, no en `lib/`):

- `MovementIcon({ type })` — `ArrowUp` verde para IN, `ArrowDown` rojo para OUT, `ArrowLeftRight` neutral para ADJUSTMENT.
- `getMovementLabel(type)` — traduce a español.
- `getMovementSubtitle(movement)` — combina `reason` con `Usuario <id>`.
- `getMovementSignal(movement)` — devuelve `+` o `-` según tipo (y dirección si es ADJUSTMENT).

**Decisión**: se duplicaron helpers en vez de extraerlos porque el catálogo y el inventario los formatean distinto (el inventario usa `movement.user.fullName`, el catálogo usa `shortId(userId)`). Si en el futuro convergen, extraer a `lib/movementDisplay.ts` compartido con `inventory-movements`.

### Modal de crear/editar producto

Usa React Hook Form + Zod (schema local en el mismo archivo). Campos: `code`, `name`, `activeIngredient`, `description`, `presentation`, `brand`, `unit`, `unitContent`, `categoryId`, `stock` (solo create), `minStock`, `price`.

**Reglas del formulario**:

- `price` es opcional (`price?: string | null`). El backend lo acepta `null`.
- `stock` solo se puede setear en create; en edición el stock se cambia vía movimientos.
- `categoryId` es obligatorio. El select se puebla con `useCategories`.

Invalidación post-mutación:

```ts
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
}
```

Update también invalida `queryKeys.products.detail(id)`.

### Modal de movimiento

Formulario con tipo (IN/OUT/ADJUSTMENT), cantidad, motivo. Delega a `useCreateInventoryMovement` del módulo `inventory-movements`.

**Gating**: solo se muestra si `canCreateMovementType(role, 'OUT')` — o sea, cualquier rol puede abrirlo, pero el select de tipos se restringe según permisos (OPERATOR solo ve OUT).

### Modal de reposición desde producto

Prellenar una nueva solicitud con el producto seleccionado. Requiere elegir proveedor y cantidad. Delega la creación a la API de reposición.

**Gating**: `manage:replenishment` (ADMIN, MANAGER).

### Modal de desactivación

Confirmación destructiva. Llama `deleteProduct(id)` (que en el backend hace soft-delete, no borrado físico).

**Gating**: `manage:products`.

---

## Menú de acciones por fila

Rendering condicional según permisos:

- **Ver detalle** — todos los roles.
- **Editar** — `manage:products`.
- **Registrar movimiento** — `canCreateMovementType(role, 'OUT')`.
- **Generar reposición** — `manage:replenishment`.
- **Desactivar** — `manage:products` (separado con divisor visual).

El OPERATOR solo ve "Ver detalle" y "Registrar movimiento" (limitado a OUT internamente).

---

## Dependencias cross-módulo

- **`categories`**: `useCategories` para el nombre de la categoría y el select del formulario. `CategoryManagementModal` se monta desde acá.
- **`inventory-movements`**: `useCreateInventoryMovement` para el modal de movimiento. `useProductInventoryMovements` para el mini-historial en el detalle.
- **`suppliers`**: el detalle usa `useProductSuppliers` para listar los proveedores asociados (nota: el hook vive en `features/products/api/useProducts.ts`, pero conceptualmente es de la relación producto↔proveedor).
- **`replenishment`**: el modal de reposición desde producto crea una `ReplenishmentRequest`.
- **`auth`**: `useAuthStore` para el rol, `permissions.ts` para los checks.

---

## Gotchas

- **`price` puede ser `null`**. El display siempre debe manejarlo (`price ?? 'Sin precio'` o similar). No hacer `Number(price)` sin check previo.
- **Los productos desactivados no aparecen** en el listado porque la query es `active: true`. Para ver o restaurar productos desactivados no hay UI todavía — habría que hacerlo desde la BD o crear un módulo admin.
- **El componente `ProductCatalogModals` se reutiliza en `AlertsPage`**. Si agregás lógica que depende de estar en la página de catálogo, romperá la vista de alertas.
- **`stock` no se puede editar directamente**. La única forma de cambiarlo es vía `inventory-movements`. Esto es intencional: preserva la auditoría.
- **Los hex `#0e1d27`, `#5c6b78`, `#e5ecf1`, etc.** están hardcodeados en `ProductsPage.tsx`. Deuda técnica pendiente de migrar a `var(--color-*)`.
- Al crear un producto con precio, el backend acepta el string decimal (`"12.50"`), no un número. El formulario debe pasarlo como string.
