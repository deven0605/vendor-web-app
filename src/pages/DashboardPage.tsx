import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVendorMe, fetchKitchenDetails } from '@/api/vendorApi'
import type { VendorMe, KitchenDetails } from '@/api/vendorApi'
import { fetchDashboardSummary } from '@/api/dashboardApi'
import type { DashboardSummary } from '@/api/dashboardApi'
import { fetchRecentOrders, rupeesFromPaise } from '@/api/ordersApi'
import type { Order } from '@/api/ordersApi'
import styles from './DashboardPage.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'Delivered' | 'Dispatched' | 'Ready' | 'Preparing' | 'Pending' | 'Kitchen Accepted' | 'Rejected'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
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

function formatHours(hours: KitchenDetails['operatingHours'] | undefined): string {
  if (!hours?.open || !hours?.close) return '—'
  return `${hours.open} – ${hours.close}`
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta} from yesterday`
  if (delta < 0) return `${delta} from yesterday`
  return 'Same as yesterday'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [vendor,   setVendor]   = useState<VendorMe | null>(null)
  const [kitchen,  setKitchen]  = useState<KitchenDetails | null>(null)
  const [summary,  setSummary]  = useState<DashboardSummary | null>(null)
  const [orders,   setOrders]   = useState<Order[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetchVendorMe().then(setVendor),
      fetchKitchenDetails().then(setKitchen),
      fetchDashboardSummary().then(setSummary),
      fetchRecentOrders(5).then(setOrders),
    ])
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const displayName   = vendor?.name          ?? '…'
  const avatarInitial = vendor?.avatarInitial ?? '…'
  const kitchenName   = kitchen?.kitchenName  ?? '…'
  const kitchenCity   = kitchen?.city         ?? '…'

  // Build stat cards from live data once loaded
  const stats = summary
    ? [
        {
          label: 'Orders Today',
          value: String(summary.ordersToday.count),
          sub:   formatDelta(summary.ordersToday.deltaFromYesterday),
          icon:  '🗓️',
        },
        {
          label: 'Revenue Today',
          value: rupeesFromPaise(summary.revenueToday.amountInPaise),
          sub:   `Across ${summary.revenueToday.orderCount} orders`,
          icon:  '📈',
        },
        {
          label: 'Active Meal Plan',
          value: summary.activeMealPlan?.name ?? 'None',
          sub:   summary.activeMealPlan
            ? `${summary.activeMealPlan.daysRemaining} days remaining`
            : 'No active plan',
          icon:  '📅',
        },
        {
          label: 'Avg. Rating',
          value: summary.avgRating.reviewCount > 0
            ? String(summary.avgRating.value)
            : '—',
          sub: summary.avgRating.reviewCount > 0
            ? `Based on ${summary.avgRating.reviewCount} reviews`
            : 'No reviews yet',
          icon: '⭐',
        },
      ]
    : null

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h2>Overview</h2>
          <p>{getTodayLabel()}</p>
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.avatar}>{avatarInitial}</div>
          <span className={styles.avatarName}>{displayName}</span>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Greeting */}
        <div className={styles.greeting}>
          <h1 className={styles.greetingTitle}>
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className={styles.greetingMeta}>{kitchenName} · {kitchenCity}</p>
        </div>

        {/* Stat Cards */}
        <div className={styles.statsGrid}>
          {(stats ?? [
            { label: 'Orders Today',     value: loading ? '…' : '0',    sub: '—', icon: '🗓️' },
            { label: 'Revenue Today',    value: loading ? '…' : '₹0',   sub: '—', icon: '📈' },
            { label: 'Active Meal Plan', value: loading ? '…' : 'None', sub: '—', icon: '📅' },
            { label: 'Avg. Rating',      value: loading ? '…' : '—',    sub: '—', icon: '⭐' },
          ]).map((s) => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>{s.label}</span>
                <span className={styles.statIcon}>{s.icon}</span>
              </div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statSub}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Bottom Grid */}
        <div className={styles.bottomGrid}>
          {/* Recent Orders */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Recent Orders</span>
              <Link to="/orders" className={styles.viewAll}>View all →</Link>
            </div>

            {loading && (
              <p className={styles.placeholder}>Loading orders…</p>
            )}
            {!loading && orders.length === 0 && (
              <p className={styles.placeholder}>No orders yet today.</p>
            )}
            {orders.map((order) => (
              <div key={order.orderId} className={styles.orderRow}>
                <div className={styles.orderLeft}>
                  <p className={styles.orderId}>{order.orderId}</p>
                  <p className={styles.orderCustomer}>{order.customerName}</p>
                </div>
                <span className={styles.orderMeal}>{order.mealType}</span>
                <span className={styles.orderAmount}>{rupeesFromPaise(order.amountInPaise)}</span>
                <span className={[styles.badge, statusClass(order.status as OrderStatus)].join(' ')}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>

          {/* Kitchen Details */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Kitchen Details</span>
            </div>

            <div className={styles.kitchenDetails}>
              <div className={styles.detailGroup}>
                <p className={styles.detailLabel}>Kitchen</p>
                <p className={styles.detailValue}>{kitchen?.kitchenName ?? '…'}</p>
              </div>
              <div className={styles.detailGroup}>
                <p className={styles.detailLabel}>Owner</p>
                <p className={styles.detailValue}>{kitchen?.ownerName ?? '…'}</p>
              </div>
              <div className={styles.detailGroup}>
                <p className={styles.detailLabel}>Phone</p>
                <p className={styles.detailValue}>{kitchen?.phone ?? '…'}</p>
              </div>
              <div className={styles.detailGroup}>
                <p className={styles.detailLabel}>Address</p>
                <p className={styles.detailValue}>{kitchen?.address ?? '…'}</p>
              </div>
              <div className={styles.detailGroup}>
                <p className={styles.detailLabel}>Hours</p>
                <p className={styles.detailValue}>{formatHours(kitchen?.operatingHours)}</p>
              </div>

              <Link to="/meal-plans">
                <button className={styles.managePlansBtn}>
                  Manage Meal Plans →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
