import { authFetch } from '@/utils/authFetch'

// ─── Response types (mirror vendor-service DTOs) ─────────────────────────────

export interface VendorMe {
  vendorId: string
  name: string
  email: string
  avatarInitial: string
}

export interface OperatingHours {
  open: string   // "HH:mm"
  close: string  // "HH:mm"
}

export interface KitchenDetails {
  kitchenName: string
  ownerName: string
  phone: string
  address: string | null
  city: string | null
  operatingHours: OperatingHours
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function fetchVendorMe(): Promise<VendorMe> {
  const res = await authFetch('/api/vendor/me')
  if (!res.ok) throw new Error('Failed to fetch vendor profile')
  const json = await res.json() as { data: VendorMe }
  return json.data
}

export async function fetchKitchenDetails(): Promise<KitchenDetails> {
  const res = await authFetch('/api/vendor/kitchen')
  if (!res.ok) throw new Error('Failed to fetch kitchen details')
  const json = await res.json() as { data: KitchenDetails }
  return json.data
}
