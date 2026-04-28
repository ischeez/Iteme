import { api } from '../lib/api'

export interface SubscriptionDto {
  id: string
  userId: string
  isActive: boolean
  expiresAt?: string | null
  createdAt: string
  updatedAt: string
}

export async function getMySubscription() {
  const { data } = await api.get<SubscriptionDto>('/subsriptions/my')
  return data
}

export async function buySubscription() {
  const { data } = await api.post<SubscriptionDto>('/subsriptions/buy')
  return data
}
