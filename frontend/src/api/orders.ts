import { api } from '../lib/api'

export interface OrderItem {
  id: number | string
  listingId?: number | string
  buyerId?: number | string
  sellerId?: number | string
  status?: string
  createdAt?: string
  updatedAt?: string
  listing?: {
    id: number | string
    title?: string
    name?: string
    price?: number
  }
}

export async function createOrder(listingId: string) {
  const { data } = await api.post<OrderItem>('/orders', { listingId })
  return data
}

export async function getMyPurchases() {
  const { data } = await api.get<OrderItem[]>('/orders/my-purchases')
  return data
}

export async function getMySales() {
  const { data } = await api.get<OrderItem[]>('/orders/my-sales')
  return data
}
