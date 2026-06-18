import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './MealPlansPage.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealType {
  id: string
  name: string
  price: number
  description: string
  icon: string
}

interface MealPlan {
  id: string
  name: string
  startDate: string
  endDate: string
  totalDays: number
  daysCompleted: number
  isActive: boolean
}

interface NewPlanForm {
  name: string
  startDate: string
  endDate: string
}

// ─── Mock data (replace with API calls) ──────────────────────────────────────

const MEAL_TYPES: MealType[] = [
  {
    id: 'standard',
    name: 'Standard Thali',
    price: 160,
    icon: '🍱',
    description: '3–4 chapatis, dry sabji, gravy sabji, dal, rice, papad, salad, sweet.',
  },
  {
    id: 'mini',
    name: 'Mini Thali',
    price: 100,
    icon: '🥘',
    description: '2 chapatis, 1 sabji, dal, rice, sweet.',
  },
]

const INITIAL_PLANS: MealPlan[] = [
  {
    id: 'plan-1',
    name: 'June Monthly Plan',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    totalDays: 30,
    daysCompleted: 8,
    isActive: true,
  },
]

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

function calcProgress(start: string, end: string): { completed: number; total: number } {
  const now = new Date()
  const s = new Date(start)
  const e = new Date(end)
  const total = Math.round((e.getTime() - s.getTime()) / 86400000)
  const completed = Math.max(0, Math.min(total, Math.round((now.getTime() - s.getTime()) / 86400000)))
  return { completed, total }
}

// ─── New Plan Modal ───────────────────────────────────────────────────────────

interface NewPlanModalProps {
  onClose: () => void
  onCreate: (plan: Omit<MealPlan, 'id' | 'isActive' | 'daysCompleted'>) => void
}

function NewPlanModal({ onClose, onCreate }: NewPlanModalProps) {
  const [form, setForm] = useState<NewPlanForm>({ name: '', startDate: '', endDate: '' })
  const [errors, setErrors] = useState<Partial<NewPlanForm>>({})

  const set = (field: keyof NewPlanForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const validate = () => {
    const e: Partial<NewPlanForm> = {}
    if (!form.name.trim()) e.name = 'Plan name is required'
    if (!form.startDate) e.startDate = 'Start date is required'
    if (!form.endDate) e.endDate = 'End date is required'
    else if (form.startDate && form.endDate <= form.startDate) e.endDate = 'End date must be after start date'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = () => {
    if (!validate()) return
    const s = new Date(form.startDate)
    const e = new Date(form.endDate)
    const totalDays = Math.round((e.getTime() - s.getTime()) / 86400000)
    onCreate({ name: form.name.trim(), startDate: form.startDate, endDate: form.endDate, totalDays })
    onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Create New Meal Plan</h3>

        <div className={styles.modalField}>
          <label className={styles.modalLabel}>Plan Name *</label>
          <input
            className={styles.modalInput}
            placeholder="e.g. July Monthly Plan"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
          {errors.name && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.name}</span>}
        </div>

        <div className={styles.modalField}>
          <label className={styles.modalLabel}>Start Date *</label>
          <input
            type="date"
            className={styles.modalInput}
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
          />
          {errors.startDate && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.startDate}</span>}
        </div>

        <div className={styles.modalField}>
          <label className={styles.modalLabel}>End Date *</label>
          <input
            type="date"
            className={styles.modalInput}
            value={form.endDate}
            onChange={(e) => set('endDate', e.target.value)}
          />
          {errors.endDate && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.endDate}</span>}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button className={styles.btnCreate} onClick={handleCreate}>Create Plan</button>
        </div>
      </div>
    </div>
  )
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: MealPlan
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
}

function PlanCard({ plan, onToggleActive, onDelete }: PlanCardProps) {
  const navigate = useNavigate()
  const { completed, total } = calcProgress(plan.startDate, plan.endDate)
  const progressPct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0

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
            {formatDateRange(plan.startDate, plan.endDate, total)}
          </span>
        </div>

        <div className={styles.planActions}>
          <button
            className={plan.isActive ? styles.btnDeactivate : styles.btnActivate}
            onClick={() => onToggleActive(plan.id)}
          >
            {plan.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button className={styles.btnManageDays} onClick={() => navigate(`/meal-plans/${plan.id}/manage`)}>
            ✏️ Manage Days
          </button>
          <button className={styles.btnDelete} onClick={() => onDelete(plan.id)} title="Delete plan">
            🗑️
          </button>
        </div>
      </div>

      <div className={styles.progressSection}>
        <span className={styles.progressLabel}>Progress</span>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <span className={styles.progressDays}>{completed}/{total} days</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MealPlansPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<MealPlan[]>(INITIAL_PLANS)
  const [showModal, setShowModal] = useState(false)

  const handleCreate = (data: Omit<MealPlan, 'id' | 'isActive' | 'daysCompleted'>) => {
    setPlans((prev) => [
      ...prev,
      { ...data, id: `plan-${Date.now()}`, isActive: false, daysCompleted: 0 },
    ])
  }

  const handleToggleActive = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
    )
  }

  const handleDelete = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h2>Meal Plans</h2>
          <p>{getTodayLabel()}</p>
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.avatar}>N</div>
          <span className={styles.avatarName}>Neelam</span>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Meal Plans</h1>
            <p className={styles.pageSubtitle}>
              Manage your meal offerings by slots and meal slot
            </p>
          </div>
          <button className={styles.btnNewPlan} onClick={() => navigate('/meal-plans/create')}>
            + New Plan
          </button>
        </div>

        {/* Meal Type Cards */}
        <div className={styles.mealTypesGrid}>
          {MEAL_TYPES.map((mt) => (
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

        {/* Plans List */}
        {plans.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <p className={styles.emptyText}>No meal plans yet</p>
            <p className={styles.emptySubtext}>Click "+ New Plan" to create your first plan</p>
          </div>
        ) : (
          <div className={styles.plansList}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Plan Modal */}
      {showModal && (
        <NewPlanModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
