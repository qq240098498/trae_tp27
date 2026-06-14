import { EncryptedData } from '../types'

const ITERATIONS = 100000
const KEY_LENGTH = 256
const SALT_LENGTH = 16
const IV_LENGTH = 12
const CURRENT_VERSION = 1

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes.buffer
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptData(data: unknown, masterPassword: string): Promise<EncryptedData> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const key = await deriveKey(masterPassword, salt)

  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(JSON.stringify(data))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    dataBuffer
  )

  return {
    iv: bufferToHex(iv.buffer as ArrayBuffer),
    salt: bufferToHex(salt.buffer as ArrayBuffer),
    data: bufferToHex(encrypted),
    version: CURRENT_VERSION
  }
}

export async function decryptData(
  encrypted: EncryptedData,
  masterPassword: string
): Promise<unknown> {
  const salt = new Uint8Array(hexToBuffer(encrypted.salt))
  const iv = new Uint8Array(hexToBuffer(encrypted.iv))
  const data = hexToBuffer(encrypted.data)

  const key = await deriveKey(masterPassword, salt)

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    )

    const decoder = new TextDecoder()
    const text = decoder.decode(decrypted)
    return JSON.parse(text)
  } catch (e) {
    throw new Error('密码错误或数据已损坏')
  }
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return bufferToHex(hash)
}

export function generatePassword(
  length: number = 16,
  options: {
    uppercase?: boolean
    lowercase?: boolean
    numbers?: boolean
    symbols?: boolean
    easyRead?: boolean
  } = {}
): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    easyRead = false
  } = options

  let uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
  let numbersChars = '0123456789'
  let symbolsChars = '!@#$%^&*()_-+=<>?/[]{}|'

  if (easyRead) {
    uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    lowercaseChars = 'abcdefghjkmnpqrstuvwxyz'
    numbersChars = '23456789'
    symbolsChars = '!@#$%^&*_+-=?/'
  }

  let chars = ''
  let requiredChars = ''

  if (uppercase) {
    chars += uppercaseChars
    requiredChars += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]
  }
  if (lowercase) {
    chars += lowercaseChars
    requiredChars += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]
  }
  if (numbers) {
    chars += numbersChars
    requiredChars += numbersChars[Math.floor(Math.random() * numbersChars.length)]
  }
  if (symbols) {
    chars += symbolsChars
    requiredChars += symbolsChars[Math.floor(Math.random() * symbolsChars.length)]
  }

  if (chars.length === 0) {
    chars = lowercaseChars
  }

  const array = new Uint32Array(length)
  crypto.getRandomValues(array)

  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length]
  }

  if (requiredChars.length > 0 && length >= requiredChars.length) {
    const passwordArray = password.split('')
    const requiredArray = requiredChars.split('')
    const positions: number[] = []

    while (positions.length < requiredArray.length) {
      const pos = Math.floor(Math.random() * length)
      if (!positions.includes(pos)) {
        positions.push(pos)
      }
    }

    for (let i = 0; i < requiredArray.length; i++) {
      passwordArray[positions[i]] = requiredArray[i]
    }

    password = passwordArray.join('')
  }

  return password
}

export function generateId(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return bufferToHex(array.buffer)
}
