import { api } from '../lib/api'

export interface GuarantorItem {
  id: string
  nickname: string
  avatarUrl?: string | null
  description?: string | null
  contact?: string | null
  telegramUrl?: string | null
  isActive: boolean
  sortOrder: number
}

export async function getGuarantors() {
  const { data } = await api.get<GuarantorItem[]>('/guarantors')
  return data
}

export async function getAdminGuarantors() {
  const { data } = await api.get<GuarantorItem[]>('/guarantors/admin')
  return data
}

export async function createGuarantor(payload: Partial<GuarantorItem> & { nickname: string }) {
  const { data } = await api.post<GuarantorItem>('/guarantors', payload)
  return data
}

export async function updateGuarantor(id: string, payload: Partial<GuarantorItem>) {
  const { data } = await api.patch<GuarantorItem>(`/guarantors/${id}`, payload)
  return data
}

export async function deleteGuarantor(id: string) {
  const { data } = await api.delete<{ success: boolean }>(`/guarantors/${id}`)
  return data
}
