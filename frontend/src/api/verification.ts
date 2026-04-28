import { api } from '../lib/api'

export type VerificationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface VerificationRequestItem {
  id: string
  userId: string
  status: VerificationRequestStatus
  details: string
  evidenceImages?: string[]
  adminComment?: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    telegramId?: string
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    role?: 'BUYER' | 'SELLER' | 'ADMIN'
    isVerified?: boolean
  }
}

export async function submitVerificationRequest(details: string, evidenceImages?: string[]) {
  const { data } = await api.post<VerificationRequestItem>('/verification/requests', {
    details,
    evidenceImages,
  })

  return data
}

export async function getMyVerificationRequests() {
  const { data } = await api.get<VerificationRequestItem[]>('/verification/requests/me')
  return Array.isArray(data) ? data : []
}

export async function getVerificationRequestsForAdmin(status?: VerificationRequestStatus) {
  const { data } = await api.get<VerificationRequestItem[]>('/verification/requests', {
    params: status ? { status } : undefined,
  })

  return Array.isArray(data) ? data : []
}

export async function getPendingVerificationRequestsCount() {
  const { data } = await api.get<{ pending?: number }>('/verification/requests/pending-count')
  return typeof data?.pending === 'number' ? data.pending : 0
}

export async function processVerificationRequest(
  requestId: string,
  payload: { status: Extract<VerificationRequestStatus, 'APPROVED' | 'REJECTED'>; adminComment?: string },
) {
  const { data } = await api.patch<VerificationRequestItem>(`/verification/requests/${requestId}/process`, payload)
  return data
}

export async function deleteVerificationRequest(requestId: string) {
  const { data } = await api.delete<{ success: boolean }>(`/verification/requests/${requestId}`)
  return data
}
