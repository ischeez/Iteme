import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addProductToCart, createBuyIntent, getProductById, type ProductItem } from '../api/products'
import { BuySafetyModal } from '../components/BuySafetyModal'
import { resolveMediaUrl } from '../lib/media'
import { openTelegramChat } from '../lib/telegram'
import { useAuthStore } from '../store/useAuthStore'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price)

export default function ListingDetails() {
  const { id } = useParams<{ id: string }>()
  const role = useAuthStore((state) => state.role)
  const userId = useAuthStore((state) => state.user?.id)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [item, setItem] = useState<ProductItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBuying, setIsBuying] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [cartMessage, setCartMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Объявление не найдено')
      setIsLoading(false)
      return
    }

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getProductById(id)
        setItem(data)
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить объявление')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [id])

  if (isLoading) {
    return <div className="rounded-sm border border-black/10 bg-white p-4 text-sm text-[#4b4b4b]">Загрузка...</div>
  }

  if (error || !item) {
    return <div className="rounded-sm border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error ?? 'Не найдено'}</div>
  }

  const isOwnListing = Boolean(userId && item.sellerId && String(userId) === String(item.sellerId))

  const handleBuy = () => {
    if (!isAuthenticated) {
      setChatError('Чтобы купить товар, сначала авторизуйтесь через Telegram')
      return
    }

    if (role !== 'BUYER') {
      setChatError('Для покупки переключитесь в роль BUYER в профиле')
      return
    }

    if (isOwnListing) {
      setChatError('Нельзя купить собственное объявление')
      return
    }

    if (item.quantity <= 0) {
      setChatError('Товар распродан и недоступен для покупки')
      return
    }

    setChatError(null)
    setIsWarningOpen(true)
  }

  const handleConfirmBuy = async () => {
    if (isBuying) {
      return
    }

    try {
      setIsBuying(true)
      const data = await createBuyIntent(item.id)

      if (!data.hasContact || !data.chatUrl) {
        setChatError('У продавца не указан контакт для связи')
        return
      }

      setIsWarningOpen(false)
      openTelegramChat(data.chatUrl)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      const message =
        axiosError.response?.data?.message ?? 'Не удалось перейти к продавцу'
      setChatError(message)
    } finally {
      setIsBuying(false)
    }
  }

  const handleAddToCart = async () => {
    if (isAddingToCart || isInCart) {
      if (isInCart) {
        setCartMessage('Товар уже в корзине')
      }
      return
    }

    if (!isAuthenticated) {
      setCartMessage('Чтобы добавить товар в корзину, авторизуйтесь через Telegram')
      return
    }

    if (role !== 'BUYER') {
      setCartMessage('Чтобы добавить товар в корзину, переключитесь в роль BUYER')
      return
    }

    if (isOwnListing) {
      setCartMessage('Нельзя добавить в корзину собственный товар')
      return
    }

    if (item.quantity <= 0) {
      setCartMessage('Товар распродан и не может быть добавлен в корзину')
      return
    }

    try {
      setIsAddingToCart(true)
      setCartMessage(null)
      await addProductToCart(item.id)
      setIsInCart(true)
      setCartMessage('Товар добавлен в корзину')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setCartMessage(axiosError.response?.data?.message ?? 'Не удалось добавить товар в корзину')
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <section className="space-y-4 md:space-y-5">
      <header className="rounded-2xl border border-black/10 bg-gradient-to-r from-[#f9f6ef] to-[#efe7d6] p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6a6256]">Listing Details</p>
        <h1 className="mt-1 text-2xl font-semibold text-black md:text-[30px]">{item.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#5d5548]">
          Полная карточка товара с быстрым доступом к покупке через гаранта и переходом к продавцу.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        {resolveMediaUrl(item.imageUrl) ? (
          <img src={resolveMediaUrl(item.imageUrl)} alt={item.name} className="h-72 w-full object-cover md:h-[420px]" />
        ) : (
          <div className="flex h-72 items-center justify-center bg-[#ececec] text-sm text-[#666] md:h-[420px]">Нет фото</div>
        )}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 md:p-5">
        <div className="grid gap-3 text-sm text-[#333] md:grid-cols-2">
          <div className="rounded-xl border border-black/10 bg-[#f8f6f0] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#746c5c]">Цена</p>
            <p className="mt-2 text-2xl font-bold text-black">{formatPrice(item.price)}</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-[#f8f6f0] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#746c5c]">В наличии</p>
            <p className="mt-2 text-2xl font-bold text-black">{item.quantity}</p>
          </div>
          <div>
            Бренд: <span className="font-semibold text-black">{item.brand}</span>
          </div>
          <div>
            Размер: <span className="font-semibold text-black">{item.size}</span>
          </div>
          <div>
            Категория: <span className="font-semibold text-black">{item.category?.name ?? 'Без категории'}</span>
          </div>
          <div>
            Продавец:{' '}
            <span className="font-semibold text-black">
              {item.seller?.username ? `@${item.seller.username}` : item.seller?.firstName ?? 'Продавец'}
            </span>
          </div>
        </div>

        {item.description && (
          <div className="mt-4 rounded-xl border border-black/10 bg-[#fbfbfb] p-3 text-sm text-[#444]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#746c5c]">Описание</p>
            <p className="mt-2 whitespace-pre-line">{item.description}</p>
          </div>
        )}

        <p className="mt-4 text-sm text-[#5f5f5f]">Связь с продавцом доступна через кнопку «Купить» после подтверждения уведомления о гаранте.</p>

        <div className="mt-4 space-y-2 rounded-2xl border border-black/10 bg-[#f8f7f3] p-3">
          <button
            type="button"
            onClick={() => void handleAddToCart()}
            disabled={isAddingToCart || item.quantity === 0 || isOwnListing || isInCart}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-black/20 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAddingToCart ? 'Добавляем...' : isInCart ? 'Уже в корзине' : 'Добавить в корзину'}
          </button>
          <button
            type="button"
            onClick={handleBuy}
            disabled={isBuying}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-black bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#1d1d1d] disabled:cursor-not-allowed disabled:bg-[#7f7f7f]"
          >
            Купить
          </button>

          <Link
            to="/feed"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-black/20 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#f0f0f0]"
          >
            Вернуться к объявлениям
          </Link>

          {item.seller?.id && (
            <Link
              to={`/seller/${item.seller.id}`}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-black/20 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#f0f0f0]"
            >
              Перейти в магазин продавца
            </Link>
          )}
        </div>
      </div>

      {chatError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{chatError}</div>}
      {cartMessage && <div className="rounded-2xl border border-black/10 bg-white p-3 text-sm text-[#555]">{cartMessage}</div>}

      <BuySafetyModal
        isOpen={isWarningOpen}
        isSubmitting={isBuying}
        listingTitle={item.name}
        error={chatError}
        onConfirm={() => void handleConfirmBuy()}
        onClose={() => {
          setIsWarningOpen(false)
        }}
      />
    </section>
  )
}
