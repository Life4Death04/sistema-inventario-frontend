# Módulo `inventory`

Vista de "Existencias": listado de productos con foco en cantidades, estado de stock y filtros operativos.

**No confundir con `inventory-movements`**: este módulo es la vista de *estado* de stock; `inventory-movements` es la vista y capa API de *cambios* de stock.

---

## Responsabilidades

- Renderizar la vista de existencias con métricas (total, normales, críticos, agotados).
- Filtros: búsqueda por texto, categoría, estado de stock.
- Punto de acción rápida para registrar una salida desde una fila.

---

## Estructura

```
src/features/inventory/
├── components/
│   ├── InventoryModals.tsx        # detalle + salida rápida
│   └── InventoryTanStackTable.tsx
├── lib/
│   └── inventoryRows.ts           # toInventoryRow
└── pages/
    └── InventoryPage.tsx
```

Este módulo **no tiene `api/`** propio. Consume `useProducts` y `useCategories` directamente porque las existencias son una **vista derivada** de los productos activos.

---

## Datos que consume

```ts
useProducts({ active: true, pageSize: 100 })
useCategories({ limit: 100 })
```

**No hay endpoint dedicado de "inventario"** en el backend. La visión de inventario es 100% derivada del listado de productos.

---

## View model (`toInventoryRow`)

Transforma `Product + Category` en `InventoryRow`. Es similar a `productRows.toProductRow` pero:

- Resuelve el `category` mediante un `Map<categoryId, Category>` en vez de un `Map<categoryId, string>`, para tener acceso al objeto completo.
- Deriva el mismo `status` (`Optimo` / `Critico` / `Agotado`).

---

## Página (`InventoryPage`)

Estado local:

```ts
const [query, setQuery] = useState('')
const [categoryFilter, setCategoryFilter] = useState('')
const [statusFilter, setStatusFilter] = useState<'all' | 'Optimo' | 'Critico' | 'Agotado'>('all')
const [activeModal, setActiveModal] = useState<InventoryModalType | null>(null)
const [selectedProduct, setSelectedProduct] = useState<InventoryRow | null>(null)
```

Filtrado (todo en cliente con `useMemo`):

```ts
const filteredInventory = useMemo(
  () => inventory.filter((product) => {
    const matchesCategory = !categoryFilter || product.categoryId === categoryFilter
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const normalizedQuery = query.trim().toLowerCase()
    const matchesQuery =
      !normalizedQuery ||
      [product.code, product.name, product.category, product.activeIngredient ?? product.activeIngredientLabel]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    return matchesCategory && matchesStatus && matchesQuery
  }),
  [categoryFilter, inventory, query, statusFilter],
)
```

**Decisión**: filtrar en cliente porque `pageSize: 100` cubre el volumen esperado del sistema (una farmacia mediana). Si el catálogo crece a miles de productos, hay que mover los filtros al backend usando los query params existentes de `/products` (`search`, `categoryId`, `lowStock`).

---

## Métricas

```ts
{
  total:    inventory.length,
  normal:   inventory.filter(p => p.status === 'Optimo').length,
  critical: inventory.filter(p => p.status === 'Critico').length,
  out:      inventory.filter(p => p.status === 'Agotado').length,
}
```

Se renderizan como cuatro `MetricCard` en el grid superior.

---

## Modales (`InventoryModals`)

Tipos: `'detail'` y `'output'`.

- **`detail`**: reutiliza el patrón del catálogo. Muestra info del producto + historial de últimos movimientos.
- **`output`**: modal específico de "registrar salida rápida" — pensado para el flujo diario del operador (descargar producto desde inventario). Es un shortcut al modal de movimiento pero preseleccionando `type: 'OUT'`.

---

## Dependencias cross-módulo

- **`products`**: fuente de datos (`useProducts`).
- **`categories`**: para el nombre y el select de filtro.
- **`inventory-movements`**: implícitamente, porque el modal de salida rápida crea un movimiento (aunque el modal vive acá).

---

## Diferencia con Catálogo

| Aspecto              | `products` (Catálogo)              | `inventory` (Existencias)          |
| -------------------- | ---------------------------------- | ---------------------------------- |
| Foco                 | Gestión del maestro de productos   | Estado operativo del stock         |
| Acciones            | CRUD, movimientos, reposición, categorías | Ver detalle, registrar salida |
| Filtros              | Búsqueda por texto (backend)       | Búsqueda + categoría + estado (cliente) |
| Métricas             | Total, críticos, agotados          | Total, normales, críticos, agotados |
| Roles primarios      | ADMIN, MANAGER                     | OPERATOR (uso diario), todos los roles |

Ambos consumen la misma fuente de datos pero están pensados para dos audiencias distintas.

---

## Gotchas

- **Sin paginación real**: pide 100 productos y filtra en cliente. Al superar 100 productos activos, la vista muestra solo los primeros 100. Fácil de escalar: cambiar `pageSize` o pasar a paginación server-side.
- **El label del filtro de estado usa términos internos**: "Optimo", "Critico", "Agotado" son los mismos strings de `getProductStatus`. Cambiar el label sin cambiar el helper rompe el filtrado.
- **`InventoryStateMessage` está duplicado** en varios módulos con la misma implementación. Candidato a extraer a `components/ui/StateMessage.tsx`.
