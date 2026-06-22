import { authFetch } from '@/utils/authFetch'

// ─── Response types ───────────────────────────────────────────────────────────

export interface DashboardSummary {
  ordersToday: {
    count: number
    deltaFromYesterday: number
  }
  revenueToday: {
    amountInPaise: number
    orderCount: number
  }
  activeMealPlan: {
    planId: string
    name: string
    daysRemaining: number
  } | null
  avgRating: {
    value: number
    reviewCount: number
  }
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await authFetch('/api/dashboard/summary')
  if (!res.ok) throw new Error('Failed to fetch dashboard summary')
  const json = await res.json() as { data: DashboardSummary }
  return json.data
}
