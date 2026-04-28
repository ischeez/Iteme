import { api } from '../lib/api'

export interface ProductSeller {
  id: string
  username?: string | null
  firstName?: string | null
  avatarUrl?: string | null
  isVerified?: boolean
}

export interface ProductCategory {
  id: number
  name: string
}

export interface ProductItem {
  id: number
  name: string
  description: string
  brand: string
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL'
  sellerContact: string
  quantity: number
  price: number
  imageUrl?: string | null
  categoryId: number
  category?: ProductCategory
  sellerId?: string | null
  seller?: ProductSeller | null
  createdAt: string
}

export interface ProductPayload {
  name: string
  description: string
  brand: string
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL'
  sellerContact: string
  quantity: number
  price: number
  categoryId: number
  imageUrl?: string
}

export interface BuyIntentResponse {
  productId: number
  sellerId: string
  sellerName: string
  buyerId?: string
  listingTitle?: string
  listingPrice?: number
  listingUrl?: string
  chatUrl: string | null
  hasContact: boolean
}

export interface CartItem {
  id: string
  productId: number
  addedAt: string
  status: 'ACTIVE' | 'UNAVAILABLE'
  product: ProductItem
}

export interface CartBuyer {
  userId: string
  username?: string | null
  firstName?: string | null
  avatarUrl?: string | null
  addedAt: string
}

export interface MarkSoldResponse {
  success: boolean
  orderId: string
  listingId: string
}

export async function getProducts() {
  const { data } = await api.get<ProductItem[]>('/products')
  return data
}

export async function getProductById(id: string | number) {
  const { data } = await api.get<ProductItem>(`/products/${id}`)
  return data
}

export async function getMyProducts() {
  const { data } = await api.get<ProductItem[]>('/products/my')
  return data
}

export async function updateProduct(id: string | number, payload: Partial<ProductPayload>) {
  const { data } = await api.patch<ProductItem>(`/products/${id}`, payload)
  return data
}

export async function deleteProduct(id: string | number) {
  const { data } = await api.delete<{ success: boolean }>(`/products/${id}`)
  return data
}

export async function createBuyIntent(productId: string | number) {
  const { data } = await api.post<BuyIntentResponse>(`/products/${productId}/buy-intent`)
  return data
}

export async function addProductToCart(productId: string | number) {
  const { data } = await api.post<CartItem>(`/products/${productId}/cart`)
  return data
}

export async function removeProductFromCart(productId: string | number) {
  const { data } = await api.delete<{ success: boolean }>(`/products/${productId}/cart`)
  return data
}

export async function getMyCart() {
  const { data } = await api.get<CartItem[]>('/products/cart/my')
  return data
}

export async function getCartBuyersForProduct(productId: string | number) {
  const { data } = await api.get<CartBuyer[]>(`/products/${productId}/cart-buyers`)
  return data
}

export async function markProductAsSold(productId: string | number, buyerId: string) {
  const { data } = await api.post<MarkSoldResponse>(`/products/${productId}/mark-sold`, { buyerId })
  return data
}
