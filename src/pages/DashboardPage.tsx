import { Link } from 'react-router-dom'
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

// ─── Mock Data (replace with API calls) ──────────────────────────────────────

const RECENT_ORDERS: Order[] = [
  { id: 'ORD-008', customer: 'Priya Desai',   meal: 'Standard Veg', amount: 290, status: 'Delivered' },
  { id: 'ORD-007', customer: 'Amit Kulkarni', meal: 'Mini Veg',     amount: 130, status: 'Ready'     },
  { id: 'ORD-006', customer: 'Sneha Joshi',   meal: 'Custom',       amount: 175, status: 'Preparing' },
  { id: 'ORD-005', customer: 'Rajesh Patil',  meal: 'Standard Veg', amount: 435, status: 'Pending'   },
]

const STATS = [
  {
    label: 'Orders Today',
    value: '28',
    sub: '+4 from yesterday',
    icon: '🗓️',
  },
  {
    label: 'Revenue Today',
    value: '₹3,840',
    sub: 'Across 28 orders',
    icon: '📈',
  },
  {
    label: 'Active Meal Plan',
    value: 'June Plan',
    sub: '21 days remaining',
    icon: '📅',
  },
  {
    label: 'Avg. Rating',
    value: '4.7',
    sub: 'Based on 124 reviews',
    icon: '⭐',
  },
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h2>Overview</h2>
          <p>{getTodayLabel()}</p>
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.avatar}>N</div>
          <span className={styles.avatarName}>Neelam</span>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Greeting */}
        <div className={styles.greeting}>
          <h1 className={styles.greetingTitle}>
            {getGreeting()}, Neelam 👋
          </h1>
          <p className={styles.greetingMeta}>Amma's Kitchen · Pune</p>
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
                <p className={styles.detailValue}>Amma's Kitchen</p>
              </div>
              <div className={styles.detailGroup}>
                <p className={styles.detailLabel}>Owner</p>
                <p className={styles.detailValue}>Neelam</p>
              </div>
              <div className={styles.detailGroup}>
                <p className={styles.detailLabel}>Phone</p>
                <p className={styles.detailValue}>8362382393</p>
              </div>
              <div className={styles.detailGroup}>
                <p className={styles.detailLabel}>Address</p>
                <p className={styles.detailValue}>Gaikwad Nagar, Pune</p>
              </div>
              <div className={styles.detailGroup}>
                <p className={styles.detailLabel}>Hours</p>
                <p className={styles.detailValue}>09:00 – 21:00</p>
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
