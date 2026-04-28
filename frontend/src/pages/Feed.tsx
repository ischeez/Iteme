import { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getPublicHomepageSettings, type HomepageSettings } from '../api/admin'
import { getProducts, type ProductItem } from '../api/products'
import { ProductCard } from '../components/ProductCard'
import { BRAND_OPTIONS, SIZE_OPTIONS } from '../lib/catalog'
import { resolveMediaUrl } from '../lib/media'
import type { Listing } from '../types/listing'

export default function Feed() {
  const location = useLocation()
  const [items, setItems] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [homepage, setHomepage] = useState<HomepageSettings | null>(null)
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isPersonalized, setIsPersonalized] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const fetchListings = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [productsResult, homepageResult] = await Promise.allSettled([
          getProducts(),
          getPublicHomepageSettings(),
        ])

        if (productsResult.status === 'rejected') {
          throw productsResult.reason
        }

        const payload = productsResult.value

        if (homepageResult.status === 'fulfilled') {
          setHomepage(homepageResult.value)
        } else {
          setHomepage(null)
        }

        const mapped: Listing[] = (payload as ProductItem[]).map((product) => ({
          id: product.id,
          title: product.name,
          description: product.description,
          sellerContact: product.sellerContact,
          price: product.price,
          quantity: product.quantity,
          categoryId: product.categoryId,
          imageUrl: product.imageUrl ?? undefined,
          brand: product.brand,
          size: product.size,
          sellerId: product.sellerId ?? null,
          seller: product.seller
            ? {
                id: product.seller.id,
                username: product.seller.username ?? undefined,
                firstName: product.seller.firstName ?? undefined,
                avatarUrl: product.seller.avatarUrl ?? undefined,
                isVerified: product.seller.isVerified,
              }
            : null,
        }))

        setItems(mapped)
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить ленту товаров')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchListings()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') ?? ''
    const shouldOpenSearch = params.get('openSearch') === '1' || Boolean(q.trim())

    setSearch(q)
    if (shouldOpenSearch) {
      setIsFiltersOpen(true)
    }
  }, [location.search])

  const brands = useMemo(() => ['all', ...BRAND_OPTIONS], [])
  const sizes = useMemo(() => ['all', ...SIZE_OPTIONS], [])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.brand?.toLowerCase().includes(q)

      const matchesBrand = selectedBrand === 'all' || item.brand?.trim() === selectedBrand
      const matchesSize = selectedSize === 'all' || item.size?.trim() === selectedSize

      return matchesSearch && matchesBrand && matchesSize
    })
  }, [items, search, selectedBrand, selectedSize])

  const bannerTitle = homepage?.bannerTitle?.trim() ?? ''
  const bannerSubtitle = homepage?.bannerSubtitle?.trim() ?? ''
  const hasBannerCaption = Boolean(bannerTitle || bannerSubtitle)

  return (
    <section className="space-y-4 md:space-y-5">
      <div className="iteme-hero relative overflow-hidden rounded-[2px] bg-[#121212] text-white">
        {homepage?.isBannerEnabled && homepage.bannerImageUrl ? (
          <a
            href={homepage.bannerLinkUrl || '#'}
            className="block"
            target={homepage.bannerLinkUrl ? '_blank' : undefined}
            rel={homepage.bannerLinkUrl ? 'noreferrer' : undefined}
          >
            <img src={resolveMediaUrl(homepage.bannerImageUrl)} alt={bannerTitle || 'banner'} className="h-[220px] w-full object-cover md:h-[300px]" />
            {hasBannerCaption && (
              <div className="absolute inset-x-0 bottom-0 bg-black/50 p-3 text-white">
                {bannerTitle && <p className="text-sm font-semibold">{bannerTitle}</p>}
                {bannerSubtitle && <p className="text-xs text-white/90">{bannerSubtitle}</p>}
              </div>
            )}
          </a>
        ) : (
          <div className="grid h-[200px] grid-cols-3 gap-2 p-2 sm:h-[260px] md:h-[320px] md:p-3">
            <div className="iteme-hero-tile iteme-hero-left" />
            <div className="iteme-hero-tile iteme-hero-center" />
            <div className="iteme-hero-tile iteme-hero-right" />
          </div>
        )}
      </div>

      <div className="sticky top-[64px] z-20 space-y-2 bg-[#efefef]/95 py-1 backdrop-blur-md md:top-[74px]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            className="inline-flex items-center rounded-sm border border-black/15 bg-[#e8e8e8] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#dddddd]"
          >
            Фильтры &gt;
          </button>

          <button
            type="button"
            onClick={() => setIsPersonalized((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-sm px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.11em] transition ${
              isPersonalized ? 'bg-black text-white' : 'border border-black/20 bg-[#ececec] text-black'
            }`}
          >
            Персонализация
            <span>{isPersonalized ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {isFiltersOpen && (
          <div className="space-y-3 rounded-sm border border-black/10 bg-[#f7f7f7] p-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию товара"
              className="w-full rounded-sm border border-black/20 bg-white px-3 py-2 text-sm text-black placeholder:text-[#999] outline-none transition focus:border-black"
            />

            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#646464]">Бренд</p>
              <select
                value={selectedBrand}
                onChange={(event) => setSelectedBrand(event.target.value)}
                className="w-full rounded-sm border border-black/20 bg-white px-3 py-2 text-sm text-black"
              >
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand === 'all' ? 'Все бренды' : brand}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#646464]">Размер</p>
              <select
                value={selectedSize}
                onChange={(event) => setSelectedSize(event.target.value)}
                className="w-full rounded-sm border border-black/20 bg-white px-3 py-2 text-sm text-black"
              >
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size === 'all' ? 'Все размеры' : size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <article key={index} className="overflow-hidden rounded-sm border border-black/10 bg-[#fafafa]">
              <div className="skeleton-shimmer h-40 w-full bg-[#dcdcdc] sm:h-48" />
              <div className="space-y-2 p-3">
                <div className="skeleton-shimmer h-3.5 w-4/5 rounded bg-[#dcdcdc]" />
                <div className="skeleton-shimmer h-3.5 w-3/5 rounded bg-[#dcdcdc]" />
                <div className="skeleton-shimmer h-5 w-2/5 rounded bg-[#dcdcdc]" />
              </div>
            </article>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Пока объявлений нет. Загляни позже.
        </div>
      )}

      {!isLoading && !error && items.length > 0 && filteredItems.length === 0 && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          По выбранным фильтрам ничего не найдено.
        </div>
      )}

      {!isLoading && !error && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="listing-enter"
              style={{ animationDelay: `${Math.min(index * 70, 560)}ms` }}
            >
              <ProductCard listing={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
