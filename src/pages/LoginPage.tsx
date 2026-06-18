import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './LoginPage.module.css'

interface LoginForm {
  email: string
  password: string
}

interface FieldError {
  email?: string
  password?: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldError>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    const newErrors: FieldError = {}
    if (!form.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address'
    }
    if (!form.password) {
      newErrors.password = 'Password is required'
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FieldError]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      // TODO: replace with your API call
      // await authService.login(form)
      navigate('/dashboard')
    } catch {
      setErrors({ password: 'Invalid email or password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* ── LEFT PANEL ── */}
      <div className={styles.left}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🍱</div>
          <span className={styles.logoText}>ThaliCloud</span>
        </div>

        {/* Tag */}
        <p className={styles.vendorTag}>
          <span className={styles.tagDot} />
          Vendor Portal
        </p>

        {/* Headline */}
        <h1 className={styles.headline}>
          Manage Your Cloud Kitchen with Ease
        </h1>

        <p className={styles.subtext}>
          Create meal plans, track daily orders, and serve your
          Thali customers efficiently — all from one dashboard.
        </p>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>142</div>
            <div className={styles.statLabel}>Orders Today</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>8</div>
            <div className={styles.statLabel}>Active Plans</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>4,820</div>
            <div className={styles.statLabel}>Meals Served</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={styles.right}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Welcome back</h2>
          <p className={styles.cardSubtitle}>Sign in to your vendor account</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              {/* Email */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vendor@kitchen.com"
                  value={form.email}
                  onChange={handleChange}
                  className={styles.input}
                />
                {errors.email && (
                  <span className={styles.errorMsg}>{errors.email}</span>
                )}
              </div>

              {/* Password */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">
                  Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    className={styles.input}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      // Eye-off SVG
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      // Eye SVG
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className={styles.errorMsg}>{errors.password}</span>
                )}
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className={styles.registerLink}>
            New Vendor?{' '}
            <Link to="/register">Register your business</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
