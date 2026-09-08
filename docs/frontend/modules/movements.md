# Módulo `movements`

Historial de movimientos de inventario. Página de solo lectura para auditar entradas, salidas y ajustes de stock.

**Relación con `inventory-movements`**: este módulo es la **vista** (página + tabla + row model); `inventory-movements` es la **capa API**.

---

## Responsabilidades

- Renderizar el listado completo de movimientos (últimos 100).
- Filtros: búsqueda por texto, tipo de movimiento (IN/OUT/ADJUSTMENT).
- Métricas: cantidad de entradas, salidas y ajustes.

---

## Estructura

```
src/features/movements/
├── components/
│   └── MovementsTanStackTable.tsx
└── pages/
    └── MovementsPage.tsx
```

Sin `api/` (usa el hook de `inventory-movements`). Sin `lib/` (el mapper vive dentro de `MovementsPage.tsx`).

---

## Datos que consume

```ts
useInventoryMovements({ limit: 100 })   // del módulo inventory-movements
```

**No hay paginación server-side visible**. Al superar 100 movimientos, la página muestra los últimos 100.

---

## View model — `MovementTableRow`

Definido en `components/MovementsTanStackTable.tsx` y construido en `MovementsPage` con `toMovementTableRow(movement)`:

```ts
interface MovementTableRow {
  id: string
  product: string          // movement.product.name
  code: string             // movement.product.code
  type: MovementType
  typeLabel: 'Entrada' | 'Salida' | 'Ajuste'
  adjustmentDirection: AdjustmentDirection | null
  adjustmentLabel: 'Incremento' | 'Disminucion' | null
  quantity: number
  resultingStock: number
  reason: string           // ya traducido
  user: string             // movement.user.fullName
  createdAt: string
  initials: string         // iniciales del usuario, para el avatar
}
```

Helpers en el mismo archivo:

- `getMovementTypeLabel(type)` — español para IN/OUT/ADJUSTMENT.
- `getAdjustmentLabel(direction)` — español para INCREASE/DECREASE.
- `translateMovementReason(reason)` — diccionario de traducciones de `reason` cuando viene en inglés (ver más abajo).
- `getInitials(fullName)` — primeras letras del nombre para el avatar circular.

### Diccionario de traducciones de motivos

```ts
const MOVEMENT_REASON_TRANSLATIONS: Record<string, string> = {
  'Received from replenishment request': 'Recibido por solicitud de reposicion',
  'Replenishment received': 'Reposicion recibida',
  'Stock adjustment': 'Ajuste de stock',
  'Manual entry': 'Entrada manual',
  'Manual output': 'Salida manual',
}
```

Motivos que el backend autogenera (por ejemplo al recibir una reposición) vienen en inglés desde la BD. Los motivos escritos por usuarios humanos ya vienen en el idioma que los cargaron.

**Regla**: cualquier `reason` nuevo autogenerado por el backend debe sumarse a este diccionario o la UI mostrará el string en inglés.

---

## Página (`MovementsPage`)

Estado local:

```ts
const [query, setQuery] = useState('')
const [typeFilter, setTypeFilter] = useState<'Todos' | 'IN' | 'OUT' | 'ADJUSTMENT'>('Todos')
```

Filtrado en cliente (búsqueda + tipo). La búsqueda por texto se aplica dentro de `MovementsTanStackTable` sobre las columnas visibles (globalFilter de TanStack Table).

Métricas:

```ts
{
  entries:     rows.filter(m => m.type === 'IN').length,
  outputs:     rows.filter(m => m.type === 'OUT').length,
  adjustments: rows.filter(m => m.type === 'ADJUSTMENT').length,
}
```

Renderizadas con `MovementMetricCard` (variante local, no reutiliza `MetricCard` porque tiene un accent lateral y un icono contextual).

---

## Estados de UI

- Loading: `"Cargando movimientos reales..."`.
- Error: `"No fue posible cargar los movimientos reales."`.
- Data: renderiza la tabla filtrada.

---

## Dependencias cross-módulo

- **`inventory-movements`**: `useInventoryMovements` para el listado, `InventoryMovement` para el tipo del DTO.

---

## Gotchas

- **El input `"01/06 - 08/06"` en el header es un placeholder visual** de un date range picker que nunca se implementó. Es `readOnly` y no filtra nada. Deuda técnica: implementar filtro por rango de fechas usando los params `from` / `to` de `listInventoryMovements`.
- **`limit: 100` está hardcodeado**. Al escalar el volumen de movimientos, se pierde histórico. Solución: paginación server-side.
- **El mapper `toMovementTableRow` vive dentro de la página** en vez de en `lib/movementRows.ts`. Es una inconsistencia con el resto de features. Extraer si se toca.
- **Si el backend emite un nuevo `reason` autogenerado** (por ejemplo desde un nuevo flujo) sin actualizar el diccionario, el usuario ve el string en inglés. No rompe la app pero se ve mal.
- **`getInitials` no maneja nombres con caracteres especiales o vacíos** correctamente en todos los casos. Suficiente para el uso actual, pero frágil.
