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
}

export interface EncryptedData {
  iv: string
  salt: string
  data: string
  version: number
}
