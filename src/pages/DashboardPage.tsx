import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVendorMe, fetchKitchenDetails } from '@/api/vendorApi'
import type { VendorMe, KitchenDetails } from '@/api/vendorApi'
import styles from './DashboardPage.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'Delivered' | 'Ready' | 'Preparing' | 'Pending'

interface Order {
  id: string
  customer: string
  meal: string
  amount: number
  status: OrderStatus
}

// ─── Mock data — replace with API calls (Module 3: Orders) ───────────────────

const RECENT_ORDERS: Order[] = [
  { id: 'ORD-008', customer: 'Priya Desai',   meal: 'Standard Veg', amount: 290, status: 'Delivered' },
  { id: 'ORD-007', customer: 'Amit Kulkarni', meal: 'Mini Veg',     amount: 130, status: 'Ready'     },
  { id: 'ORD-006', customer: 'Sneha Joshi',   meal: 'Custom',       amount: 175, status: 'Preparing' },
  { id: 'ORD-005', customer: 'Rajesh Patil',  meal: 'Standard Veg', amount: 435, status: 'Pending'   },
]

// ─── Mock stats — replace with GET /api/dashboard/summary (Module 2) ─────────

const STATS = [
  { label: 'Orders Today',    value: '28',       sub: '+4 from yesterday',     icon: '🗓️' },
  { label: 'Revenue Today',   value: '₹3,840',   sub: 'Across 28 orders',      icon: '📈' },
  { label: 'Active Meal Plan',value: 'June Plan', sub: '21 days remaining',    icon: '📅' },
  { label: 'Avg. Rating',     value: '4.7',       sub: 'Based on 124 reviews', icon: '⭐' },
]

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
    Ready:     styles.ready,
    Preparing: styles.preparing,
    Pending:   styles.pending,
  }
  return map[status]
}

function formatHours(hours: KitchenDetails['operatingHours'] | undefined): string {
  if (!hours?.open || !hours?.close) return '—'
  return `${hours.open} – ${hours.close}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [vendor, setVendor]   = useState<VendorMe | null>(null)
  const [kitchen, setKitchen] = useState<KitchenDetails | null>(null)

  useEffect(() => {
    fetchVendorMe().then(setVendor).catch(console.error)
    fetchKitchenDetails().then(setKitchen).catch(console.error)
  }, [])

  const displayName    = vendor?.name          ?? '…'
  const avatarInitial  = vendor?.avatarInitial ?? '…'
  const kitchenName    = kitchen?.kitchenName  ?? '…'
  const kitchenCity    = kitchen?.city         ?? '…'

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
          {STATS.map((s) => (
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

            {RECENT_ORDERS.map((order) => (
              <div key={order.id} className={styles.orderRow}>
                <div className={styles.orderLeft}>
                  <p className={styles.orderId}>{order.id}</p>
                  <p className={styles.orderCustomer}>{order.customer}</p>
                </div>
                <span className={styles.orderMeal}>{order.meal}</span>
                <span className={styles.orderAmount}>₹{order.amount}</span>
                <span className={[styles.badge, statusClass(order.status)].join(' ')}>
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
