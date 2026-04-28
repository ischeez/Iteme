import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyCart, removeProductFromCart, type CartItem } from '../api/products'
import { useAuthStore } from '../store/useAuthStore'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price)

export default function Cart() {
  const role = useAuthStore((state) => state.role)
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRemovingProductId, setIsRemovingProductId] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      if (role !== 'BUYER') {
        setItems([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await getMyCart()

        if (!controller.signal.aborted) {
          setItems(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить корзину')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => controller.abort()
  }, [role])

  const handleRemove = async (productId: number) => {
    try {
      setError(null)
      setIsRemovingProductId(productId)
      await removeProductFromCart(productId)
      setItems((prev) => prev.filter((item) => item.productId !== productId))
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось удалить товар из корзины')
    } finally {
      setIsRemovingProductId(null)
    }
  }

  return (
    <section className="space-y-4 md:space-y-5">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Cart</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Корзина</h1>
      </header>

      {role !== 'BUYER' && (
        <div className="rounded-sm border border-black/10 bg-white p-4 text-sm text-[#4b4b4b]">
          Раздел корзины доступен только для покупателя (BUYER).
        </div>
      )}

      {error && <div className="rounded-sm border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {role === 'BUYER' && isLoading && (
        <div className="rounded-sm border border-black/10 bg-white p-4 text-sm text-[#4b4b4b]">
          Загружаем корзину...
        </div>
      )}

      {role === 'BUYER' && !isLoading && items.length === 0 && (
        <div className="rounded-sm border border-black/10 bg-white p-4 text-sm text-[#4b4b4b]">
          Корзина пуста. Добавь товары из ленты.
        </div>
      )}

      {role === 'BUYER' && !isLoading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-sm border border-black/10 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-black">{item.product.name}</h2>
                  <p className="mt-1 text-xs text-[#666]">{formatPrice(item.product.price)}</p>
                  {item.status === 'UNAVAILABLE' && (
                    <p className="mt-2 text-xs text-rose-700">
                      Товар уже недоступен или продан. Удали его из корзины.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  {item.status === 'ACTIVE' && (
                    <Link
                      to={`/listing/${item.productId}`}
                      className="rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    >
                      К товару
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleRemove(item.productId)}
                    disabled={isRemovingProductId === item.productId}
                    className="rounded-sm border border-rose-300 bg-rose-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRemovingProductId === item.productId ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
