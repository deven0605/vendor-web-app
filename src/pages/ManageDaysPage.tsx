import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchMealPlan,
  fetchDayMenus,
  fetchMenuOptions,
  saveSlotMenu,
} from '@/api/mealPlansApi'
import type { MealPlan, DayMenuEntry, MenuDetails, MenuOptions } from '@/api/mealPlansApi'
import styles from './ManageDaysPage.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayEntry {
  date: string          // YYYY-MM-DD
  lunch: MenuDetails
  dinner: MenuDetails
  isExpanded: boolean
  lunchOpen: boolean
  dinnerOpen: boolean
  lunchSaving: boolean
  dinnerSaving: boolean
  lunchSaved: boolean
  dinnerSaved: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return `${fmt(start)} – ${fmt(end)}`
}

function formatSlotTitle(dateStr: string, slot: 'Lunch' | 'Dinner'): string {
  const date = new Date(dateStr)
  const day = DAY_NAMES[date.getDay()]
  const d = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return `${day}, ${d} – ${slot}`
}

function toDayEntry(entry: DayMenuEntry): DayEntry {
  return {
    date: entry.date,
    lunch: entry.lunch,
    dinner: entry.dinner,
    isExpanded: false,
    lunchOpen: true,
    dinnerOpen: false,
    lunchSaving: false,
    dinnerSaving: false,
    lunchSaved: false,
    dinnerSaved: false,
  }
}

// ─── Quantity Control ─────────────────────────────────────────────────────────

interface QtyControlProps {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}

function QtyControl({ value, min = 1, max = 10, onChange }: QtyControlProps) {
  return (
    <div className={styles.qtyControl}>
      <button className={styles.qtyBtn} onClick={() => onChange(value - 1)} disabled={value <= min}>−</button>
      <span className={styles.qtyValue}>{value}</span>
      <button className={styles.qtyBtn} onClick={() => onChange(value + 1)} disabled={value >= max}>+</button>
    </div>
  )
}

// ─── Meal Slot Form ───────────────────────────────────────────────────────────

interface SlotFormProps {
  menu: MenuDetails
  options: MenuOptions
  saving: boolean
  saved: boolean
  onChange: (m: MenuDetails) => void
  onReset: () => void
  onSave: () => void
}

