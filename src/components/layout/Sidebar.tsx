import { NavLink, useNavigate } from 'react-router-dom'
import { logoutApi } from '@/utils/authFetch'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { label: 'Overview', icon: '📈', to: '/dashboard' },
  { label: "Today's Orders", icon: '🧾', to: '/orders' },
  { label: 'Meal Plans', icon: '📅', to: '/meal-plans' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logoutApi()
    navigate('/login')
  }

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
        <p className={styles.kitchenName}>Amma's Kitchen</p>
        <p className={styles.kitchenMeta}>Pune · 09:00–21:00</p>
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
          <p className={styles.userName}>Neelam</p>
          <p className={styles.userEmail}>devendra.lokhande06@gmail.com</p>
        </div>
        <button className={styles.signOut} onClick={handleSignOut}>
          → Sign Out
        </button>
      </div>
    </aside>
  )
}
