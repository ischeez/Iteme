export const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'] as const

export const BRAND_OPTIONS = [
  'Balenciaga',
  'Rick Owens',
  'Vetements',
  'Maison Margiela',
  'MM6',
  'Chrome Hearts',
  'Yeezy',
  'Off-White',
  'Palm Angels',
  'Raf Simons',
  'Prada',
  'Miu Miu',
  'Acne Studios',
  'Bottega Veneta',
  'Comme des Garçons',
  'Undercover',
  'Fear of God',
  'Другое',
] as const

export type SizeOption = (typeof SIZE_OPTIONS)[number]
export type BrandOption = (typeof BRAND_OPTIONS)[number]
