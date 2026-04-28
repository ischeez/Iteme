export interface Listing {
  id: number | string
  title: string
  description?: string
  sellerContact?: string
  price: number
  quantity?: number
  categoryId?: number
  brand?: string | null
  size?: 'S' | 'M' | 'L' | 'XL' | 'XXL' | null
  imageUrl?: string
  images?: string[]
  photos?: string[]
  sellerId?: string | null
  seller?: {
    id: string
    username?: string | null
    firstName?: string | null
    avatarUrl?: string | null
    isVerified?: boolean
  } | null
}
