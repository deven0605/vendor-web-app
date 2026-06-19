import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KitchenMap, { type MapLocation } from '@/components/KitchenMap/KitchenMap'
import styles from './RegisterPage.module.css'

// ─── Types ───────────────────────────────────────────────────────────────────

interface BasicInfo {
  kitchenName: string
  ownerName: string
  email: string
  password: string
  confirmPassword: string
  ownerMobile: string
  contactNumber: string
  sameAsOwner: boolean
}

interface LocationInfo {
  mode: 'map' | 'manual'
  streetAddress: string
  city: string
  pincode: string
  state: string
  latitude: string
  longitude: string
}

interface HoursInfo {
  opensAt: string
  closesAt: string
}

type StepErrors = Partial<Record<string, string>>

const LOGGED_IN_EMAIL = 'devendra.lokhande06@gmail.com'

// ─── Step Indicator ───────────────────────────────────────────────────────────

interface StepperProps {
  current: number
}

function Stepper({ current }: StepperProps) {
  const steps = ['Basic Info', 'Location', 'Hours']

  return (
    <div className={styles.stepper}>
      {steps.map((label, i) => {
        const num = i + 1
        const isDone = current > num
        const isActive = current === num
        return (
          <div key={label} className={styles.stepItem}>
            <div
              className={[
                styles.stepCircle,
                isDone ? styles.done : '',
                isActive ? styles.active : '',
              ].join(' ')}
            >
              {isDone ? '✓' : num}
            </div>
            <span
              className={[
                styles.stepLabel,
                isDone ? styles.done : '',
                isActive ? styles.active : '',
              ].join(' ')}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className={styles.stepArrow}>›</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1 — Basic Info ─────────────────────────────────────────────────────

interface Step1Props {
  data: BasicInfo
  onChange: (data: BasicInfo) => void
  onNext: () => void
}

function Step1BasicInfo({ data, onChange, onNext }: Step1Props) {
  const [errors, setErrors] = useState<StepErrors>({})

  const set = (field: keyof BasicInfo, value: string | boolean) => {
    const updated = { ...data, [field]: value }
    if (field === 'sameAsOwner' && value === true) {
      updated.contactNumber = data.ownerMobile
    }
    onChange(updated)
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const validate = () => {
    const e: StepErrors = {}
    if (!data.kitchenName.trim()) e.kitchenName = 'Kitchen name is required'
    if (!data.ownerName.trim()) e.ownerName = 'Owner name is required'
    if (!data.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email address'
    if (!data.password) e.password = 'Password is required'
    else if (data.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!data.confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (data.password !== data.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (!data.ownerMobile.trim()) e.ownerMobile = 'Mobile number is required'
    else if (!/^\d{10}$/.test(data.ownerMobile)) e.ownerMobile = 'Enter a valid 10-digit number'
    if (!data.contactNumber.trim()) e.contactNumber = 'Contact number is required'
    else if (!/^\d{10}$/.test(data.contactNumber)) e.contactNumber = 'Enter a valid 10-digit number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <>
      <h2 className={styles.cardTitle}>Kitchen Details</h2>

      {/* Kitchen Name + Owner Name */}
      <div className={styles.row}>
        <div className={styles.col} style={{ marginBottom: 0 }}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>🏪</span> Kitchen Name *
          </label>
          <input
            className={styles.input}
            placeholder="e.g. Shree Annapurna Kitchen"
            value={data.kitchenName}
            onChange={(e) => set('kitchenName', e.target.value)}
          />
          {errors.kitchenName && <span className={styles.errorMsg}>{errors.kitchenName}</span>}
        </div>
        <div className={styles.col} style={{ marginBottom: 0 }}>
          <label className={styles.label}>Owner Name *</label>
          <input
            className={styles.input}
            placeholder="e.g. Ramesh Sharma"
            value={data.ownerName}
            onChange={(e) => set('ownerName', e.target.value)}
          />
          {errors.ownerName && <span className={styles.errorMsg}>{errors.ownerName}</span>}
        </div>
      </div>

      {/* Email */}
      <div className={styles.col}>
        <label className={styles.label}>
          <span className={styles.labelIcon}>✉️</span> Email ID *
        </label>
        <input
          className={styles.input}
          type="email"
          placeholder="e.g. owner@example.com"
          value={data.email}
          onChange={(e) => set('email', e.target.value)}
        />
        {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
      </div>

      {/* Password + Confirm Password */}
      <div className={styles.row}>
        <div className={styles.col} style={{ marginBottom: 0 }}>
          <label className={styles.label}>🔒 Password *</label>
          <input
            className={styles.input}
            type="password"
            placeholder="Min. 8 characters"
            value={data.password}
            onChange={(e) => set('password', e.target.value)}
          />
          {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
        </div>
        <div className={styles.col} style={{ marginBottom: 0 }}>
          <label className={styles.label}>🔒 Confirm Password *</label>
          <input
            className={styles.input}
            type="password"
            placeholder="Re-enter password"
            value={data.confirmPassword}
            onChange={(e) => set('confirmPassword', e.target.value)}
          />
          {errors.confirmPassword && <span className={styles.errorMsg}>{errors.confirmPassword}</span>}
        </div>
      </div>

      {/* Owner Mobile */}
      <div className={styles.col}>
        <label className={styles.label}>
          <span className={styles.labelIcon}>📞</span> Owner's Mobile Number *
        </label>
        <input
          className={styles.input}
          placeholder="9876543210"
          maxLength={10}
          value={data.ownerMobile}
          onChange={(e) => set('ownerMobile', e.target.value.replace(/\D/g, ''))}
        />
        {errors.ownerMobile && <span className={styles.errorMsg}>{errors.ownerMobile}</span>}
      </div>

      {/* Kitchen Contact Number */}
      <div className={styles.col}>
        <label className={styles.label}>
          <span className={styles.labelIcon}>📞</span> Kitchen's Primary Contact Number *
        </label>
        <input
          className={styles.input}
          placeholder="9876543210"
          maxLength={10}
          disabled={data.sameAsOwner}
          value={data.contactNumber}
          onChange={(e) => set('contactNumber', e.target.value.replace(/\D/g, ''))}
        />
        {errors.contactNumber && <span className={styles.errorMsg}>{errors.contactNumber}</span>}
      </div>

      {/* Same as owner checkbox */}
      <div className={styles.checkRow}>
        <input
          type="checkbox"
          id="sameAsOwner"
          checked={data.sameAsOwner}
          onChange={(e) => set('sameAsOwner', e.target.checked)}
        />
        <label htmlFor="sameAsOwner">Same as owner's mobile number</label>
      </div>

      {/* Logged in as */}
      <p className={styles.loggedAs}>
        Logged in as <span>{LOGGED_IN_EMAIL}</span>
      </p>

      <div className={styles.footer}>
        <div className={styles.footerRight}>
          <button className={styles.btnNext} onClick={handleNext}>
            Next →
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Step 2 — Location ────────────────────────────────────────────────────────

interface Step2Props {
  data: LocationInfo
  onChange: (data: LocationInfo) => void
  onNext: () => void
  onBack: () => void
}

function Step2Location({ data, onChange, onNext, onBack }: Step2Props) {
  const [errors, setErrors] = useState<StepErrors>({})

  const set = (field: keyof LocationInfo, value: string) => {
    onChange({ ...data, [field]: value })
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  // Called when user clicks/searches on the map — auto-fills all location fields
  const handleMapLocationSelect = (loc: MapLocation) => {
    onChange({
      ...data,
      latitude: loc.lat.toFixed(6),
      longitude: loc.lng.toFixed(6),
      streetAddress: loc.streetAddress ?? data.streetAddress,
      city: loc.city ?? data.city,
      state: loc.state ?? data.state,
      pincode: loc.pincode ?? data.pincode,
    })
    setErrors({})
  }

  const validate = () => {
    const e: StepErrors = {}
    if (data.mode === 'map') {
      if (!data.latitude) e.map = 'Please click on the map to select your kitchen location'
    } else {
      if (!data.streetAddress.trim()) e.streetAddress = 'Street address is required'
      if (!data.city.trim()) e.city = 'City is required'
      if (!data.pincode.trim()) e.pincode = 'Pincode is required'
      else if (!/^\d{6}$/.test(data.pincode)) e.pincode = 'Enter a valid 6-digit pincode'
      if (!data.state.trim()) e.state = 'State is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  const mapInitialPosition: [number, number] | undefined =
    data.latitude && data.longitude
      ? [parseFloat(data.latitude), parseFloat(data.longitude)]
      : undefined

  return (
    <>
      <h2 className={styles.cardTitle}>Kitchen Location</h2>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={[styles.tab, data.mode === 'map' ? styles.tabActive : styles.tabInactive].join(' ')}
          onClick={() => onChange({ ...data, mode: 'map' })}
        >
          📍 Select on Map
        </button>
        <button
          className={[styles.tab, data.mode === 'manual' ? styles.tabActive : styles.tabInactive].join(' ')}
          onClick={() => onChange({ ...data, mode: 'manual' })}
        >
          ✏️ Enter Manually
        </button>
      </div>

      {/* MAP MODE */}
      {data.mode === 'map' && (
        <>
          <KitchenMap
            onLocationSelect={handleMapLocationSelect}
            initialPosition={mapInitialPosition}
          />
          {errors.map && (
            <span className={styles.errorMsg} style={{ display: 'block', marginTop: 8 }}>
              {errors.map}
            </span>
          )}
          {/* Show auto-filled address summary after pin drop */}
          {data.latitude && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0f7f2', borderRadius: 8, fontSize: 13, color: '#4a7c59' }}>
              📍 <strong>{data.streetAddress || 'Location selected'}</strong>
              {data.city && `, ${data.city}`}
              {data.state && `, ${data.state}`}
              {data.pincode && ` – ${data.pincode}`}
            </div>
          )}
        </>
      )}

      {/* MANUAL MODE */}
      {data.mode === 'manual' && (
        <>
          <div className={styles.col}>
            <label className={styles.label}>Street Address *</label>
            <input
              className={styles.input}
              placeholder="e.g. Gaikwad Nagar"
              value={data.streetAddress}
              onChange={(e) => set('streetAddress', e.target.value)}
            />
            {errors.streetAddress && <span className={styles.errorMsg}>{errors.streetAddress}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.col} style={{ marginBottom: 0 }}>
              <label className={styles.label}>City *</label>
              <input
                className={styles.input}
                placeholder="Pune"
                value={data.city}
                onChange={(e) => set('city', e.target.value)}
              />
              {errors.city && <span className={styles.errorMsg}>{errors.city}</span>}
            </div>
            <div className={styles.col} style={{ marginBottom: 0 }}>
              <label className={styles.label}>Pincode *</label>
              <input
                className={styles.input}
                placeholder="411033"
                maxLength={6}
                value={data.pincode}
                onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))}
              />
              {errors.pincode && <span className={styles.errorMsg}>{errors.pincode}</span>}
            </div>
          </div>

          <div className={styles.col}>
            <label className={styles.label}>State *</label>
            <input
              className={styles.input}
              placeholder="Maharashtra"
              value={data.state}
              onChange={(e) => set('state', e.target.value)}
            />
            {errors.state && <span className={styles.errorMsg}>{errors.state}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.col} style={{ marginBottom: 0 }}>
              <label className={styles.label}>Latitude (Auto-detected)</label>
              <input
                className={styles.input}
                placeholder="18.5204"
                value={data.latitude}
                readOnly
              />
            </div>
            <div className={styles.col} style={{ marginBottom: 0 }}>
              <label className={styles.label}>Longitude (Auto-detected)</label>
              <input
                className={styles.input}
                placeholder="73.8567"
                value={data.longitude}
                readOnly
              />
            </div>
          </div>
        </>
      )}

      <div className={styles.footer}>
        <button className={styles.btnBack} onClick={onBack}>Back</button>
        <button className={styles.btnNext} onClick={handleNext}>Next →</button>
      </div>
    </>
  )
}

// ─── Step 3 — Operating Hours ─────────────────────────────────────────────────

interface Step3Props {
  data: HoursInfo
  onChange: (data: HoursInfo) => void
  basicInfo: BasicInfo
  locationInfo: LocationInfo
  onBack: () => void
  onSubmit: () => void
  loading: boolean
}

function Step3Hours({ data, onChange, basicInfo, locationInfo, onBack, onSubmit, loading }: Step3Props) {
  const locationSummary = [locationInfo.streetAddress, locationInfo.city]
    .filter(Boolean)
    .join(', ') || (locationInfo.latitude ? 'Selected on map' : '—')

  return (
    <>
      <h2 className={styles.cardTitle}>Operating Hours</h2>

      <div className={styles.timeRow}>
        <div className={styles.col} style={{ marginBottom: 0 }}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>🕐</span> Opens At
          </label>
          <input
            type="time"
            className={styles.timeInput}
            value={data.opensAt}
            onChange={(e) => onChange({ ...data, opensAt: e.target.value })}
          />
        </div>
        <div className={styles.col} style={{ marginBottom: 0 }}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>🕐</span> Closes At
          </label>
          <input
            type="time"
            className={styles.timeInput}
            value={data.closesAt}
            onChange={(e) => onChange({ ...data, closesAt: e.target.value })}
          />
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summaryBox}>
        <p className={styles.summaryTitle}>Registration Summary</p>
        <div className={styles.summaryRow}>
          <span className={styles.summaryKey}>Kitchen</span>
          <span className={styles.summaryVal}>{basicInfo.kitchenName || '—'}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryKey}>Owner</span>
          <span className={styles.summaryVal}>{basicInfo.ownerName || '—'}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryKey}>Phone</span>
          <span className={styles.summaryVal}>{basicInfo.ownerMobile || '—'}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryKey}>Location</span>
          <span className={styles.summaryVal}>{locationSummary || '—'}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.btnBack} onClick={onBack}>Back</button>
        <button className={styles.btnNext} onClick={onSubmit} disabled={loading}>
          {loading ? 'Submitting…' : 'Complete Registration →'}
        </button>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    kitchenName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    ownerMobile: '',
    contactNumber: '',
    sameAsOwner: false,
  })

  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    mode: 'map',
    streetAddress: '',
    city: '',
    pincode: '',
    state: '',
    latitude: '',
    longitude: '',
  })

  const [hoursInfo, setHoursInfo] = useState<HoursInfo>({
    opensAt: '09:00',
    closesAt: '21:00',
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // TODO: replace with your API call
      // await vendorService.register({ basicInfo, locationInfo, hoursInfo })
      navigate('/dashboard')
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Register Your Kitchen</h1>
        <p className={styles.subtitle}>
          Set up your cloud kitchen profile — takes just 2 minutes
        </p>
      </div>

      <Stepper current={step} />

      <div className={styles.card}>
        {step === 1 && (
          <Step1BasicInfo
            data={basicInfo}
            onChange={setBasicInfo}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2Location
            data={locationInfo}
            onChange={setLocationInfo}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Hours
            data={hoursInfo}
            onChange={setHoursInfo}
            basicInfo={basicInfo}
            locationInfo={locationInfo}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}
