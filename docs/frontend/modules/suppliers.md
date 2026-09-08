# Módulo `suppliers`

Gestión de proveedores: CRUD, filtros por estado activo/inactivo, asociación con productos del catálogo.

---

## Responsabilidades

- CRUD de proveedores.
- Filtros por estado (activos/inactivos/todos).
- Asociar/desasociar productos a un proveedor (con `referencePrice` opcional).
- Punto de entrada para ver solicitudes de reposición del proveedor (feature planeada).

---

## Estructura

```
src/features/suppliers/
├── api/
│   ├── suppliers.api.ts           # CRUD
│   └── useSuppliers.ts            # hook de listado
├── components/
│   ├── SupplierModals.tsx         # switch: detail, create, edit, associate-products
│   └── SuppliersTanStackTable.tsx
├── lib/
│   └── supplierRows.ts            # toSupplierRow + mergeSupplierRows
└── pages/
    └── SuppliersPage.tsx
```

---

## Endpoints consumidos

| Método | Path                | Función                    |
| ------ | ------------------- | -------------------------- |
| GET    | `/suppliers`        | `listSuppliers(params)`    |
| GET    | `/suppliers/:id`    | `getSupplier(id)`          |
| POST   | `/suppliers`        | `createSupplier(input)`    |
| PATCH  | `/suppliers/:id`    | `updateSupplier(id, in)`   |
| DELETE | `/suppliers/:id`    | `deleteSupplier(id)` — soft-delete en backend |

Relación producto↔proveedor se maneja desde el módulo `products`:

- `POST /products/:id/suppliers` — asociar
- `DELETE /products/:id/suppliers/:supplierId` — desasociar
- `GET /products/:id/suppliers` — listar

El modal `associate-products` de este módulo hace lo inverso: dado un proveedor, buscar productos y asociarlos. Internamente usa las funciones del módulo `products`.

---

## Tipos

`Supplier`:

```ts
{
  id: string
  name: string
  rif: string | null           // RIF venezolano (Registro de Información Fiscal)
  whatsapp: string | null      // usado para notificaciones de reposición
  address: string | null
  active: boolean
  productsCount: number        // enriquecido por backend
  createdAt: string
  updatedAt: string
}
```

`productsCount` viene enriquecido desde el backend para evitar fan-out. Muestra cuántos productos tiene asociados sin necesidad de request adicional.

---

## Página (`SuppliersPage`)

**Peculiaridad**: hace **dos queries** en paralelo, una para activos y otra para inactivos:

```ts
const activeSuppliersQuery = useSuppliers({ limit: 100, active: true })
const inactiveSuppliersQuery = useSuppliers({ limit: 100, active: false })
```

Y las combina con `mergeSupplierRows(activeSuppliers, inactiveSuppliers)`.

**Por qué**: el filtro de estado se hace en cliente sin tener que refetchear al cambiar de tab. También permite mostrar métricas de "totales" que incluyen ambos estados sin un tercer request.

**Costo**: dos requests iniciales en vez de uno. Aceptable dado el volumen esperado.

**Alternativa considerada**: un solo request sin filtro (`useSuppliers({ limit: 200 })`) y filtrar todo en cliente. Descartada porque el backend paginate por `limit`, y no queríamos asumir un tope arbitrario.

### Estado local

```ts
const [query, setQuery] = useState('')
const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
const [activeModal, setActiveModal] = useState<SupplierModalType | null>(null)
const [selectedSupplier, setSelectedSupplier] = useState<SupplierRow | null>(null)
```

### Métricas

```ts
{
  active:   allSuppliers.filter(s => s.active).length,
  total:    allSuppliers.length,
  inactive: allSuppliers.filter(s => !s.active).length,
}
```

### Estados visuales

- `isLoading`: alguna de las dos queries todavía carga → skeleton grande.
- `isError`: alguna falló → mensaje con hint de conexión.
- `isRefreshing`: alguna está refetchando → pill "Actualizando listado..." arriba de la tabla.

