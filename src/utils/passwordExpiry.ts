import { PasswordEntry, PasswordHistoryEntry } from '../types'
import { hashPassword } from './crypto'

export const DAY_IN_MS = 24 * 60 * 60 * 1000

export function getDaysUntilExpiry(entry: PasswordEntry): number | null {
  if (entry.expiryDays <= 0) return null
  
  const expiryTime = entry.lastPasswordChangeAt + entry.expiryDays * DAY_IN_MS
  const now = Date.now()
  const daysLeft = Math.ceil((expiryTime - now) / DAY_IN_MS)
  
  return daysLeft
}

export function isExpired(entry: PasswordEntry): boolean {
  const daysLeft = getDaysUntilExpiry(entry)
  return daysLeft !== null && daysLeft <= 0
}

export function isExpiringSoon(entry: PasswordEntry, reminderDays: number): boolean {
  const daysLeft = getDaysUntilExpiry(entry)
  return daysLeft !== null && daysLeft > 0 && daysLeft <= reminderDays
}

export function getExpiryStatus(entry: PasswordEntry, reminderDays: number): 'expired' | 'expiring-soon' | 'normal' | 'never' {
  if (entry.expiryDays <= 0) return 'never'
  
  const daysLeft = getDaysUntilExpiry(entry)
  
  if (daysLeft === null) return 'never'
  if (daysLeft <= 0) return 'expired'
  if (daysLeft <= reminderDays) return 'expiring-soon'
  return 'normal'
}

export function formatExpiryDate(entry: PasswordEntry): string {
  if (entry.expiryDays <= 0) return '永不过期'
  
  const expiryTime = entry.lastPasswordChangeAt + entry.expiryDays * DAY_IN_MS
  const date = new Date(expiryTime)
  return date.toLocaleDateString('zh-CN')
}

export async function isPasswordInHistory(
  password: string,
  history: PasswordHistoryEntry[]
): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return history.some(h => h.passwordHash === passwordHash)
}

export async function isPasswordInLastN(
  password: string,
  history: PasswordHistoryEntry[],
  n: number
): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  const recentHistory = history.slice(-n)
  return recentHistory.some(h => h.passwordHash === passwordHash)
}

export async function addPasswordToHistory(
  password: string,
  history: PasswordHistoryEntry[],
  maxHistory: number = 10
): Promise<PasswordHistoryEntry[]> {
  const passwordHash = await hashPassword(password)
  const newEntry: PasswordHistoryEntry = {
    passwordHash,
    changedAt: Date.now()
  }
  
  const newHistory = [...history, newEntry]
  
  if (newHistory.length > maxHistory) {
    return newHistory.slice(newHistory.length - maxHistory)
  }
  
  return newHistory
}

export function formatLastChangedDate(entry: PasswordEntry): string {
  const date = new Date(entry.lastPasswordChangeAt)
  return date.toLocaleDateString('zh-CN')
}
