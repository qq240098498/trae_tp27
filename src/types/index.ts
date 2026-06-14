export interface PasswordHistoryEntry {
  passwordHash: string
  changedAt: number
}

export interface PasswordEntry {
  id: string
  title: string
  category: CategoryType
  username: string
  password: string
  url?: string
  notes?: string
  createdAt: number
  updatedAt: number
  passwordHistory: PasswordHistoryEntry[]
  expiryDays: number
  lastPasswordChangeAt: number
}

export type CategoryType = 'social' | 'finance' | 'work' | 'home' | 'other'

export interface CategoryInfo {
  id: CategoryType
  name: string
  icon: string
  color: string
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'social', name: '社交', icon: 'message-circle', color: '#3b82f6' },
  { id: 'finance', name: '金融', icon: 'credit-card', color: '#10b981' },
  { id: 'work', name: '工作', icon: 'briefcase', color: '#f59e0b' },
  { id: 'home', name: '家庭', icon: 'home', color: '#8b5cf6' },
  { id: 'other', name: '其他', icon: 'folder', color: '#6b7280' }
]

export interface AppState {
  isInitialized: boolean
  isUnlocked: boolean
  entries: PasswordEntry[]
  settings: AppSettings
}

export interface AppSettings {
  defaultExpiryDays: number
  expiryReminderDays: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultExpiryDays: 90,
  expiryReminderDays: 7
}

export const EXPIRY_OPTIONS = [
  { value: 0, label: '永不过期' },
  { value: 30, label: '每 30 天' },
  { value: 60, label: '每 60 天' },
  { value: 90, label: '每 90 天' },
  { value: 180, label: '每 180 天' },
  { value: 365, label: '每 365 天' }
]

export interface EncryptedData {
  iv: string
  salt: string
  data: string
  version: number
}