Este triple estado (loading / error / refreshing) es más rico que el resto de módulos. Buen patrón para copiar.

---

## Modales (`SupplierModals`)

| `modalType`             | Función                                             |
| ----------------------- | --------------------------------------------------- |
| `'detail'`              | Ver info del proveedor + lista de productos asociados |
| `'create'`              | Nuevo proveedor                                     |
| `'edit'`                | Editar (nombre, rif, whatsapp, address)             |
| `'associate-products'`  | Buscar productos del catálogo y asociarlos          |

### Modal `associate-products`

Fue lo último que se conectó (commit `feat(suppliers): add associate-products action to suppliers table`). Antes existía el modal pero no había forma de abrirlo desde la UI.

Flujo:

1. Búsqueda de productos por texto (usa `useProducts` con `search`).
2. Draft rows: agregar productos a asociar, con `referencePrice` opcional.
3. Confirmar → llama `attachProductSupplier(productId, { supplierId, referencePrice })` para cada draft.
4. Al terminar → invalida `queryKeys.suppliers.all` y `queryKeys.products.all`.

`referencePrice` es el precio de referencia de ese producto con ese proveedor. Se usa en reposición para calcular `unitPrice` cuando el usuario no lo especifica manualmente.

### Modal `edit`

Fields: `name`, `rif`, `whatsapp`, `address`. Todos opcionales salvo `name`.

**Regla de WhatsApp**: el backend normaliza el número a E.164. El frontend puede aceptar formato local; el backend lo transforma.

---

## Tabla (`SuppliersTanStackTable`)

Columnas: nombre, RIF, teléfono (WhatsApp), estado (badge Activo/Inactivo), productos asociados, acciones.

### Columna de acciones

Botones en orden:

1. **Ver detalle** (`Eye`) — siempre.
2. **Asociar productos** (`Link2`) — solo si `canManage`.
3. **Editar** (`SquarePen`) — solo si `canManage`.
4. **WhatsApp** (`MessageCircle`) — click abre `wa.me/<whatsapp>` en pestaña nueva (si el proveedor tiene número).

`canManage` viene del prop, que se resuelve en la página con `canManageSuppliers(user?.role)`.

---

## View model

`toSupplierRow(supplier: Supplier) → SupplierRow`: transformación mínima (agrega labels de vacío, formatea fechas).

`mergeSupplierRows(active, inactive)`: concatena ambos arrays y ordena. Deduplica por `id` por si el backend devuelve un mismo supplier en ambas listas (edge case).

---

## Dependencias cross-módulo

- **`products`**: para el modal de asociar (búsqueda + `attachProductSupplier`).
- **`auth`**: gating con `canManageSuppliers` (`manage:suppliers`) y ruteo protegido con `view:suppliers`.
- **`replenishment`**: consume `Supplier` para el dropdown de proveedor en el modal de nueva solicitud.

---

## Gotchas

- **Dos queries en paralelo** cuestan doble de red pero simplifican el filtrado. Si escalás a miles de proveedores, mover el filtro a backend.
- **El status "Inactivo" no borra al proveedor** — es soft-delete. Los datos siguen en BD, solo cambia `active`.
- **Los productos asociados a un proveedor inactivo siguen visibles** en el catálogo del producto. Es intencional para no perder trazabilidad histórica. Cuidado si en el futuro se agrega un filtro "solo proveedores activos" en el detalle de producto.
- **El modal de detalle muestra `productsCount`** pero no la lista real de productos. Para verlos hay que navegar al catálogo con filtro `supplierId=<id>`. Feature futura: mostrar la lista en el modal.
- **El WhatsApp no valida formato**. El backend rechaza si el número es inválido (E.164), pero la UI no da feedback anticipado.
- **No hay "restaurar proveedor inactivo"** desde UI. Hay que editarlo y setear `active: true` manualmente vía PATCH — cosa que el modal de edición no expone. Deuda técnica.
