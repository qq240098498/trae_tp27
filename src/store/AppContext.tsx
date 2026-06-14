import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { PasswordEntry } from '../types'
import { encryptData, decryptData, generateId } from '../utils/crypto'
import { saveEncryptedData, getEncryptedData, hasStoredData } from '../utils/storage'

interface AppContextType {
  isInitialized: boolean
  isUnlocked: boolean
  entries: PasswordEntry[]
  checkInitialized: () => Promise<boolean>
  setMasterPassword: (password: string) => Promise<void>
  unlock: (password: string) => Promise<void>
  lock: () => void
  addEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateEntry: (id: string, entry: Partial<PasswordEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [masterPassword, setMasterPasswordState] = useState<string>('')

  const checkInitialized = useCallback(async (): Promise<boolean> => {
    const hasData = await hasStoredData()
    setIsInitialized(hasData)
    return hasData
  }, [])

  const saveData = useCallback(async (entriesData: PasswordEntry[]) => {
    if (!masterPassword) return
    const encrypted = await encryptData({ entries: entriesData }, masterPassword)
    await saveEncryptedData(encrypted)
  }, [masterPassword])

  const setMasterPassword = useCallback(async (password: string) => {
    const initialEntries: PasswordEntry[] = []
    const encrypted = await encryptData({ entries: initialEntries }, password)
    await saveEncryptedData(encrypted)
    setMasterPasswordState(password)
    setEntries(initialEntries)
    setIsInitialized(true)
    setIsUnlocked(true)
  }, [])

  const unlock = useCallback(async (password: string) => {
    const encrypted = await getEncryptedData()
    if (!encrypted) throw new Error('没有找到数据')

    const data = await decryptData(encrypted, password) as { entries: PasswordEntry[] }
    setMasterPasswordState(password)
    setEntries(data.entries || [])
    setIsUnlocked(true)
  }, [])

  const lock = useCallback(() => {
    setMasterPasswordState('')
    setEntries([])
    setIsUnlocked(false)
  }, [])

  const addEntry = useCallback(async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: PasswordEntry = {
      ...entry,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    const newEntries = [...entries, newEntry]
    setEntries(newEntries)
    await saveData(newEntries)
  }, [entries, saveData])

  const updateEntry = useCallback(async (id: string, updates: Partial<PasswordEntry>) => {
    const newEntries = entries.map(entry =>
      entry.id === id
        ? { ...entry, ...updates, updatedAt: Date.now() }
        : entry
    )
    setEntries(newEntries)
    await saveData(newEntries)
  }, [entries, saveData])

  const deleteEntry = useCallback(async (id: string) => {
    const newEntries = entries.filter(entry => entry.id !== id)
    setEntries(newEntries)
    await saveData(newEntries)
  }, [entries, saveData])

  return (
    <AppContext.Provider value={{
      isInitialized,
      isUnlocked,
      entries,
      checkInitialized,
      setMasterPassword,
      unlock,
      lock,
      addEntry,
      updateEntry,
      deleteEntry
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
