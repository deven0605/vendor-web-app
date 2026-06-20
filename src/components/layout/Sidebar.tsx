import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logoutApi } from '@/utils/authFetch'
import { fetchVendorMe, fetchKitchenDetails } from '@/api/vendorApi'
import type { VendorMe, KitchenDetails } from '@/api/vendorApi'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { label: 'Overview',        icon: '📈', to: '/dashboard' },
  { label: "Today's Orders",  icon: '🧾', to: '/orders'    },
  { label: 'Meal Plans',      icon: '📅', to: '/meal-plans' },
]

function formatHours(hours: KitchenDetails['operatingHours'] | undefined): string {
  if (!hours?.open || !hours?.close) return ''
  return `${hours.open}–${hours.close}`
}

export default function Sidebar() {
  const navigate = useNavigate()
  const [vendor,  setVendor]  = useState<VendorMe | null>(null)
  const [kitchen, setKitchen] = useState<KitchenDetails | null>(null)

  useEffect(() => {
    fetchVendorMe().then(setVendor).catch(console.error)
    fetchKitchenDetails().then(setKitchen).catch(console.error)
  }, [])

  const handleSignOut = async () => {
    await logoutApi()
    navigate('/login')
  }

  const kitchenMeta = [kitchen?.city, formatHours(kitchen?.operatingHours)]
    .filter(Boolean)
    .join(' · ')

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>🍱</div>
        <div className={styles.logoText}>
          <span className={styles.logoName}>ThaliCloud</span>
          <span className={styles.logoSub}>Vendor Portal</span>
        </div>
      </div>

      {/* Kitchen Card */}
      <div className={styles.kitchenCard}>
        <p className={styles.kitchenName}>{kitchen?.kitchenName ?? '…'}</p>
        <p className={styles.kitchenMeta}>{kitchenMeta || '…'}</p>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.active : ''].join(' ')
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + Sign Out */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{vendor?.name ?? '…'}</p>
          <p className={styles.userEmail}>{vendor?.email ?? '…'}</p>
        </div>
        <button className={styles.signOut} onClick={handleSignOut}>
          → Sign Out
        </button>
      </div>
    </aside>
  )
}
