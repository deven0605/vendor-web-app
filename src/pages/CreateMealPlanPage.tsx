import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './CreateMealPlanPage.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealType {
  id: string
  name: string
  description: string
  icon: string
}

interface FormState {
  planName: string
  startDate: string
  endDate: string
  selectedMealTypes: string[]
}

interface FormErrors {
  planName?: string
  startDate?: string
  endDate?: string
  mealTypes?: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const MEAL_TYPES: MealType[] = [
  {
    id: 'standard',
    name: 'Standard Veg Thali',
    icon: '🍱',
    description: '3–4 chapatis, dry sabji, gravy sabji, dal, rice, papad, salad, sweet.',
  },
  {
    id: 'mini',
    name: 'Mini Veg Thali',
    icon: '🥘',
    description: '2 chapatis, 1 sabji, dal, rice, sweet.',
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateMealPlanPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [form, setForm] = useState<FormState>({
    planName: '',
    startDate: '',
    endDate: '',
    selectedMealTypes: MEAL_TYPES.map((m) => m.id), // all pre-checked by default
  })

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key as keyof FormErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }))
    }
  }

  const toggleMealType = (id: string) => {
    setForm((f) => {
      const selected = f.selectedMealTypes.includes(id)
        ? f.selectedMealTypes.filter((m) => m !== id)
        : [...f.selectedMealTypes, id]
      return { ...f, selectedMealTypes: selected }
    })
    if (errors.mealTypes) setErrors((e) => ({ ...e, mealTypes: undefined }))
  }

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.planName.trim()) e.planName = 'Plan name is required'
    if (!form.startDate) e.startDate = 'Start date is required'
    if (!form.endDate) e.endDate = 'End date is required'
    else if (form.startDate && form.endDate <= form.startDate)
      e.endDate = 'End date must be after start date'
    if (form.selectedMealTypes.length === 0)
      e.mealTypes = 'Select at least one meal type'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      // TODO: replace with your API call
      // await mealPlanService.create(form)
      navigate('/meal-plans')
    } catch {
      // handle API error
    } finally {
      setLoading(false)
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
        <div className={styles.topBarRight}>
          <div className={styles.avatar}>N</div>
          <span className={styles.avatarName}>Neelam</span>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Back */}
        <button className={styles.backLink} onClick={() => navigate('/meal-plans')}>
          ← Back
        </button>

        <h1 className={styles.pageTitle}>Create Meal Plan</h1>

        <div className={styles.card}>
          {/* Plan Name */}
          <div className={styles.field}>
            <label className={styles.label}>Plan Name *</label>
            <input
              className={styles.input}
              placeholder="e.g. July Monthly Plan"
              value={form.planName}
              onChange={(e) => setField('planName', e.target.value)}
            />
            {errors.planName && <span className={styles.errorMsg}>{errors.planName}</span>}
          </div>

          {/* Start + End Date */}
          <div className={styles.dateRow}>
            <div className={styles.field}>
              <label className={styles.label}>Start Date *</label>
              <input
                type="date"
                className={styles.input}
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
              />
              {errors.startDate && <span className={styles.errorMsg}>{errors.startDate}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>End Date *</label>
              <input
                type="date"
                className={styles.input}
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setField('endDate', e.target.value)}
              />
              {errors.endDate && <span className={styles.errorMsg}>{errors.endDate}</span>}
            </div>
          </div>

          {/* Meal Types */}
          <p className={styles.mealTypesLabel}>
            All {MEAL_TYPES.length} meal types will be active by default for each day:
          </p>

          <div className={styles.mealTypesList}>
            {MEAL_TYPES.map((mt) => {
              const isChecked = form.selectedMealTypes.includes(mt.id)
              return (
                <div
                  key={mt.id}
                  className={[styles.mealTypeRow, isChecked ? styles.checked : ''].join(' ')}
                  onClick={() => toggleMealType(mt.id)}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isChecked}
                    onChange={() => toggleMealType(mt.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className={styles.mealTypeIcon}>{mt.icon}</div>
                  <div className={styles.mealTypeInfo}>
                    <span className={styles.mealTypeName}>{mt.name}</span>
                    <span className={styles.mealTypeDesc}>{mt.description}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {errors.mealTypes && (
            <p className={styles.errorMsg} style={{ marginBottom: 12 }}>
              {errors.mealTypes}
            </p>
          )}

          {/* Required note */}
          <p className={styles.requiredNote}>All fields are required.</p>

          {/* Submit */}
          <button
            className={styles.btnCreate}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
