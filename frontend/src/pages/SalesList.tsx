import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { getMySales, type OrderItem } from '../api/orders'
import { useAuthStore } from '../store/useAuthStore'

const getOrderTitle = (order: OrderItem) => order.listing?.title ?? order.listing?.name ?? `Лот #${order.listingId ?? '-'}`

const getOrderPrice = (order: OrderItem) => {
  if (typeof order.listing?.price !== 'number') {
    return null
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(order.listing.price)
}

export default function SalesList() {
  const role = useAuthStore((state) => state.role)
  const [sales, setSales] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchSales = async () => {
      if (role !== 'SELLER') {
        setSales([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await getMySales()
        if (!controller.signal.aborted) {
          setSales(Array.isArray(response) ? response : [])
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить список продаж')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchSales()

    return () => controller.abort()
  }, [role])

  return (
    <section className="space-y-4 md:space-y-5">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Sales</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Мои продажи</h1>
      </header>

      {role !== 'SELLER' && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Эта страница доступна только продавцам.
        </div>
      )}

      {role === 'SELLER' && isLoading && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Загружаем продажи...
        </div>
      )}

      {role === 'SELLER' && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {role === 'SELLER' && !isLoading && !error && sales.length === 0 && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          У тебя пока нет продаж.
        </div>
      )}

      {role === 'SELLER' && !isLoading && !error && sales.length > 0 && (
        <div className="space-y-2">
          {sales.map((order) => (
            <article key={order.id} className="rounded-sm border border-black/10 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
                Продажа #{order.id}
              </p>
              <h2 className="mt-1 text-base font-semibold text-black">{getOrderTitle(order)}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#5f5f5f]">
                <span className="rounded-sm border border-black/10 bg-[#f8f8f8] px-2 py-1">
                  Статус: {order.status ?? 'pending'}
                </span>
                {getOrderPrice(order) && (
                  <span className="rounded-sm border border-black/10 bg-[#f8f8f8] px-2 py-1">
                    Сумма: {getOrderPrice(order)}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
