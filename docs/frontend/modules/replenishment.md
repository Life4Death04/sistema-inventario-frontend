# Módulo `replenishment`

Solicitudes de reposición: crear, enviar (WhatsApp vía backend), recibir, cancelar. Es el módulo más complejo del frontend por la máquina de estados y por la cantidad de datos embebidos.

---

## Responsabilidades

- CRUD de solicitudes de reposición.
- Máquina de estados: PENDING → SENT → RECEIVED / CANCELLED.
- Modal de creación con selección de proveedor + productos + cantidades + precios opcionales.
- Recepción parcial o total con cantidades reales.
- Filtros por estado y búsqueda por texto.

---

## Estructura

```
src/features/replenishment/
├── api/
│   ├── replenishmentRequests.api.ts    # API + mapping DTO→View con placeholders
│   ├── useReplenishmentRequests.ts     # listado
│   └── useReplenishmentRequest.ts      # detalle por id
├── components/
│   ├── ReplenishmentModals.tsx         # detail, generate, change-status
│   └── ReplenishmentTanStackTable.tsx
├── lib/
│   └── replenishmentView.ts            # toReplenishmentRow, toReplenishmentDetail, status labels
└── pages/
    └── ReplenishmentPage.tsx
```

---

## Endpoints consumidos

| Método | Path                                          | Función                                       |
| ------ | --------------------------------------------- | --------------------------------------------- |
| GET    | `/replenishment-requests`                     | `listReplenishmentRequests(params)`           |
| GET    | `/replenishment-requests/:id`                 | `getReplenishmentRequest(id)`                 |
| POST   | `/replenishment-requests`                     | `createReplenishmentRequest(input)`           |
| POST   | `/replenishment-requests/:id/send`            | `sendReplenishmentRequest(id)`                |
| POST   | `/replenishment-requests/:id/receive`         | `receiveReplenishmentRequest(id, input?)`     |
| POST   | `/replenishment-requests/:id/cancel`          | `cancelReplenishmentRequest(id)`              |
| GET    | `/suppliers/:id/replenishment-requests`       | `listReplenishmentRequestsBySupplier(id, p)`  |

---

## Tipos

`ReplenishmentRequest`:

```ts
{
  id: string
  supplierId: string
  requestedByUserId: string
  supplier?: ReplenishmentSupplierSummary | null       // embebido
  requestedByUser?: ReplenishmentUserSummary | null    // embebido
  status: ReplenishmentStatus                          // 'PENDING' | 'SENT' | 'RECEIVED' | 'CANCELLED'
  requestedAt: string
  sentAt?: string | null
  receivedAt?: string | null
  receivedByUserId?: string | null
  cancelledAt?: string | null
  cancelledByUserId?: string | null
  notes: string | null
  itemsCount: number                    // enriquecido por el backend
  estimatedTotal: string                // decimal como string
}

interface ReplenishmentRequestWithItems extends ReplenishmentRequest {
  items: ReplenishmentRequestItem[]     // solo en el detalle
}

interface ReplenishmentRequestItem {
  id: string
  productId: string
  requestedQuantity: number
  unitPrice: number | null              // opcional (Bug#3 backend)
  receivedQuantity?: number | null
  product?: ReplenishmentProductSummary | null
}
```

**Los summaries embebidos son opcionales** en el tipo (`| null | undefined`). Si el backend no los envía enriquecidos, el mapper del frontend inyecta placeholders visibles.

---

## Placeholders defensivos

`replenishmentRequests.api.ts` define tres placeholders:

```ts
export const REPLENISHMENT_SUPPLIER_PLACEHOLDER = '[AQUI SE DEBERÍA MOSTRAR EL PROVEEDOR]'
export const REPLENISHMENT_REQUESTED_BY_USER_PLACEHOLDER = '[AQUI SE DEBERÍA MOSTRAR EL USUARIO SOLICITANTE]'
export const REPLENISHMENT_PRODUCT_PLACEHOLDER = '[AQUI SE DEBERÍA MOSTRAR EL PRODUCTO]'
```

Cuando un DTO llega sin el summary embebido, los mappers (`mapReplenishmentRequest`, `mapReplenishmentRequestItem`) inyectan un objeto placeholder con el `id` real y el nombre reemplazado por el placeholder.

