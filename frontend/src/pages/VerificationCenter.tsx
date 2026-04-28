import { AxiosError } from 'axios'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  getMyVerificationRequests,
  submitVerificationRequest,
  type VerificationRequestItem,
} from '../api/verification'
import { api } from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'

const statusLabel: Record<VerificationRequestItem['status'], string> = {
  PENDING: 'Ожидание',
  APPROVED: 'Одобрено',
  REJECTED: 'Отклонено',
}

export default function VerificationCenter() {
  const role = useAuthStore((state) => state.role)
  const isVerified = useAuthStore((state) => state.user?.isVerified)

  const [details, setDetails] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [items, setItems] = useState<VerificationRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const latestRequest = useMemo(() => items[0] ?? null, [items])

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await getMyVerificationRequests()
        if (!controller.signal.aborted) {
          setItems(response)
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить данные верификации')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!details.trim()) {
      setError('Опиши данные для проверки профиля')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)

      const evidenceImages: string[] = []

      if (evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          const formData = new FormData()
          formData.append('file', file)

          const uploadResponse = await api.post<{ filename: string; url: string }>(
            '/uploads/image',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            },
          )

          evidenceImages.push(uploadResponse.data.url)
        }
      }

      const request = await submitVerificationRequest(details.trim(), evidenceImages)
      setItems((prev) => [request, ...prev])
      setDetails('')
      setEvidenceFiles([])
      setPreviewUrls([])
      setSuccess('Заявка отправлена на проверку')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось отправить заявку')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-4 md:space-y-5">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Verification</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Центр верификации</h1>
      </header>

      {role !== 'SELLER' && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Заявку на верификацию может подать только продавец (SELLER).
        </div>
      )}

      <div className="rounded-sm border border-black/10 bg-white p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">Текущий статус</p>
        {isLoading ? (
          <p className="mt-2 text-sm text-[#5b5b5b]">Загружаем статус...</p>
        ) : isVerified ? (
          <p className="mt-2 text-sm font-semibold text-emerald-700">Одобрено: верификация активна</p>
        ) : latestRequest ? (
          <div className="mt-2 space-y-1">
            <p className="text-sm font-semibold text-black">{statusLabel[latestRequest.status]}</p>
            {latestRequest.status === 'REJECTED' && latestRequest.adminComment && (
              <p className="text-xs text-rose-700">Причина: {latestRequest.adminComment}</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#5b5b5b]">Заявок пока нет.</p>
        )}
      </div>

      {role === 'SELLER' && (
        <form onSubmit={onSubmit} className="rounded-sm border border-black/10 bg-white p-4 md:p-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#2f2f2f]">Данные для проверки</span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={5}
              placeholder="Расскажи о магазине, укажи ссылки на соцсети/портфолио и любую полезную информацию для модерации"
              className="w-full resize-y rounded-sm border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-black"
            />
          </label>

          <label className="mt-3 block space-y-2">
            <span className="text-sm font-medium text-[#2f2f2f]">Фото для проверки (до 8)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                setError(null)
                const files = Array.from(event.target.files ?? [])
                const limitedFiles = files.slice(0, 8)

                setEvidenceFiles(limitedFiles)
                setPreviewUrls(limitedFiles.map((file) => URL.createObjectURL(file)))

                if (files.length > 8) {
                  setError('Можно выбрать не больше 8 изображений')
                }
              }}
              className="w-full rounded-sm border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-black"
            />

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {previewUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="overflow-hidden rounded-sm border border-black/10 bg-[#f4f4f4]">
                    <img src={url} alt={`Превью ${index + 1}`} className="h-20 w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {latestRequest?.evidenceImages?.length ? (
              <div className="space-y-1">
                <p className="text-xs text-[#666]">В последней заявке прикреплено: {latestRequest.evidenceImages.length} фото</p>
              </div>
            ) : null}
          </label>

          {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
          {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-sm border border-black bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Отправляем...' : 'Подать заявку'}
          </button>
        </form>
      )}
    </section>
  )
}
