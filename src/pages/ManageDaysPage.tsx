import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ManageDaysPage.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const VEGETABLE_OPTIONS = [
  'Paneer Butter Masala', 'Aloo Gobi', 'Palak Paneer', 'Bhindi Masala',
  'Chana Masala', 'Mixed Veg', 'Matar Paneer', 'Baingan Bharta',
  'Jeera Aloo', 'Rajma', 'Kadai Paneer', 'Mushroom Masala',
]

const DAL_OPTIONS = ['Dal Tadka', 'Dal Makhani', 'Dal Fry', 'Chana Dal', 'Moong Dal']

const RICE_OPTIONS = ['Onion Rice', 'Jeera Rice', 'Plain Rice', 'Veg Pulao']

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const MAX_VEG = 5

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealMenu {
  vegetables: string[]
  chapatiCount: number
  riceType: string
  riceCount: number
  dal: string
}

interface DaySlots {
  lunch: MealMenu
  dinner: MealMenu
}

interface DayEntry {
  date: Date
  slots: DaySlots
  isExpanded: boolean
  lunchOpen: boolean
  dinnerOpen: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function defaultMenu(): MealMenu {
  return {
    vegetables: ['Paneer Butter Masala', 'Aloo Gobi'],
    chapatiCount: 4,
    riceType: 'Onion Rice',
    riceCount: 1,
    dal: 'Dal Tadka',
  }
}

function generateDays(start: Date, end: Date): DayEntry[] {
  const days: DayEntry[] = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push({
      date: new Date(cur),
      slots: { lunch: defaultMenu(), dinner: defaultMenu() },
      isExpanded: false,
      lunchOpen: true,
      dinnerOpen: false,
    })
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

function formatSlotTitle(date: Date, slot: 'Lunch' | 'Dinner'): string {
  const day = DAY_NAMES[date.getDay()]
  const d = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return `${day}, ${d} – ${slot}`
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
  menu: MealMenu
  onChange: (m: MealMenu) => void
  onReset: () => void
  onSave: () => void
}

function SlotForm({ menu, onChange, onReset, onSave }: SlotFormProps) {
  const set = <K extends keyof MealMenu>(k: K, v: MealMenu[K]) =>
    onChange({ ...menu, [k]: v })

  const addVeg = (veg: string) => {
    if (!veg || menu.vegetables.includes(veg) || menu.vegetables.length >= MAX_VEG) return
    set('vegetables', [...menu.vegetables, veg])
  }

  const removeVeg = (veg: string) =>
    set('vegetables', menu.vegetables.filter((v) => v !== veg))

  const availableVegs = VEGETABLE_OPTIONS.filter((v) => !menu.vegetables.includes(v))

  return (
    <div className={styles.menuForm}>
      <p className={styles.formSectionTitle}>Menu Details</p>

      {/* Vegetables */}
      <div className={styles.formField}>
        <div className={styles.fieldLabel}>
          Vegetables
          <span className={styles.fieldLabelHint}>Select up to {MAX_VEG}</span>
        </div>
        <div className={styles.vegTagsWrapper}>
          {menu.vegetables.map((v) => (
            <span key={v} className={styles.vegTag}>
              {v}
              <button className={styles.vegTagRemove} onClick={() => removeVeg(v)}>×</button>
            </span>
          ))}
        </div>
        {menu.vegetables.length < MAX_VEG && (
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
            min={1} max={8}
            onChange={(v) => set('chapatiCount', v)}
          />
        </div>

        {/* Rice */}
        <div className={styles.formField}>
          <div className={styles.fieldLabel}>{menu.riceType}</div>
          <QtyControl
            value={menu.riceCount}
            min={0} max={4}
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
            {RICE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
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
            {DAL_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.btnReset} onClick={onReset}>Reset</button>
        <button className={styles.btnSave} onClick={onSave}>Save Menu</button>
      </div>
    </div>
  )
}

// ─── Day Row ──────────────────────────────────────────────────────────────────

interface DayRowProps {
  entry: DayEntry
  onToggleExpand: () => void
  onToggleLunch: () => void
  onToggleDinner: () => void
  onLunchChange: (m: MealMenu) => void
  onDinnerChange: (m: MealMenu) => void
  onLunchReset: () => void
  onDinnerReset: () => void
  onSave: (slot: 'lunch' | 'dinner') => void
}

function DayRow({
  entry, onToggleExpand,
  onToggleLunch, onToggleDinner,
  onLunchChange, onDinnerChange,
  onLunchReset, onDinnerReset,
  onSave,
}: DayRowProps) {
  const { date, slots, isExpanded, lunchOpen, dinnerOpen } = entry
  const dayName = DAY_NAMES[date.getDay()]
  const dayNum = date.getDate()
  const monthStr = date.toLocaleDateString('en-IN', { month: 'short' })

  return (
    <div className={styles.dayRow}>
      {/* Collapsed header */}
      <div
        className={[styles.dayRowHeader, isExpanded ? styles.expanded : ''].join(' ')}
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
            {slots.lunch.vegetables.length + slots.lunch.chapatiCount} thalis
          </span>
          <span className={styles.slotCount}>
            <span className={styles.slotIcon}>🌙</span>
            {slots.dinner.vegetables.length + slots.dinner.chapatiCount} thalis
          </span>
        </div>

        <span className={[styles.arrow, isExpanded ? styles.open : ''].join(' ')}>▼</span>
      </div>

      {/* Expanded meal slots */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          {/* Lunch */}
          <div className={styles.slotAccordion}>
            <div className={styles.slotHeader} onClick={onToggleLunch}>
              <span className={styles.slotTitle}>
                <span className={styles.slotTitleIcon}>☀️</span>
                {formatSlotTitle(date, 'Lunch')}
              </span>
              <span className={[styles.slotArrow, lunchOpen ? styles.open : ''].join(' ')}>▼</span>
            </div>
            {lunchOpen && (
              <SlotForm
                menu={slots.lunch}
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
                {formatSlotTitle(date, 'Dinner')}
              </span>
              <span className={[styles.slotArrow, dinnerOpen ? styles.open : ''].join(' ')}>▼</span>
            </div>
            {dinnerOpen && (
              <SlotForm
                menu={slots.dinner}
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

const PLAN_START = new Date(2026, 5, 1)   // 1 Jun 2026
const PLAN_END   = new Date(2026, 5, 30)  // 30 Jun 2026

export default function ManageDaysPage() {
  const navigate = useNavigate()
  const [days, setDays] = useState<DayEntry[]>(() => generateDays(PLAN_START, PLAN_END))

  const updateDay = (i: number, patch: Partial<DayEntry>) =>
    setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d))

  const updateSlot = (i: number, slot: 'lunch' | 'dinner', menu: MealMenu) =>
    setDays((prev) =>
      prev.map((d, idx) =>
        idx === i ? { ...d, slots: { ...d.slots, [slot]: menu } } : d,
      ),
    )

  const handleSave = (i: number, slot: 'lunch' | 'dinner') => {
    // TODO: call API to save menu for this day/slot
    alert(`Menu saved for ${DAY_NAMES[days[i].date.getDay()]} ${slot}!`)
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
        {/* Plan header */}
        <div className={styles.planHeader}>
          <button className={styles.backBtn} onClick={() => navigate('/meal-plans')}>
            ← Back
          </button>
          <div className={styles.planTitleBlock}>
            <h1 className={styles.planTitle}>June Monthly Plan</h1>
            <p className={styles.planDates}>{formatDateRange(PLAN_START, PLAN_END)}</p>
          </div>
        </div>

        {/* Days */}
        <div className={styles.daysList}>
          {days.map((entry, i) => (
            <DayRow
              key={entry.date.toISOString()}
              entry={entry}
              onToggleExpand={() =>
                updateDay(i, { isExpanded: !entry.isExpanded, lunchOpen: true, dinnerOpen: false })
              }
              onToggleLunch={() => updateDay(i, { lunchOpen: !entry.lunchOpen })}
              onToggleDinner={() => updateDay(i, { dinnerOpen: !entry.dinnerOpen })}
              onLunchChange={(m) => updateSlot(i, 'lunch', m)}
              onDinnerChange={(m) => updateSlot(i, 'dinner', m)}
              onLunchReset={() => updateSlot(i, 'lunch', defaultMenu())}
              onDinnerReset={() => updateSlot(i, 'dinner', defaultMenu())}
              onSave={(slot) => handleSave(i, slot)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
