import { useCallback, useEffect, useState } from 'react'
import {
  fetchOrders,
  updateOrderStatus,
  acceptOrder,
  rejectOrder,
  rupeesFromPaise,
  STATUS_NEXT,
} from '@/api/ordersApi'
import type { Order, OrderStatus, OrdersParams } from '@/api/ordersApi'
import styles from './OrdersPage.module.css'

// Ready->Dispatched and Dispatched->Delivered now happen automatically from
// the delivery partner's pickup/delivery OTP flow (see delivery-service), so
// the vendor's view needs to refresh on its own to pick those up.
const POLL_INTERVAL_MS = 15000

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function statusClass(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Delivered: styles.delivered,
    Dispatched: styles.dispatched,
    Ready:     styles.ready,
    Preparing: styles.preparing,
    Pending:   styles.pending,
    'Kitchen Accepted': styles.kitchenAccepted,
    Rejected:  styles.rejected,
  }
  return map[status] ?? ''
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all',       label: 'All Statuses' },
  { value: 'Pending',   label: 'Pending'       },
  { value: 'Kitchen Accepted', label: 'Kitchen Accepted' },
  { value: 'Preparing', label: 'Preparing'     },
  { value: 'Ready',     label: 'Ready'         },
  { value: 'Dispatched', label: 'Dispatched'  },
  { value: 'Delivered', label: 'Delivered'     },
  { value: 'Rejected',  label: 'Rejected'      },
]

const PAGE_SIZE = 20

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders,        setOrders]        = useState<Order[]>([])
  const [totalCount,    setTotalCount]    = useState(0)
  const [totalPages,    setTotalPages]    = useState(1)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [advancingId,   setAdvancingId]   = useState<string | null>(null)

  // Filter state
  const [date,      setDate]      = useState(todayISO())
  const [status,    setStatus]    = useState<string>('all')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [sortBy,    setSortBy]    = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: OrdersParams = {
        date,
        status: status as OrderStatus | 'all',
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortOrder,
      }
      const data = await fetchOrders(params)
      setOrders(data.orders)
      setTotalCount(data.pagination.totalCount)
      setTotalPages(data.pagination.totalPages)
    } catch {
      setError('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [date, status, search, page, sortBy, sortOrder])

  useEffect(() => {
    load()
  }, [load])

  // Light polling so vendor-driven statuses that now change automatically
  // (Ready -> Dispatched -> Delivered, via the delivery partner's OTP flow)
  // show up without a manual page refresh.
  useEffect(() => {
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  // Reset to page 1 when filters change
  const applyFilter = (fn: () => void) => {
    fn()
    setPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const sortIcon = (field: string) => {
    if (sortBy !== field) return ' ↕'
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  const handleAdvance = async (order: Order) => {
    const next = STATUS_NEXT[order.status]
    if (!next) return
    setAdvancingId(order.orderId)
    try {
      await updateOrderStatus(order.orderId, next)
      await load()
    } catch {
      alert('Failed to update order status.')
    } finally {
      setAdvancingId(null)
    }
  }

  const handleAccept = async (order: Order) => {
    setAdvancingId(order.orderId)
    try {
      await acceptOrder(order.orderId)
      await load()
    } catch {
      alert('Failed to accept order.')
    } finally {
      setAdvancingId(null)
    }
  }

  const handleReject = async (order: Order) => {
    const reason = window.prompt('Reason for rejecting this order:')
    if (reason == null || reason.trim() === '') return
    setAdvancingId(order.orderId)
    try {
      await rejectOrder(order.orderId, reason.trim())
      await load()
    } catch {
      alert('Failed to reject order.')
    } finally {
      setAdvancingId(null)
    }
  }

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Today's Orders</h2>
          <p className={styles.subtitle}>{displayDate} · {totalCount} orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="date"
          value={date}
          onChange={(e) => applyFilter(() => setDate(e.target.value))}
          className={styles.filterInput}
        />
        <select
          value={status}
          onChange={(e) => applyFilter(() => setStatus(e.target.value))}
          className={styles.filterSelect}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by name or order ID…"
          value={search}
          onChange={(e) => applyFilter(() => setSearch(e.target.value))}
          className={styles.searchInput}
        />
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {error && <p className={styles.error}>{error}</p>}

        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('createdAt')} className={styles.sortable}>
                Order ID{sortIcon('createdAt')}
              </th>
              <th onClick={() => handleSort('customerName')} className={styles.sortable}>
                Customer{sortIcon('customerName')}
              </th>
              <th>Meal Type</th>
              <th onClick={() => handleSort('amount')} className={styles.sortable}>
                Amount{sortIcon('amount')}
              </th>
              <th onClick={() => handleSort('status')} className={styles.sortable}>
                Status{sortIcon('status')}
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>Loading…</td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  No orders found for the selected filters.
                </td>
              </tr>
            )}
            {!loading && orders.map((order) => {
              const next = STATUS_NEXT[order.status]
              const isBusy = advancingId === order.orderId
              return (
                <tr key={order.orderId}>
                  <td className={styles.orderId}>{order.orderId}</td>
                  <td>{order.customerName}</td>
                  <td>{order.mealType}</td>
                  <td className={styles.amount}>{rupeesFromPaise(order.amountInPaise)}</td>
                  <td>
                    <span className={[styles.badge, statusClass(order.status)].join(' ')}>
                      {order.status}
                    </span>
                    {order.status === 'Rejected' && order.rejectionReason && (
                      <div className={styles.rejectionReason}>{order.rejectionReason}</div>
                    )}
                  </td>
                  <td>
                    {order.status === 'Pending' ? (
                      <div className={styles.actionGroup}>
                        <button
                          className={styles.acceptBtn}
                          onClick={() => handleAccept(order)}
                          disabled={isBusy}
                        >
                          {isBusy ? '…' : 'Accept'}
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => handleReject(order)}
                          disabled={isBusy}
                        >
                          Reject
                        </button>
                      </div>
                    ) : next ? (
                      <button
                        className={styles.advanceBtn}
                        onClick={() => handleAdvance(order)}
                        disabled={isBusy}
                      >
                        {isBusy ? '…' : `Mark ${next}`}
                      </button>
                    ) : (
                      <span className={styles.noAction}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
          >
            ← Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
