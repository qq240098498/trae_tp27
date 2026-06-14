import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { PasswordEntry, AppSettings, DEFAULT_SETTINGS } from '../types'
import { encryptData, decryptData, generateId, hashPassword } from '../utils/crypto'
import { saveEncryptedData, getEncryptedData, hasStoredData } from '../utils/storage'
import { addPasswordToHistory, isPasswordInLastN } from '../utils/passwordExpiry'

function migrateEntry(entry: Partial<PasswordEntry>, now: number, defaultExpiryDays: number): PasswordEntry {
  return {
    id: entry.id || generateId(),
    title: entry.title || '',
    category: entry.category || 'other',
    username: entry.username || '',
    password: entry.password || '',
    url: entry.url,
    notes: entry.notes,
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || now,
    passwordHistory: entry.passwordHistory || [],
    expiryDays: entry.expiryDays !== undefined ? entry.expiryDays : defaultExpiryDays,
    lastPasswordChangeAt: entry.lastPasswordChangeAt || entry.createdAt || now
  }
}

async function migrateEntries(entries: Partial<PasswordEntry>[], defaultExpiryDays: number): Promise<PasswordEntry[]> {
  const now = Date.now()
  const migrated: PasswordEntry[] = []
  for (const entry of entries) {
    const migratedEntry = migrateEntry(entry, now, defaultExpiryDays)
    if (migratedEntry.passwordHistory.length === 0 && migratedEntry.password) {
      migratedEntry.passwordHistory = await addPasswordToHistory(migratedEntry.password, [])
    }
    migrated.push(migratedEntry)
  }
  return migrated
}

interface AppContextType {
  isInitialized: boolean
  isUnlocked: boolean
  entries: PasswordEntry[]
  settings: AppSettings
  checkInitialized: () => Promise<boolean>
  setMasterPassword: (password: string) => Promise<void>
  unlock: (password: string) => Promise<void>
  lock: () => void
  addEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt' | 'passwordHistory' | 'lastPasswordChangeAt' | 'expiryDays'> & { expiryDays?: number }) => Promise<void>
  updateEntry: (id: string, entry: Partial<PasswordEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>
  checkPasswordReuse: (entryId: string, password: string) => Promise<boolean>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [masterPassword, setMasterPasswordState] = useState<string>('')

  const checkInitialized = useCallback(async (): Promise<boolean> => {
    const hasData = await hasStoredData()
    setIsInitialized(hasData)
    return hasData
  }, [])

  const saveData = useCallback(async (entriesData: PasswordEntry[], settingsData: AppSettings) => {
    if (!masterPassword) return
    const encrypted = await encryptData({ entries: entriesData, settings: settingsData }, masterPassword)
    await saveEncryptedData(encrypted)
  }, [masterPassword])

  const setMasterPassword = useCallback(async (password: string) => {
    const initialEntries: PasswordEntry[] = []
    const initialSettings = DEFAULT_SETTINGS
    const encrypted = await encryptData({ entries: initialEntries, settings: initialSettings }, password)
    await saveEncryptedData(encrypted)
    setMasterPasswordState(password)
    setEntries(initialEntries)
    setSettings(initialSettings)
    setIsInitialized(true)
    setIsUnlocked(true)
  }, [])

  const unlock = useCallback(async (password: string) => {
    const encrypted = await getEncryptedData()
    if (!encrypted) throw new Error('没有找到数据')

    const data = await decryptData(encrypted, password) as { entries: Partial<PasswordEntry>[]; settings?: AppSettings }
    const mergedSettings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) }
    const migratedEntries = await migrateEntries(data.entries || [], mergedSettings.defaultExpiryDays)
    setMasterPasswordState(password)
    setEntries(migratedEntries)
    setSettings(mergedSettings)
    setIsUnlocked(true)
  }, [])

  const lock = useCallback(() => {
    setMasterPasswordState('')
    setEntries([])
    setIsUnlocked(false)
  }, [])

  const addEntry = useCallback(async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt' | 'passwordHistory' | 'lastPasswordChangeAt' | 'expiryDays'> & { expiryDays?: number }) => {
    const now = Date.now()
    const passwordHistory = await addPasswordToHistory(entry.password, [])
    const newEntry: PasswordEntry = {
      ...entry,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      passwordHistory,
      expiryDays: entry.expiryDays !== undefined ? entry.expiryDays : settings.defaultExpiryDays,
      lastPasswordChangeAt: now
    }
    const newEntries = [...entries, newEntry]
    setEntries(newEntries)
    await saveData(newEntries, settings)
  }, [entries, settings, saveData])

  const updateEntry = useCallback(async (id: string, updates: Partial<PasswordEntry>) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return

    const now = Date.now()
    let finalUpdates: Partial<PasswordEntry> = { ...updates, updatedAt: now }

    if (updates.password !== undefined && updates.password !== entry.password) {
      const newHistory = await addPasswordToHistory(updates.password, entry.passwordHistory)
      finalUpdates = {
        ...finalUpdates,
        passwordHistory: newHistory,
        lastPasswordChangeAt: now
      }
    }

    const newEntries = entries.map(e =>
      e.id === id ? { ...e, ...finalUpdates } : e
    )
    setEntries(newEntries)
    await saveData(newEntries, settings)
  }, [entries, settings, saveData])

  const deleteEntry = useCallback(async (id: string) => {
    const newEntries = entries.filter(entry => entry.id !== id)
    setEntries(newEntries)
    await saveData(newEntries, settings)
  }, [entries, settings, saveData])

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    await saveData(entries, updatedSettings)
  }, [entries, settings, saveData])

  const checkPasswordReuse = useCallback(async (entryId: string, password: string): Promise<boolean> => {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return false
    return await isPasswordInLastN(password, entry.passwordHistory, 2)
  }, [entries])

  return (
    <AppContext.Provider value={{
      isInitialized,
      isUnlocked,
      entries,
      settings,
      checkInitialized,
      setMasterPassword,
      unlock,
      lock,
      addEntry,
      updateEntry,
      deleteEntry,
      updateSettings,
      checkPasswordReuse
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
