import { openDB, IDBPDatabase } from 'idb'
import { PasswordEntry, EncryptedData } from '../types'

const DB_NAME = 'password-manager-db'
const DB_VERSION = 1
const STORE_NAME = 'encrypted-data'

interface StoredData {
  id: string
  encryptedData: EncryptedData
  updatedAt: number
}

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })

  return dbPromise
}

export async function saveEncryptedData(encrypted: EncryptedData): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  const record: StoredData = {
    id: 'main',
    encryptedData: encrypted,
    updatedAt: Date.now()
  }

  await store.put(record)
  await tx.done
}

export async function getEncryptedData(): Promise<EncryptedData | null> {
  const db = await getDB()
  const result = await db.get(STORE_NAME, 'main')
  return result ? result.encryptedData : null
}

export async function hasStoredData(): Promise<boolean> {
  const data = await getEncryptedData()
  return data !== null
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  await store.clear()
  await tx.done
}

export async function exportDataAsJSON(): Promise<string | null> {
  const data = await getEncryptedData()
  if (!data) return null
  return JSON.stringify(data, null, 2)
}

export async function importDataFromJSON(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json) as EncryptedData
    if (!data.iv || !data.salt || !data.data) {
      return false
    }
    await saveEncryptedData(data)
    return true
  } catch (e) {
    return false
  }
}
