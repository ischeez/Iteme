import { AxiosError } from 'axios'
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccessControl } from '../hooks/useAccessControl'
import { BRAND_OPTIONS, SIZE_OPTIONS } from '../lib/catalog'
import { api } from '../lib/api'

const initialForm = {
  name: '',
  description: '',
  brand: 'Другое',
  size: '',
  sellerContact: '',
  quantity: '1',
  price: '',
  categoryId: '',
}

interface CategoryOption {
  id: number
  name: string
}

interface UploadImageResponse {
  filename: string
  url: string
}

export default function CreateListing() {
  const { hasListingAccess, isLoading: isSubscriptionLoading } = useAccessControl()
  const [form, setForm] = useState(initialForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchCategories = async () => {
      try {
        setIsCategoriesLoading(true)
        setCategoriesError(null)
        const response = await api.get<CategoryOption[]>('/categories', {
          signal: controller.signal,
        })

        const payload = Array.isArray(response.data) ? response.data : []
        setCategories(payload)

        if (payload.length) {
          setForm((prev) => ({
            ...prev,
            categoryId: prev.categoryId || String(payload[0].id),
          }))
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        setCategories([])
        const axiosError = err as AxiosError<{ message?: string }>
        setCategoriesError(
          axiosError.response?.data?.message ?? 'Не удалось загрузить категории. Проверь подключение к API.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsCategoriesLoading(false)
        }
      }
    }

    void fetchCategories()

    return () => controller.abort()
  }, [])

  const onChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!hasListingAccess) {
      setError('Функция доступна с подпиской или после верификации продавца')
      return
    }

    if (!form.name.trim() || !form.description.trim() || !form.price || !form.categoryId) {
      setError('Заполни все поля перед публикацией')
      return
    }

    const price = Number(form.price)
    const quantity = Number(form.quantity)
    const categoryId = Number(form.categoryId)

    if (Number.isNaN(price) || price <= 0) {
      setError('Цена должна быть числом больше 0')
      return
    }

    if (Number.isNaN(quantity) || quantity < 0) {
      setError('Количество должно быть 0 или больше')
      return
    }

    if (Number.isNaN(categoryId) || categoryId <= 0) {
      setError('Выбери категорию')
      return
    }

    try {
      setIsSubmitting(true)

      let imageUrl: string | undefined

      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)

        const uploadResponse = await api.post<UploadImageResponse>('/uploads/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        imageUrl = uploadResponse.data.url
      }

      await api.post('/products', {
        name: form.name.trim(),
        description: form.description.trim(),
        brand: form.brand,
        size: form.size || undefined,
        sellerContact: form.sellerContact.trim() || undefined,
        quantity,
        price,
        categoryId,
        imageUrl,
      })

      setForm(initialForm)
      setImageFile(null)
      setPreviewUrl(null)
      setSuccess('Товар успешно создан')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось создать товар')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-4">
      <header className="glass-card rounded-3xl p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Product Form</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Новый товар</h1>
      </header>

      <form
        onSubmit={onSubmit}
        className="glass-card space-y-4 rounded-2xl p-4"
      >
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Название товара</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Например, Jeans"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Описание</span>
          <textarea
            rows={4}
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Состояние, особенности, комплект"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Количество</span>
          <input
            type="number"
            min={0}
            name="quantity"
            value={form.quantity}
            onChange={onChange}
            placeholder="1"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Цена, ₽</span>
          <input
            type="number"
            min={1}
            name="price"
            value={form.price}
            onChange={onChange}
            placeholder="10000"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Категория</span>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={onChange}
            disabled={isCategoriesLoading || categories.length === 0}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 disabled:opacity-60"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="bg-white text-slate-900">
                {category.name}
              </option>
            ))}
          </select>
          {isCategoriesLoading && <p className="text-xs text-slate-500">Загружаем категории...</p>}
          {!isCategoriesLoading && categoriesError && (
            <p className="text-xs text-rose-700">{categoriesError}</p>
          )}
          {!isCategoriesLoading && !categoriesError && categories.length === 0 && (
            <p className="text-xs text-amber-700">Нет категорий. Создай категорию на backend.</p>
          )}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Бренд</span>
            <select
              name="brand"
              value={form.brand}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            >
              {BRAND_OPTIONS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Размер (необязательно)</span>
            <select
              name="size"
              value={form.size}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            >
              <option value="">Не указывать</option>
              {SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Контакт продавца / Telegram (необязательно)</span>
          <input
            type="text"
            name="sellerContact"
            value={form.sellerContact}
            onChange={onChange}
            placeholder="Можно оставить пустым: Telegram подставится автоматически"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Фото товара</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setImageFile(file)

              if (file) {
                const localPreview = URL.createObjectURL(file)
                setPreviewUrl(localPreview)
              } else {
                setPreviewUrl(null)
              }
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
          />

          {previewUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img src={previewUrl} alt="Предпросмотр" className="h-48 w-full object-cover" />
            </div>
          )}
        </label>

        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

        {!isSubscriptionLoading && !hasListingAccess && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Функция доступна с подпиской или после верификации продавца.{' '}
            <Link to="/cart" className="font-semibold underline">
              Перейти к оплате
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isSubscriptionLoading || !hasListingAccess}
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? 'Публикация...' : 'Опубликовать'}
        </button>
      </form>
    </section>
  )
}
