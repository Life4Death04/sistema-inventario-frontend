import { apiClient } from '@/lib/axios'
import type {
  PageSizePaginatedResponse,
  ReplenishmentProductSummary,
  ReplenishmentRequest,
  ReplenishmentRequestItem,
  ReplenishmentRequestWithItems,
  ReplenishmentStatus,
  ReplenishmentSupplierSummary,
  ReplenishmentUserSummary,
} from '@/types/api.types'

export const REPLENISHMENT_SUPPLIER_PLACEHOLDER = '[AQUI SE DEBERÍA MOSTRAR EL PROVEEDOR]'
export const REPLENISHMENT_REQUESTED_BY_USER_PLACEHOLDER = '[AQUI SE DEBERÍA MOSTRAR EL USUARIO SOLICITANTE]'
export const REPLENISHMENT_PRODUCT_PLACEHOLDER = '[AQUI SE DEBERÍA MOSTRAR EL PRODUCTO]'

export interface ListReplenishmentRequestsParams {
  page?: number
  pageSize?: number
  status?: ReplenishmentStatus
  supplierId?: string
  dateFrom?: string
  dateTo?: string
}

export interface CreateReplenishmentRequestItemInput {
  productId: string
  requestedQuantity: number
  unitPrice?: number
}

export interface CreateReplenishmentRequestInput {
  supplierId: string
  notes?: string
  items: CreateReplenishmentRequestItemInput[]
}

export interface ReceiveReplenishmentRequestItemInput {
  id: string
  receivedQuantity?: number
}

export interface ReceiveReplenishmentRequestInput {
  items?: ReceiveReplenishmentRequestItemInput[]
}

export interface ReplenishmentRequestViewItem extends ReplenishmentRequestItem {
  product: ReplenishmentProductSummary
}

export interface ReplenishmentRequestView extends Omit<ReplenishmentRequest, 'supplier' | 'requestedByUser'> {
  supplier: ReplenishmentSupplierSummary
  requestedByUser: ReplenishmentUserSummary
}

export interface ReplenishmentRequestWithItemsView extends ReplenishmentRequestView {
  items: ReplenishmentRequestViewItem[]
}

interface ReplenishmentRequestEnvelope {
  request: ReplenishmentRequestWithItems
}

export interface ReplenishmentRequestListResponse extends Omit<PageSizePaginatedResponse<ReplenishmentRequest>, 'data'> {
  data: ReplenishmentRequestView[]
}

function mapReplenishmentRequestItem(item: ReplenishmentRequestItem): ReplenishmentRequestViewItem {
  return {
    ...item,
    product: item.product ?? buildProductPlaceholder(item.productId),
  }
}

export function mapReplenishmentRequest(dto: ReplenishmentRequest): ReplenishmentRequestView {
  return {
    ...dto,
    supplier: dto.supplier ?? buildSupplierPlaceholder(dto.supplierId),
    requestedByUser: dto.requestedByUser ?? buildRequestedByUserPlaceholder(dto.requestedByUserId),
  }
}

export function mapReplenishmentRequestWithItems(dto: ReplenishmentRequestWithItems): ReplenishmentRequestWithItemsView {
  return {
    ...mapReplenishmentRequest(dto),
    items: dto.items.map(mapReplenishmentRequestItem),
  }
}

function mapReplenishmentRequestList(
  response: PageSizePaginatedResponse<ReplenishmentRequest>,
): ReplenishmentRequestListResponse {
  return {
    ...response,
    data: response.data.map(mapReplenishmentRequest),
  }
}

export async function listReplenishmentRequests(
  params?: ListReplenishmentRequestsParams,
): Promise<ReplenishmentRequestListResponse> {
  const { data } = await apiClient.get<PageSizePaginatedResponse<ReplenishmentRequest>>('/replenishment-requests', {
    params,
  })

  return mapReplenishmentRequestList(data)
}

export async function getReplenishmentRequest(id: string): Promise<ReplenishmentRequestWithItemsView> {
  const { data } = await apiClient.get<ReplenishmentRequestEnvelope>(`/replenishment-requests/${id}`)

  return mapReplenishmentRequestWithItems(data.request)
}

export async function createReplenishmentRequest(input: CreateReplenishmentRequestInput): Promise<ReplenishmentRequestWithItemsView> {
  const { data } = await apiClient.post<ReplenishmentRequestEnvelope>('/replenishment-requests', input)

  return mapReplenishmentRequestWithItems(data.request)
}

export async function sendReplenishmentRequest(id: string): Promise<ReplenishmentRequestWithItemsView> {
  const { data } = await apiClient.post<ReplenishmentRequestEnvelope>(`/replenishment-requests/${id}/send`)

  return mapReplenishmentRequestWithItems(data.request)
}

export async function receiveReplenishmentRequest(
  id: string,
  input?: ReceiveReplenishmentRequestInput,
): Promise<ReplenishmentRequestWithItemsView> {
  // When a UI mutation starts using this endpoint, invalidate the grouped keys declared
  // in `receiveReplenishmentInvalidationKeys` from `src/lib/queryKeys.ts`.
  const { data } = await apiClient.post<ReplenishmentRequestEnvelope>(`/replenishment-requests/${id}/receive`, input)

  return mapReplenishmentRequestWithItems(data.request)
}

export async function cancelReplenishmentRequest(id: string): Promise<ReplenishmentRequestWithItemsView> {
  const { data } = await apiClient.post<ReplenishmentRequestEnvelope>(`/replenishment-requests/${id}/cancel`)

  return mapReplenishmentRequestWithItems(data.request)
}

export async function listReplenishmentRequestsBySupplier(
  supplierId: string,
  params?: ListReplenishmentRequestsParams,
): Promise<ReplenishmentRequestListResponse> {
  const { data } = await apiClient.get<PageSizePaginatedResponse<ReplenishmentRequest>>(
    `/suppliers/${supplierId}/replenishment-requests`,
    { params },
  )

  return mapReplenishmentRequestList(data)
}

function buildSupplierPlaceholder(supplierId: string): ReplenishmentSupplierSummary {
  return {
    id: supplierId,
    name: REPLENISHMENT_SUPPLIER_PLACEHOLDER,
    rif: null,
    whatsapp: null,
    address: null,
    active: false,
  }
}

function buildRequestedByUserPlaceholder(userId: string): ReplenishmentUserSummary {
  return {
    id: userId,
    fullName: REPLENISHMENT_REQUESTED_BY_USER_PLACEHOLDER,
    email: '',
    role: 'OPERATOR',
    active: false,
  }
}

function buildProductPlaceholder(productId: string): ReplenishmentProductSummary {
  return {
    id: productId,
    code: productId,
    name: REPLENISHMENT_PRODUCT_PLACEHOLDER,
    activeIngredient: null,
    presentation: null,
    brand: null,
    unit: 'UNIT',
    unitContent: '',
    stock: 0,
    minStock: 0,
    active: false,
  }
}
