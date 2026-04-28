import { api } from '../lib/api'
import type { ProductItem } from './products'

export interface SellerStoreResponse {
  seller: {
    id: string
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    avatarUrl?: string | null
    isVerified?: boolean
    createdAt: string
  }
  rating: number | null
  reviewsCount: number
  products: ProductItem[]
}

export interface SellerReviewItem {
  id: string
  rating: number
  comment?: string | null
  sellerReply?: string | null
  sellerReplyAt?: string | null
  createdAt: string
  product?: {
    id: number
    name: string
  } | null
  buyer?: {
    id: string
    username?: string | null
    firstName?: string | null
    avatarUrl?: string | null
  }
}

export async function getSellerStore(sellerId: string) {
  const { data } = await api.get<SellerStoreResponse>(`/sellers/${sellerId}/store`)
  return data
}

export async function getSellerReviews(sellerId: string) {
  const { data } = await api.get<SellerReviewItem[]>(`/sellers/${sellerId}/reviews`)
  return data
}

export async function createSellerReview(sellerId: string, payload: { rating: number; comment?: string }) {
  const { data } = await api.post<SellerReviewItem>(`/sellers/${sellerId}/reviews`, payload)
  return data
}

export async function replySellerReview(sellerId: string, reviewId: string, payload: { reply: string }) {
  const { data } = await api.patch<SellerReviewItem>(`/sellers/${sellerId}/reviews/${reviewId}/reply`, payload)
  return data
}
