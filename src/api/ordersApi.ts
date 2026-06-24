import { authFetch } from '@/utils/authFetch'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Dispatched' | 'Delivered'

export interface Order {
  orderId: string
  customerName: string
  mealType: string
  amountInPaise: number
  status: OrderStatus
  createdAt: string
}

export interface PaginationInfo {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface PagedOrdersResponse {
  orders: Order[]
  pagination: PaginationInfo
}

export interface OrdersParams {
  date?: string           // YYYY-MM-DD
  status?: OrderStatus | 'all'
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function fetchRecentOrders(limit = 5): Promise<Order[]> {
  const res = await authFetch(`/api/orders/recent?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch recent orders')
  const json = await res.json() as { data: Order[] }
  return json.data
}

export async function fetchOrders(params: OrdersParams): Promise<PagedOrdersResponse> {
  const query = new URLSearchParams()
  if (params.date)                           query.set('date',      params.date)
  if (params.status && params.status !== 'all') query.set('status',    params.status)
  if (params.search)                         query.set('search',    params.search)
  if (params.page    != null)                query.set('page',      String(params.page))
  if (params.pageSize != null)               query.set('pageSize',  String(params.pageSize))
  if (params.sortBy)                         query.set('sortBy',    params.sortBy)
  if (params.sortOrder)                      query.set('sortOrder', params.sortOrder)

  const res = await authFetch(`/api/orders?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch orders')
  const json = await res.json() as { data: PagedOrdersResponse }
  return json.data
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const res = await authFetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update order status')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function rupeesFromPaise(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

export const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  Pending:    'Preparing',
  Preparing:  'Ready',
  Ready:      'Dispatched',
  Dispatched: 'Delivered',
  Delivered:  null,
}