**Por qué existen**:

1. **Contrato explícito con el backend**: si el enrichment se rompe, la UI grita visualmente en vez de reventar con `undefined`.
2. **Sirven como canarios**: si un usuario o un evaluador de tesis ve `[AQUI SE DEBERÍA MOSTRAR...]` en producción, es un bug del backend, no del frontend.

**Cuándo aparecerían**: si el backend deja de enrichir las respuestas (regresión), o si un nuevo endpoint devuelve DTOs sin summaries.

---

## Máquina de estados

```
       ┌──────────┐
       │ PENDING  │  (recién creada)
       └────┬─────┘
            │ POST /:id/send
            ▼
       ┌──────────┐
       │   SENT   │  (WhatsApp enviado)
       └────┬─────┘
            │ POST /:id/receive
            ▼
       ┌──────────┐
       │ RECEIVED │  (terminal — genera movimientos IN)
       └──────────┘

En PENDING o SENT:
       POST /:id/cancel → ┌──────────┐
                          │CANCELLED │  (terminal)
                          └──────────┘
```

El frontend expone las transiciones válidas en `canChangeReplenishmentStatus`:

```ts
function canChangeReplenishmentStatus(status: ReplenishmentRow['rawStatus']) {
  return status === 'PENDING' || status === 'SENT'
}
```

Solo se puede accionar cambios sobre PENDING o SENT. RECEIVED y CANCELLED son terminales.

---

## View models

Dos niveles:

### `ReplenishmentRow` (para tabla)

```ts
{
  id: string
  supplier: string          // ya resuelto (nombre)
  requestedBy: string       // ya resuelto (fullName)
  status: ReplenishmentStatusLabel     // 'Pendiente' | 'Enviada' | 'Recibida' | 'Cancelada'
  rawStatus: ReplenishmentStatus       // el enum crudo, para lógica
  requestedAt: string
  sentAt: string            // 'No enviada' si es null
  receivedAt: string | null
  items: number             // count
  estimatedTotal: number    // convertido a number
  notes: string
}
```

Tiene **ambos** `status` (label ES) y `rawStatus` (enum crudo) porque:

- La UI muestra el label.
- La lógica de gating usa el raw.

### `ReplenishmentDetail` (para modal de detalle)

Extiende `ReplenishmentRow` con `items: ReplenishmentDetailItem[]`:

```ts
interface ReplenishmentDetailItem {
  id: string
  productId: string
  name: string              // product.name
  code: string
  requestedQuantity: number
  receivedQuantity: number  // fallback a requestedQuantity si es null
  unitPrice: number | null  // puede ser null
  subtotal: number | null   // requestedQuantity * unitPrice, o null
  stock: number             // product.stock — para mostrar contexto
  minStock: number
}
```

**Regla del `subtotal`**: si `unitPrice` es null, subtotal es null (no 0). Un subtotal de "0" implicaría que el ítem cuesta 0, no que el precio es desconocido.

### Función `getReplenishmentStatusLabel(status)`

Mapping trivial:

```ts
PENDING   → 'Pendiente'
SENT      → 'Enviada'
RECEIVED  → 'Recibida'
CANCELLED → 'Cancelada'
```

---

## Página (`ReplenishmentPage`)

Estado local:

```ts
const [query, setQuery] = useState('')
const [statusFilter, setStatusFilter] = useState<'Todas' | 'Pendiente' | 'Enviada' | 'Recibida' | 'Cancelada'>('Todas')
const [activeModal, setActiveModal] = useState<ReplenishmentModalType | null>(null)
const [selectedRequest, setSelectedRequest] = useState<ReplenishmentRow | null>(null)
```

Filtrado en cliente por status y por búsqueda en `id`, `supplier`, `requestedBy`, `status`, `notes`.

Métricas: cantidad por cada estado.

**Gating de mutaciones**: `manage:replenishment` (ADMIN, MANAGER). El botón "Nueva solicitud" y las acciones de cambio de estado solo aparecen si el rol lo permite.

---

## Modales (`ReplenishmentModals`)

Tres tipos:

### `'detail'`

