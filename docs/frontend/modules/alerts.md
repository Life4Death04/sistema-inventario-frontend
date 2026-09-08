# Módulo `alerts`

Alertas de inventario (stock crítico o agotado). Es un módulo **derivado**: no tiene datos propios, calcula las alertas en tiempo real a partir de los productos activos.

---

## Responsabilidades

- Derivar alertas de stock a partir del catálogo de productos activos.
- Renderizar cards de alertas con nivel (crítico/agotado) y acciones rápidas.
- Exponer el conteo de alertas activas para el badge del sidebar.
- Punto de entrada para generar reposición desde una alerta.

---

## Estructura

```
src/features/alerts/
├── api/
│   └── useActiveAlertCount.ts     # hook derivado del count de alertas para el sidebar
├── lib/
│   └── alertRows.ts               # toInventoryAlertRows + comparator
└── pages/
    └── AlertsPage.tsx
```

Sin `components/` propios: reutiliza `ProductCatalogModals` para el detalle/acciones sobre el producto.

---

## Datos que consume

```ts
useProducts({ active: true, pageSize: 100 })
useCategories({ limit: 100 })
```

**No hay endpoint dedicado de alertas** en el frontend. Es 100% derivación en cliente.

**Nota importante**: el backend sí tiene un módulo `alerts` con persistencia (crea `Alert` rows cuando el stock cae bajo el mínimo, y las reconcilia cuando sube). Sin embargo, el frontend **no consume esas alertas persistidas** — deriva las alertas del stock actual de los productos activos. La razón histórica: se implementó la vista de alertas antes de que el backend expusiera el endpoint de alertas.

**Consecuencia**: las alertas del frontend son siempre "en tiempo real" respecto al stock, pero no tienen historial ni estado de "atendidas". Si el backend expone alertas atendidas en el futuro, este módulo tiene que rehacerse para leer del endpoint.

---

## View model — `InventoryAlertRow`

Definido en `lib/alertRows.ts`:

```ts
interface InventoryAlertRow {
  id: string                          // 'alert-<productId>'
  level: 'critical' | 'out'
  label: 'Critico' | 'Agotado'
  generatedAt: string                 // ISO — cuando se obtuvo la data
  product: ProductRow                 // el ProductRow completo, reutilizado
}
```

### Función `toInventoryAlertRows(products, generatedAt)`

Filtra los productos con `stock === 0 || stock <= minStock`, mapea a alertas y ordena:

- Primero las agotadas (`out`).
- Dentro de cada nivel, por stock ascendente (más urgente primero).
- Desempate alfabético por nombre.

### `generatedAt`

Se toma del `dataUpdatedAt` de la query de productos (`useProducts().dataUpdatedAt`). Refleja **cuándo TanStack Query trajo los datos**, no cuándo se detectó la alerta. Si la data es stale-while-revalidating, el timestamp es el del último fetch exitoso.

---

## Página (`AlertsPage`)

Estado local mínimo:

```ts
const [activeModal, setActiveModal] = useState<ProductModalType | null>(null)
const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null)
```

Métricas del header:

```ts
{
  active:   activeAlerts.length,
  critical: activeAlerts.filter(a => a.level === 'critical').length,
  out:      activeAlerts.filter(a => a.level === 'out').length,
}
```

Cada alerta se renderiza como un `AlertCard` (componente local dentro de `AlertsPage.tsx`) con:

- Icono contextual (`CircleAlert` rojo para agotado, `AlertTriangle` naranja para crítico).
- Nombre del producto, código, badge de nivel.
- Fecha de generación formateada.
- Stock actual / stock mínimo.
- Acciones:
  - **Generar reposición** (solo si `manage:replenishment`).
  - **Ver producto**.

Ambas acciones abren `ProductCatalogModals` con `modalType='replenishment'` o `'detail'`.

---

## `useActiveAlertCount` — badge del sidebar

Hook separado en `api/useActiveAlertCount.ts`:

```ts
export function useActiveAlertCount(): number {
  const { data } = useProducts({ active: true, pageSize: 100 })
  return useMemo(() => {
    const products = data?.data ?? []
    return products.filter((p) => p.stock === 0 || (p.stock > 0 && p.stock <= p.minStock)).length
  }, [data])
}
```

**Por qué existe**: el sidebar necesita mostrar un badge con la cantidad de alertas activas, pero no debería importar toda la lógica de `AlertsPage`. Este hook expone solo el count.

**Optimización implícita**: reutiliza la query key `queryKeys.products.list({ active: true, pageSize: 100 })`. Si el usuario ya visitó `/alertas` o cualquier vista que use esa query, el sidebar lee del cache sin hacer un request extra. Si no la visitó, el sidebar dispara la query una sola vez.

**Consecuencia**: si en el futuro se pagina por debajo de 100 productos, el count del sidebar quedará capado. Documentar el acoplamiento.

El badge se renderiza en `Sidebar.tsx`:

```tsx
{showBadge ? (
  <span className="...bg-danger">
    {activeAlertCount > 99 ? '99+' : activeAlertCount}
  </span>
) : null}
```

Solo se muestra si `activeAlertCount > 0`.

---

## Dependencias cross-módulo

- **`products`**: fuente de datos + `ProductRow` + `ProductCatalogModals`.
- **`categories`**: para resolver nombres de categoría en `toProductRow`.
- **`auth`**: gating de "Generar reposición" con `manage:replenishment`.
- **`layout/Sidebar`**: consume `useActiveAlertCount`.

---

## Gotchas

- **Las alertas son derivadas**, no persistidas. Si un dev nuevo asume que hay una tabla `Alert` en el frontend, se va a confundir. El backend sí tiene persistencia; el frontend no la lee.
- **El count del sidebar depende de que `useProducts({ active: true, pageSize: 100 })` haya cargado**. En el bootstrap inicial, mientras no cargue, el badge no aparece (no hay skeleton loading). Es intencional para no meter ruido visual.
- **`useProducts` con esos exact params se comparte entre `AlertsPage`, `ProductsPage`, `InventoryPage` y `useActiveAlertCount`**. Cambiar los params en uno solo rompe la reutilización del cache.
- **`InventoryAlertRow` embebe el `ProductRow` completo**. Si `ProductRow` crece, las alertas cargan más data en memoria (irrelevante para 100 productos, importante para miles).
- **No hay filtro de "atendidas" o "resueltas"** porque el modelo del frontend no lo soporta. Cuando el stock sube, la alerta simplemente desaparece del listado. No hay historial.
- **El `AlertCard` está definido dentro de `AlertsPage.tsx`**, no en `components/`. Extraer si se reutiliza en otra vista.
