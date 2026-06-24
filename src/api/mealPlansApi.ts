import { authFetch } from '@/utils/authFetch'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealType {
  id: string
  name: string
  price: number
  description: string
  icon: string
}

export interface MealPlan {
  planId: string
  name: string
  startDate: string
  endDate: string
  totalDays: number
  daysCompleted: number
  isActive: boolean
  mealTypeIds: string[]
}

export interface MenuDetails {
  vegetables: string[]
  chapatiCount: number
  riceType: string
  riceCount: number
  dal: string
}

export interface DayMenuEntry {
  date: string
  lunch: MenuDetails
  dinner: MenuDetails
}

export interface MenuOptions {
  vegetables: string[]
  dalOptions: string[]
  riceOptions: string[]
  constraints: {
    maxVegetables: number
    chapatiMin: number
    chapatiMax: number
    riceMin: number
    riceMax: number
  }
}

export interface SlotMenuSavedResponse {
  planId: string
  date: string
  slot: string
  menu: MenuDetails
  savedAt: string
}

export interface PlanStatusResponse {
  planId: string
  isActive: boolean
  updatedAt: string
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function fetchMealTypes(): Promise<MealType[]> {
  const res = await authFetch('/api/mealTypes')
  if (!res.ok) throw new Error('Failed to fetch meal types')
  const json = await res.json() as { data: MealType[] }
  return json.data
}

export async function fetchMenuOptions(): Promise<MenuOptions> {
  const res = await authFetch('/api/menu-options')
  if (!res.ok) throw new Error('Failed to fetch menu options')
  const json = await res.json() as { data: MenuOptions }
  return json.data
}

export async function fetchMealPlans(isActive?: boolean): Promise<MealPlan[]> {
  const query = isActive != null ? `?isActive=${isActive}` : ''
  const res = await authFetch(`/api/meal-plans${query}`)
  if (!res.ok) throw new Error('Failed to fetch meal plans')
  const json = await res.json() as { data: MealPlan[] }
  return json.data
}

export async function fetchMealPlan(planId: string): Promise<MealPlan> {
  const res = await authFetch(`/api/meal-plans/${planId}`)
  if (!res.ok) throw new Error('Failed to fetch meal plan')
  const json = await res.json() as { data: MealPlan }
  return json.data
}

export async function createMealPlan(payload: {
  name: string
  startDate: string
  endDate: string
  mealTypeIds: string[]
}): Promise<MealPlan> {
  const res = await authFetch('/api/meal-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? 'Failed to create meal plan')
  }
  const json = await res.json() as { data: MealPlan }
  return json.data
}

export async function toggleMealPlanStatus(planId: string, isActive: boolean): Promise<PlanStatusResponse> {
  const res = await authFetch(`/api/meal-plans/${planId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? 'Failed to update plan status')
  }
  const json = await res.json() as { data: PlanStatusResponse }
  return json.data
}

export async function deleteMealPlan(planId: string): Promise<void> {
  const res = await authFetch(`/api/meal-plans/${planId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete meal plan')
}

export async function fetchDayMenus(planId: string): Promise<DayMenuEntry[]> {
  const res = await authFetch(`/api/meal-plans/${planId}/days`)
  if (!res.ok) throw new Error('Failed to fetch day menus')
  const json = await res.json() as { data: DayMenuEntry[] }
  return json.data
}

export async function saveSlotMenu(
  planId: string,
  date: string,
  slot: 'lunch' | 'dinner',
  menu: MenuDetails
): Promise<SlotMenuSavedResponse> {
  const res = await authFetch(`/api/meal-plans/${planId}/days/${date}/slots/${slot}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menu),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? 'Failed to save menu')
  }
  const json = await res.json() as { data: SlotMenuSavedResponse }
  return json.data
}
