import { AxiosError } from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import {
  deleteProduct,
  getCartBuyersForProduct,
  getMyProducts,
  markProductAsSold,
  updateProduct,
  type CartBuyer,
  type ProductItem,
} from '../api/products'
import { getSellerReviews, getSellerStore, type SellerReviewItem } from '../api/sellers'
import { resolveMediaUrl } from '../lib/media'
import { useAuthStore } from '../store/useAuthStore'

export default function MyListings() {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const sellerId = currentUserId ? String(currentUserId) : null

  const [items, setItems] = useState<ProductItem[]>([])
  const [reviews, setReviews] = useState<SellerReviewItem[]>([])
  const [reviewsCount, setReviewsCount] = useState(0)
  const [rating, setRating] = useState<number | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [brand, setBrand] = useState('')
  const [size, setSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('M')
  const [sellerContact, setSellerContact] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cartBuyersByProduct, setCartBuyersByProduct] = useState<Record<number, CartBuyer[]>>({})
  const [isLoadingBuyersForProductId, setIsLoadingBuyersForProductId] = useState<number | null>(null)
  const [selectedBuyerByProduct, setSelectedBuyerByProduct] = useState<Record<number, string>>({})
  const [isMarkingSoldProductId, setIsMarkingSoldProductId] = useState<number | null>(null)

  const load = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const productsPromise = getMyProducts()
      const reviewsPromises = sellerId
        ? Promise.all([getSellerStore(sellerId), getSellerReviews(sellerId)])
        : Promise.resolve<[null, SellerReviewItem[]]>([null, []])

      const [data, [storeData, reviewsData]] = await Promise.all([productsPromise, reviewsPromises])
      setItems(data)
      setReviews(reviewsData)
      setSuccess(null)

      if (storeData) {
        setReviewsCount(storeData.reviewsCount)
        setRating(storeData.rating)
      } else {
        setReviewsCount(0)
        setRating(null)
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось загрузить объявления')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [sellerId])

  const startEdit = (item: ProductItem) => {
    setEditingId(item.id)
    setName(item.name)
    setDescription(item.description ?? '')
    setBrand(item.brand ?? '')
    setSize(item.size ?? 'M')
    setSellerContact(item.sellerContact ?? '')
    setPrice(String(item.price))
    setQuantity(String(item.quantity))
  }

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editingId) {
      return
    }

    try {
      setError(null)
      const updated = await updateProduct(editingId, {
        name: name.trim(),
        description: description.trim(),
        brand: brand.trim(),
        size,
        sellerContact: sellerContact.trim(),
        price: Number(price),
        quantity: Number(quantity),
      })
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setEditingId(null)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось обновить объявление')
    }
  }

  const remove = async (id: number) => {
    try {
      setError(null)
      await deleteProduct(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось удалить объявление')
    }
  }

  const toggleSoldControls = async (productId: number) => {
    if (cartBuyersByProduct[productId]) {
      setCartBuyersByProduct((prev) => {
        const copy = { ...prev }
        delete copy[productId]
        return copy
      })
      return
    }

    try {
      setError(null)
      setIsLoadingBuyersForProductId(productId)
      const buyers = await getCartBuyersForProduct(productId)
      setCartBuyersByProduct((prev) => ({ ...prev, [productId]: buyers }))

      if (buyers.length > 0) {
        setSelectedBuyerByProduct((prev) => ({
          ...prev,
          [productId]: prev[productId] ?? buyers[0].userId,
        }))
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось загрузить покупателей из корзины')
    } finally {
      setIsLoadingBuyersForProductId(null)
    }
  }

  const markSold = async (productId: number) => {
    const buyerId = selectedBuyerByProduct[productId]
    if (!buyerId) {
      setError('Выбери покупателя, которому продаешь товар')
      return
    }

    try {
      setError(null)
      setSuccess(null)
      setIsMarkingSoldProductId(productId)
      await markProductAsSold(productId, buyerId)
      setItems((prev) => prev.filter((item) => item.id !== productId))
      setSuccess('Товар помечен как проданный и перенесен в историю продаж')
      setCartBuyersByProduct((prev) => {
        const copy = { ...prev }
        delete copy[productId]
        return copy
      })
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось пометить товар как проданный')
    } finally {
      setIsMarkingSoldProductId(null)
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Seller</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Мои объявления</h1>
      </header>

      <section className="rounded-sm border border-black/10 bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666]">Отзывы о продавце</p>
        <p className="mt-1 text-sm text-black">
          Рейтинг: {rating ? rating.toFixed(1) : '—'} · Всего отзывов: {reviewsCount}
        </p>
        <div className="mt-2 space-y-2">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-sm border border-black/10 bg-[#fafafa] p-2.5">
              <p className="text-xs font-semibold text-black">{review.rating}/5</p>
              {review.comment && <p className="mt-1 text-xs text-[#444]">{review.comment}</p>}
              <p className="mt-1 text-[11px] text-[#666]">
                От: {review.buyer?.username ? `@${review.buyer.username}` : review.buyer?.firstName ?? 'Покупатель'}
                {review.product?.name ? ` · По объявлению: ${review.product.name}` : ''}
              </p>
            </article>
          ))}
          {reviews.length === 0 && <p className="text-xs text-[#666]">Пока отзывов нет.</p>}
        </div>
      </section>

      {success && <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}
      {error && <div className="rounded-sm border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {isLoading && <div className="rounded-sm border border-black/10 bg-white p-3 text-sm text-[#555]">Загрузка...</div>}

      {!isLoading && (
        <div className="space-y-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-sm border border-black/10 bg-white p-3">
              {editingId === item.id ? (
                <form onSubmit={saveEdit} className="space-y-2">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Название"
                    className="w-full rounded-sm border border-black/20 px-2 py-2 text-sm"
                  />
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder="Описание"
                    className="w-full rounded-sm border border-black/20 px-2 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={brand}
                      onChange={(event) => setBrand(event.target.value)}
                      placeholder="Бренд"
                      className="w-full rounded-sm border border-black/20 px-2 py-2 text-sm"
                    />
                    <select
                      value={size}
                      onChange={(event) => setSize(event.target.value as 'S' | 'M' | 'L' | 'XL' | 'XXL')}
                      className="w-full rounded-sm border border-black/20 px-2 py-2 text-sm"
                    >
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                    <input
                      value={sellerContact}
                      onChange={(event) => setSellerContact(event.target.value)}
                      placeholder="Контакт продавца"
                      className="col-span-2 w-full rounded-sm border border-black/20 px-2 py-2 text-sm"
                    />
                    <input
                      type="number"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="Цена"
                      className="w-full rounded-sm border border-black/20 px-2 py-2 text-sm"
                    />
                    <input
                      type="number"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      placeholder="Остаток"
                      className="w-full rounded-sm border border-black/20 px-2 py-2 text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="rounded-sm border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                      Сохранить
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-sm border border-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]">
                      Отмена
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-black/10 bg-[#efefef]">
                        {resolveMediaUrl(item.imageUrl) ? (
                          <img src={resolveMediaUrl(item.imageUrl)} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-[#777]">Нет фото</div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-black break-words">{item.name}</p>
                        {item.brand && <p className="mt-1 text-xs text-[#555]">Бренд: {item.brand}</p>}
                        {item.size && <p className="text-xs text-[#555]">Размер: {item.size}</p>}
                        <p className="mt-1 text-xs text-[#666]">{item.price} ₽ · Остаток: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => void toggleSoldControls(item.id)}
                        disabled={isLoadingBuyersForProductId === item.id || isMarkingSoldProductId === item.id}
                        className="rounded-sm border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoadingBuyersForProductId === item.id ? 'Загрузка...' : 'Товар продан'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-sm border border-black/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]"
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(item.id)}
                        className="rounded-sm border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  {cartBuyersByProduct[item.id] && (
                    <div className="mt-3 rounded-sm border border-black/10 bg-[#fafafa] p-3">
                      {cartBuyersByProduct[item.id].length > 0 ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            value={selectedBuyerByProduct[item.id] ?? ''}
                            onChange={(event) =>
                              setSelectedBuyerByProduct((prev) => ({
                                ...prev,
                                [item.id]: event.target.value,
                              }))
                            }
                            className="w-full rounded-sm border border-black/20 bg-white px-2 py-2 text-sm sm:max-w-[260px]"
                          >
                            {cartBuyersByProduct[item.id].map((buyer) => (
                              <option key={buyer.userId} value={buyer.userId}>
                                {buyer.username ? `@${buyer.username}` : buyer.firstName || buyer.userId}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void markSold(item.id)}
                            disabled={isMarkingSoldProductId === item.id}
                            className="rounded-sm border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isMarkingSoldProductId === item.id ? 'Сохраняем...' : 'Подтвердить продажу'}
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-[#666]">
                          Никто не добавил этот товар в корзину. Для безопасной фиксации продажи сначала дождись добавления в корзину покупателем.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </article>
          ))}

          {items.length === 0 && <div className="rounded-sm border border-black/10 bg-white p-3 text-sm text-[#666]">У тебя пока нет объявлений.</div>}
        </div>
      )}
    </section>
  )
}
