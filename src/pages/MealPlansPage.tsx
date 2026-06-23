import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchMealTypes,
  fetchMealPlans,
  toggleMealPlanStatus,
  deleteMealPlan,
} from '@/api/mealPlansApi'
import type { MealType, MealPlan } from '@/api/mealPlansApi'
import styles from './MealPlansPage.module.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatDateRange(start: string, end: string, days: number): string {
  const s = new Date(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const e = new Date(end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${s} → ${e} · ${days} Days`
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: MealPlan
  onToggleActive: (id: string, current: boolean) => void
  onDelete: (id: string) => void
  actionLoading: string | null
}

function PlanCard({ plan, onToggleActive, onDelete, actionLoading }: PlanCardProps) {
  const navigate = useNavigate()
  const progressPct = plan.totalDays > 0
    ? Math.min(100, Math.round((plan.daysCompleted / plan.totalDays) * 100))
    : 0
  const isUpdating = actionLoading === plan.planId

  return (
    <div className={styles.planCard}>
      <div className={styles.planCardTop}>
        <div className={styles.planCardLeft}>
          <div className={styles.planNameRow}>
            <span className={styles.planName}>{plan.name}</span>
            <span className={plan.isActive ? styles.badgeActive : styles.badgeInactive}>
              {plan.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <span className={styles.planMeta}>
            {formatDateRange(plan.startDate, plan.endDate, plan.totalDays)}
          </span>
        </div>

        <div className={styles.planActions}>
          <button
            className={plan.isActive ? styles.btnDeactivate : styles.btnActivate}
            onClick={() => onToggleActive(plan.planId, plan.isActive)}
            disabled={isUpdating}
          >
            {isUpdating ? '…' : plan.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            className={styles.btnManageDays}
            onClick={() => navigate(`/meal-plans/${plan.planId}/manage`)}
          >
            ✏️ Manage Days
          </button>
          <button
            className={styles.btnDelete}
            onClick={() => onDelete(plan.planId)}
            disabled={isUpdating}
            title="Delete plan"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className={styles.progressSection}>
        <span className={styles.progressLabel}>Progress</span>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <span className={styles.progressDays}>{plan.daysCompleted}/{plan.totalDays} days</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MealPlansPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [mealTypes, setMealTypes] = useState<MealType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [plansData, typesData] = await Promise.all([fetchMealPlans(), fetchMealTypes()])
        setPlans(plansData)
        setMealTypes(typesData)
      } catch {
        setError('Failed to load data. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleToggleActive = async (planId: string, current: boolean) => {
    setActionLoading(planId)
    try {
      const updated = await toggleMealPlanStatus(planId, !current)
      setPlans((prev) =>
        prev.map((p) => {
          if (p.planId === planId) return { ...p, isActive: updated.isActive }
          // If we just activated a plan, the backend deactivated all others
          if (!current) return { ...p, isActive: false }
          return p
        }),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Delete this meal plan? This cannot be undone.')) return
    setActionLoading(planId)
    try {
      await deleteMealPlan(planId)
      setPlans((prev) => prev.filter((p) => p.planId !== planId))
    } catch {
      alert('Failed to delete plan. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h2>Meal Plans</h2>
          <p>{getTodayLabel()}</p>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Meal Plans</h1>
            <p className={styles.pageSubtitle}>
              Manage your meal offerings by slots and meal type
            </p>
          </div>
          <button className={styles.btnNewPlan} onClick={() => navigate('/meal-plans/create')}>
            + New Plan
          </button>
        </div>

        {/* Meal Type Cards */}
        {mealTypes.length > 0 && (
          <div className={styles.mealTypesGrid}>
            {mealTypes.map((mt) => (
              <div key={mt.id} className={styles.mealTypeCard}>
                <div className={styles.mealTypeHeader}>
                  <div className={styles.mealTypeIcon}>{mt.icon}</div>
                  <div className={styles.mealTypeInfo}>
                    <span className={styles.mealTypeName}>{mt.name}</span>
                    <span className={styles.mealTypePrice}>₹{mt.price}</span>
                  </div>
                </div>
                <p className={styles.mealTypeDesc}>{mt.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ color: '#ef4444', padding: '16px', textAlign: 'center' }}>{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ color: '#6b7280', padding: '32px', textAlign: 'center' }}>
            Loading meal plans…
          </div>
        )}

        {/* Plans List */}
        {!loading && !error && plans.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <p className={styles.emptyText}>No meal plans yet</p>
            <p className={styles.emptySubtext}>Click "+ New Plan" to create your first plan</p>
          </div>
        )}

        {!loading && plans.length > 0 && (
          <div className={styles.plansList}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.planId}
                plan={plan}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
