# Módulo `inventory-movements`

**Módulo "servicio"**: no tiene página propia ni componentes. Provee la capa API y los hooks de mutación/query para movimientos de inventario, que consumen otros módulos (`movements`, `products`, `inventory`).

Es el equivalente frontend del recurso REST `inventory-movements` del backend.

---

## Responsabilidades

- Wrapper Axios de `/inventory-movements` y `/products/:id/inventory-movements`.
- Hook de listado global.
- Hook de listado por producto (para mini-historial en el catálogo).
- Hook de creación con invalidación cross-módulo.

---

## Estructura

```
src/features/inventory-movements/
└── api/
    ├── inventoryMovements.api.ts    # listInventoryMovements, getInventoryMovement, createInventoryMovement, listInventoryMovementsByProduct
    └── useInventoryMovements.ts     # useInventoryMovements, useCreateInventoryMovement, useProductInventoryMovements
```

No hay `components/`, `pages/`, ni `lib/`.

---

## Endpoints consumidos

| Método | Path                                       | Función                                 |
| ------ | ------------------------------------------ | --------------------------------------- |
| GET    | `/inventory-movements`                     | `listInventoryMovements(params)`        |
| GET    | `/inventory-movements/:id`                 | `getInventoryMovement(id)`              |
| POST   | `/inventory-movements`                     | `createInventoryMovement(input)`        |
| GET    | `/products/:id/inventory-movements`        | `listInventoryMovementsByProduct(id)` / `listProductMovements(id)` (en `products.api.ts`) |

**Nota**: existen **dos funciones para el mismo endpoint** de "movimientos de un producto":

- `listInventoryMovementsByProduct(productId)` — en `features/inventory-movements/api/inventoryMovements.api.ts`.
- `listProductMovements(productId)` — en `features/products/api/products.api.ts`.

Ambas apuntan a `GET /products/:id/inventory-movements`. La duplicación existe por orden de implementación: `listProductMovements` se creó primero para el detalle de producto, y luego se agregó `listInventoryMovementsByProduct` cuando se abstrajo el módulo. **El hook `useProductInventoryMovements` usa `listProductMovements`**. Es deuda técnica menor; consolidar cuando se toque el módulo.

---

## Tipos

`InventoryMovement`:

```ts
{
  id: string
  productId: string
  userId: string
  product: MovementProductSummary   // { id, name, code } — embed enriquecido
  user: MovementUserSummary         // { id, fullName } — embed enriquecido
  type: MovementType                // 'IN' | 'OUT' | 'ADJUSTMENT'
  adjustmentDirection: AdjustmentDirection | null  // 'INCREASE' | 'DECREASE', solo si type === 'ADJUSTMENT'
  quantity: number
  resultingStock: number            // stock final después del movimiento
  reason: string
  createdAt: string
}
```

**Los summaries embebidos (`product`, `user`) son parte del contrato del backend**. El backend hace el join y los envía; el frontend no necesita hacer fan-out de N+1 requests. Si esos campos aparecen `null`/`undefined`, es un bug del backend (falta enrichment).

### Input de creación

```ts
type CreateInventoryMovementInput =
  | { productId, type: 'IN',         quantity, reason }
  | { productId, type: 'OUT',        quantity, reason }
  | { productId, type: 'ADJUSTMENT', quantity, reason }
```

**No se envía `adjustmentDirection` desde el frontend** — el backend lo deriva del `quantity` firmado o de otro parámetro implícito. Verificar el schema del backend antes de cambiar esto.

---

## Hooks

### `useInventoryMovements(params)`

Listado paginado. Consumido por `MovementsPage`.

### `useCreateInventoryMovement()`

Mutation con invalidación cross-módulo:

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

**Por qué esta lista**: crear un movimiento cambia el stock del producto, que a su vez impacta:

- La lista de movimientos (obvio).
- El detalle del producto (`stock`, `updatedAt`).
- La lista de productos (`stock`).
- La vista de inventario (derivada de productos).
- Las alertas (derivadas de stock vs. minStock).

Si en el futuro se agrega otra vista derivada del stock, hay que sumar su key acá.

### `useProductInventoryMovements(productId | null, params?)`

Listado filtrado por producto. Se usa en:

- Detalle de producto en el catálogo (`ProductCatalogModals` — últimos 3 movimientos).
- Detalle de producto en el inventario (`InventoryModals`).

Query key: `queryKeys.products.movements(productId, params)`. La anida bajo `products.detail` para que invalidar `products.all` invalide también los mini-historiales.

---

## Quién lo consume

| Módulo consumidor | Hook usado                            | Uso                              |
| ----------------- | ------------------------------------- | -------------------------------- |
| `movements`       | `useInventoryMovements`               | Página principal de historial    |
| `products`        | `useProductInventoryMovements`, `useCreateInventoryMovement` | Mini-historial + modal de movimiento |
| `inventory`       | `useCreateInventoryMovement` (via modal) | Modal de salida rápida        |

---

## Gotchas

- **La duplicación `listInventoryMovementsByProduct` vs `listProductMovements`**: usar `listProductMovements` (el hook `useProductInventoryMovements` lo usa). Consolidar cuando haya que tocar.
- **Cambiar la lista de invalidación en `useCreateInventoryMovement` sin coordinar** puede dejar vistas desactualizadas. Cualquier nueva vista derivada del stock debe sumar su key.
- **El `resultingStock` viene calculado del backend**. No calcularlo en frontend — race conditions con movimientos concurrentes.
- **`adjustmentDirection` puede ser `null`**. Solo tiene valor cuando `type === 'ADJUSTMENT'`. Los componentes que renderizan movimientos deben handle-arlo (ver `MovementsPage.getAdjustmentLabel`).
- **`reason` viene del backend en inglés** en varios casos (`"Received from replenishment request"`, `"Stock adjustment"`). `MovementsPage` tiene un `MOVEMENT_REASON_TRANSLATIONS` para castellanizarlos. Si el backend agrega nuevas `reason` autogeneradas, hay que sumarlas al diccionario.