function SlotForm({ menu, options, saving, saved, onChange, onReset, onSave }: SlotFormProps) {
  const set = <K extends keyof MenuDetails>(k: K, v: MenuDetails[K]) =>
    onChange({ ...menu, [k]: v })

  const addVeg = (veg: string) => {
    if (!veg || menu.vegetables.includes(veg) || menu.vegetables.length >= options.constraints.maxVegetables) return
    set('vegetables', [...menu.vegetables, veg])
  }

  const removeVeg = (veg: string) =>
    set('vegetables', menu.vegetables.filter((v) => v !== veg))

  const availableVegs = options.vegetables.filter((v) => !menu.vegetables.includes(v))

  return (
    <div className={styles.menuForm}>
      <p className={styles.formSectionTitle}>Menu Details</p>

      {/* Vegetables */}
      <div className={styles.formField}>
        <div className={styles.fieldLabel}>
          Vegetables
          <span className={styles.fieldLabelHint}>Select up to {options.constraints.maxVegetables}</span>
        </div>
        <div className={styles.vegTagsWrapper}>
          {menu.vegetables.map((v) => (
            <span key={v} className={styles.vegTag}>
              {v}
              <button className={styles.vegTagRemove} onClick={() => removeVeg(v)}>×</button>
            </span>
          ))}
        </div>
        {menu.vegetables.length < options.constraints.maxVegetables && (
          <select
            className={styles.selectInput}
            value=""
            onChange={(e) => { addVeg(e.target.value); e.target.value = '' }}
          >
            <option value="" disabled>Add vegetable…</option>
            {availableVegs.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.formRow}>
        {/* Chapati */}
        <div className={styles.formField}>
          <div className={styles.fieldLabel}>Chapati / Roti</div>
          <QtyControl
            value={menu.chapatiCount}
            min={options.constraints.chapatiMin}
            max={options.constraints.chapatiMax}
            onChange={(v) => set('chapatiCount', v)}
          />
        </div>

        {/* Rice count */}
        <div className={styles.formField}>
          <div className={styles.fieldLabel}>{menu.riceType}</div>
          <QtyControl
            value={menu.riceCount}
            min={options.constraints.riceMin}
            max={options.constraints.riceMax}
            onChange={(v) => set('riceCount', v)}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        {/* Rice type */}
        <div className={styles.formField}>
          <div className={styles.fieldLabel}>Rice Type</div>
          <select
            className={styles.selectInput}
            value={menu.riceType}
            onChange={(e) => set('riceType', e.target.value)}
          >
            {options.riceOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Dal */}
        <div className={styles.formField}>
          <div className={styles.fieldLabel}>Dal</div>
          <select
            className={styles.selectInput}
            value={menu.dal}
            onChange={(e) => set('dal', e.target.value)}
          >
            {options.dalOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.btnReset} onClick={onReset} disabled={saving}>Reset</button>
        <button className={styles.btnSave} onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Menu'}
        </button>
      </div>
    </div>
  )
}

// ─── Day Row ──────────────────────────────────────────────────────────────────

interface DayRowProps {
  entry: DayEntry
  options: MenuOptions
  onToggleExpand: () => void
  onToggleLunch: () => void
  onToggleDinner: () => void
  onLunchChange: (m: MenuDetails) => void
  onDinnerChange: (m: MenuDetails) => void
  onLunchReset: () => void
  onDinnerReset: () => void
  onSave: (slot: 'lunch' | 'dinner') => void
}

function DayRow({
  entry, options,
  onToggleExpand, onToggleLunch, onToggleDinner,
  onLunchChange, onDinnerChange,
  onLunchReset, onDinnerReset,
  onSave,
}: DayRowProps) {
  const date = new Date(entry.date)
  const dayName = DAY_NAMES[date.getDay()]
  const dayNum = date.getDate()
  const monthStr = date.toLocaleDateString('en-IN', { month: 'short' })

  return (
    <div className={styles.dayRow}>
      <div
        className={[styles.dayRowHeader, entry.isExpanded ? styles.expanded : ''].join(' ')}
        onClick={onToggleExpand}
      >
        <div className={styles.dateBadge}>
          <span className={styles.dayName}>{dayName}</span>
          <span className={styles.dayNum}>{dayNum}</span>
          <span className={styles.dayMonth}>{monthStr}</span>
        </div>

        <div className={styles.thalliCounts}>
          <span className={styles.slotCount}>
            <span className={styles.slotIcon}>☀️</span>
            {entry.lunch.vegetables.length + entry.lunch.chapatiCount} thalis
          </span>
          <span className={styles.slotCount}>
            <span className={styles.slotIcon}>🌙</span>
            {entry.dinner.vegetables.length + entry.dinner.chapatiCount} thalis
          </span>
        </div>

        <span className={[styles.arrow, entry.isExpanded ? styles.open : ''].join(' ')}>▼</span>
      </div>

      {entry.isExpanded && (
        <div className={styles.expandedContent}>
          {/* Lunch */}
          <div className={styles.slotAccordion}>
            <div className={styles.slotHeader} onClick={onToggleLunch}>
              <span className={styles.slotTitle}>
                <span className={styles.slotTitleIcon}>☀️</span>
                {formatSlotTitle(entry.date, 'Lunch')}
              </span>
              <span className={[styles.slotArrow, entry.lunchOpen ? styles.open : ''].join(' ')}>▼</span>
            </div>
            {entry.lunchOpen && (
              <SlotForm
                menu={entry.lunch}
                options={options}
                saving={entry.lunchSaving}
                saved={entry.lunchSaved}
                onChange={onLunchChange}
                onReset={onLunchReset}
                onSave={() => onSave('lunch')}
              />
            )}
          </div>

          {/* Dinner */}
          <div className={styles.slotAccordion}>
            <div className={styles.slotHeader} onClick={onToggleDinner}>
              <span className={styles.slotTitle}>
                <span className={styles.slotTitleIcon}>🌙</span>
                {formatSlotTitle(entry.date, 'Dinner')}
              </span>
              <span className={[styles.slotArrow, entry.dinnerOpen ? styles.open : ''].join(' ')}>▼</span>
            </div>
            {entry.dinnerOpen && (
              <SlotForm
                menu={entry.dinner}
                options={options}
                saving={entry.dinnerSaving}
                saved={entry.dinnerSaved}
                onChange={onDinnerChange}
                onReset={onDinnerReset}
                onSave={() => onSave('dinner')}
              />
            )}
          </div>

          <p className={styles.slotNote}>
            Note: Your selected menu will be shown to customers for this day's meal.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManageDaysPage() {
  const navigate = useNavigate()
  const { planId } = useParams<{ planId: string }>()

  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [days, setDays] = useState<DayEntry[]>([])
  const [options, setOptions] = useState<MenuOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!planId) return
    async function load() {
      try {
        const [planData, dayMenus, menuOpts] = await Promise.all([
          fetchMealPlan(planId!),
          fetchDayMenus(planId!),
          fetchMenuOptions(),
        ])
        setPlan(planData)
        setOptions(menuOpts)
        setDays(dayMenus.map(toDayEntry))
      } catch {
        setError('Failed to load plan data. Please go back and try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [planId])

  const updateDay = useCallback((i: number, patch: Partial<DayEntry>) =>
    setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d)),
  [])

  const updateSlot = useCallback((i: number, slot: 'lunch' | 'dinner', menu: MenuDetails) =>
    setDays((prev) =>
      prev.map((d, idx) =>
        idx === i ? { ...d, [slot]: menu, [`${slot}Saved`]: false } : d,
      ),
    ),
  [])

  const handleSave = useCallback(async (i: number, slot: 'lunch' | 'dinner') => {
    if (!planId) return
    const entry = days[i]
    const menu = slot === 'lunch' ? entry.lunch : entry.dinner
    const savingKey = slot === 'lunch' ? 'lunchSaving' : 'dinnerSaving'
    const savedKey  = slot === 'lunch' ? 'lunchSaved'  : 'dinnerSaved'

    updateDay(i, { [savingKey]: true, [savedKey]: false })
    try {
      await saveSlotMenu(planId, entry.date, slot, menu)
      updateDay(i, { [savingKey]: false, [savedKey]: true })
      setTimeout(() => updateDay(i, { [savedKey]: false }), 2000)
    } catch (e) {
      updateDay(i, { [savingKey]: false })
      alert(e instanceof Error ? e.message : 'Failed to save menu')
    }
  }, [planId, days, updateDay])

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Loading…</div>
      </div>
    )
  }

  if (error || !plan || !options) {
    return (
      <div className={styles.page}>
        <div style={{ padding: 32, textAlign: 'center', color: '#ef4444' }}>
          {error ?? 'Plan not found.'}
        </div>
        <button onClick={() => navigate('/meal-plans')} style={{ margin: '0 auto', display: 'block' }}>
          ← Back to Meal Plans
        </button>
      </div>
    )
  }

  const defaultMenu: MenuDetails = {
    vegetables: options.vegetables.slice(0, 2),
    chapatiCount: options.constraints.chapatiMin,
    riceType: options.riceOptions[0],
    riceCount: 1,
    dal: options.dalOptions[0],
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
        <div className={styles.planHeader}>
          <button className={styles.backBtn} onClick={() => navigate('/meal-plans')}>
            ← Back
          </button>
          <div className={styles.planTitleBlock}>
            <h1 className={styles.planTitle}>{plan.name}</h1>
            <p className={styles.planDates}>{formatDateRange(plan.startDate, plan.endDate)}</p>
          </div>
        </div>

        <div className={styles.daysList}>
          {days.map((entry, i) => (
            <DayRow
              key={entry.date}
              entry={entry}
              options={options}
              onToggleExpand={() =>
                updateDay(i, { isExpanded: !entry.isExpanded, lunchOpen: true, dinnerOpen: false })
              }
              onToggleLunch={() => updateDay(i, { lunchOpen: !entry.lunchOpen })}
              onToggleDinner={() => updateDay(i, { dinnerOpen: !entry.dinnerOpen })}
              onLunchChange={(m) => updateSlot(i, 'lunch', m)}
              onDinnerChange={(m) => updateSlot(i, 'dinner', m)}
              onLunchReset={() => updateSlot(i, 'lunch', { ...defaultMenu })}
              onDinnerReset={() => updateSlot(i, 'dinner', { ...defaultMenu })}
              onSave={(slot) => handleSave(i, slot)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
