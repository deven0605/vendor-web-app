import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMealTypes, createMealPlan } from '@/api/mealPlansApi'
import type { MealType } from '@/api/mealPlansApi'
import styles from './CreateMealPlanPage.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateMealPlanPage() {
  const navigate = useNavigate()
  const [mealTypes, setMealTypes] = useState<MealType[]>([])
  const [typesLoading, setTypesLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const [form, setForm] = useState<FormState>({
    planName: '',
    startDate: '',
    endDate: '',
    selectedMealTypes: [],
  })

  useEffect(() => {
    fetchMealTypes()
      .then((types) => {
        setMealTypes(types)
        setForm((f) => ({ ...f, selectedMealTypes: types.map((t) => t.id) }))
      })
      .catch(() => { /* fallback: empty list, user sees no checkboxes */ })
      .finally(() => setTypesLoading(false))
  }, [])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSubmitError(null)
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
    if (!form.startDate) {
      e.startDate = 'Start date is required'
    } else if (form.startDate < todayISO()) {
      e.startDate = 'Start date must not be in the past'
    }
    if (!form.endDate) {
      e.endDate = 'End date is required'
    } else if (form.startDate && form.endDate <= form.startDate) {
      e.endDate = 'End date must be after start date'
    }
    if (form.selectedMealTypes.length === 0) {
      e.mealTypes = 'Select at least one meal type'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await createMealPlan({
        name: form.planName.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        mealTypeIds: form.selectedMealTypes,
      })
      navigate('/meal-plans')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to create plan. Please try again.')
    } finally {
      setSubmitting(false)
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
                min={todayISO()}
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
                min={form.startDate || todayISO()}
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
              />
              {errors.endDate && <span className={styles.errorMsg}>{errors.endDate}</span>}
            </div>
          </div>

          {/* Meal Types */}
          {typesLoading ? (
            <p style={{ color: '#6b7280', fontSize: 14 }}>Loading meal types…</p>
          ) : (
            <>
              <p className={styles.mealTypesLabel}>
                Select which meal types are enabled for each day:
              </p>
              <div className={styles.mealTypesList}>
                {mealTypes.map((mt) => {
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
            </>
          )}

          {errors.mealTypes && (
            <p className={styles.errorMsg} style={{ marginBottom: 12 }}>
              {errors.mealTypes}
            </p>
          )}

          {submitError && (
            <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{submitError}</p>
          )}

          <p className={styles.requiredNote}>All fields are required.</p>

          <button
            className={styles.btnCreate}
            onClick={handleSubmit}
            disabled={submitting || typesLoading}
          >
            {submitting ? 'Creating…' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