Muestra `ReplenishmentDetail` con lista de items, cantidades, precios, subtotales, total estimado. Solo lectura.

### `'generate'` — Nueva solicitud

Flujo multi-paso:

1. Seleccionar proveedor (dropdown de `useSuppliers({ active: true, limit: 100 })`).
2. Ver productos del proveedor (filtro `supplierId` en `useProducts`).
3. Agregar productos a la solicitud con cantidad y precio (opcional).
4. Confirmar → `createReplenishmentRequest`.

**Regla clave**: el proveedor se elige primero para filtrar el catálogo de productos por los que el proveedor ya tiene asociados. Si un producto no está asociado al proveedor, no aparece en el dropdown de productos.

`unitPrice` es opcional:

- Si el body de la solicitud lo trae, se usa.
- Si no, el backend intenta usar el `referencePrice` de la relación producto↔proveedor.
- Si ninguno existe, `unitPrice` se guarda como `null` (Bug#3 corregido en el backend).

### `'change-status'`

Muestra las acciones válidas según el `rawStatus` actual:

- Si `PENDING` → botón "Enviar" (POST `/send`) o "Cancelar" (POST `/cancel`).
- Si `SENT` → botón "Marcar como recibida" (POST `/receive`) o "Cancelar".

El modal de recepción permite editar las `receivedQuantity` por item (recepción parcial o completa). Si no se envía body al `/receive`, el backend asume que se recibió todo lo solicitado.

**Bug#2 corregido**: se permite `receivedQuantity > requestedQuantity` (el proveedor puede enviar más de lo pedido).

### Invalidación post-mutación

Todas las mutaciones invalidan al menos:

```ts
queryKeys.replenishmentRequests.all
```

`receive()` invalida además la lista completa de keys de `receiveReplenishmentInvalidationKeys` en `src/lib/queryKeys.ts`:

```ts
queryKeys.replenishmentRequests.all
queryKeys.products.all
queryKeys.products.stockViews()
queryKeys.inventory.all
queryKeys.inventory.stockViews()
queryKeys.inventoryMovements.all
queryKeys.alerts.all
```

Porque recibir una reposición genera movimientos IN → cambia stock → impacta productos, inventario, movimientos y alertas.

---

## Dependencias cross-módulo

- **`suppliers`**: para el dropdown de proveedor y para listar solicitudes por proveedor (feature futura).
- **`products`**: para seleccionar los productos a incluir en la solicitud (filtrados por proveedor).
- **`auth`**: gating con `manage:replenishment` y `view:replenishment`.
- **`inventory-movements`, `inventory`, `alerts`**: invalidados indirectamente al recibir.

---

## Gotchas

- **Los placeholders `[AQUI SE DEBERÍA MOSTRAR...]` NO son bugs del frontend**. Si aparecen, el backend no está enriqueciendo la respuesta. Verificar `mapReplenishmentRequest` y el DTO del backend.
- **`unitPrice: null` es válido**. Cualquier código que calcule totales debe hacer `if (unitPrice != null)` — nunca asumir número.
- **`estimatedTotal` viene como string decimal** del backend. `toReplenishmentRow` lo convierte a `Number` para display. Con totales grandes puede haber pérdida de precisión, pero al no ser usado para cálculos posteriores, es aceptable.
- **La página pide `pageSize: 100`**. Igual que reposición. Escalado limitado.
- **`sentAt` puede ser string (fecha) o `'No enviada'`**. La UI muestra el string tal cual. Si `sentAt` es null y se cambia el fallback, cuidado con formatters de fecha.
- **`receivedQuantity` puede ser `null`** en items que no se recibieron aún. El `ReplenishmentDetailItem` lo colapsa a `requestedQuantity` con `?? item.requestedQuantity`. Esto es display-only, no se envía de vuelta al backend.
- **Las acciones sobre el estado son POSTs sin body para `send` y `cancel`**. Solo `receive` toma un body opcional con los items.
- **El backend puede fallar el envío por WhatsApp** (Twilio caído, número inválido). En ese caso el estado sí cambia a SENT (la BD es la verdad), pero no llega el mensaje. Considerar mostrar un warning en la UI si el response de `/send` trae metadata de error.
