import { PasswordEntry } from '../types'

export type StrengthLevel = 'weak' | 'medium' | 'strong'

export interface StrengthResult {
  level: StrengthLevel
  score: number
  reasons: string[]
}

export interface ReuseInfo {
  password: string
  entries: PasswordEntry[]
  count: number
}

export interface SecurityAuditResult {
  weakEntries: { entry: PasswordEntry; result: StrengthResult }[]
  reusedPasswords: ReuseInfo[]
  totalEntries: number
  weakCount: number
  reusedCount: number
  safeCount: number
}

const COMMON_PASSWORDS: Set<string> = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', 'master', 'dragon', '111111', 'baseball',
  'iloveyou', 'trustno1', 'sunshine', 'ashley', 'bailey',
  'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'password1', 'password123',
  '1234567890', '000000', '987654321', '666666', '888888',
  '123456789', '1234567', '12345', '1234', '123',
  'admin', 'root', 'test', 'guest', 'welcome',
  'abcdef', 'abcdefg', 'abcdefgh', 'aaaaaa', 'qwerty123',
])

function isPureDigits(password: string): boolean {
  return /^\d+$/.test(password)
}

function isRepeatedPattern(password: string): boolean {
  if (password.length < 4) return false
  const lower = password.toLowerCase()
  for (let patternLen = 1; patternLen <= Math.floor(lower.length / 2); patternLen++) {
    const pattern = lower.substring(0, patternLen)
    if (pattern.repeat(Math.ceil(lower.length / patternLen)).startsWith(lower)) {
      return true
    }
  }
  return false
}

function isSequentialChars(password: string): boolean {
  if (password.length < 4) return false
  const lower = password.toLowerCase()
  let consecutive = 1
  for (let i = 1; i < lower.length; i++) {
    const diff = lower.charCodeAt(i) - lower.charCodeAt(i - 1)
    if (diff === 1 || diff === -1) {
      consecutive++
      if (consecutive >= 4) return true
    } else {
      consecutive = 1
    }
  }
  return false
}

function isCommonBirthday(password: string): boolean {
  const digits = password.replace(/\D/g, '')
  if (digits.length === 8) {
    const year = parseInt(digits.substring(0, 4))
    const month = parseInt(digits.substring(4, 6))
    const day = parseInt(digits.substring(6, 8))
    if (year >= 1960 && year <= 2020 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return true
    }
  }
  if (digits.length === 6) {
    const month = parseInt(digits.substring(0, 2))
    const day = parseInt(digits.substring(2, 4))
    const year = parseInt(digits.substring(4, 6))
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 0 && year <= 99) {
      return true
    }
  }
  return false
}

function isKeyboardPattern(password: string): boolean {
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890']
  const lower = password.toLowerCase()
  for (const row of rows) {
    for (let i = 0; i <= row.length - 4; i++) {
      const seq = row.substring(i, i + 4)
      if (lower.includes(seq) || lower.includes(seq.split('').reverse().join(''))) {
        return true
      }
    }
  }
  return false
}

export function analyzePasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { level: 'weak', score: 0, reasons: ['密码为空'] }
  }

  const reasons: string[] = []
  let score = 100

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    reasons.push('常见弱密码')
    score -= 60
  }

  if (isPureDigits(password)) {
    reasons.push('纯数字密码')
    score -= 40
  }

  if (password.length < 6) {
    reasons.push('密码过短（少于6位）')
    score -= 35
  } else if (password.length < 8) {
    reasons.push('密码较短（少于8位）')
    score -= 15
  }

  if (isRepeatedPattern(password)) {
    reasons.push('重复字符模式')
    score -= 30
  }

  if (isSequentialChars(password)) {
    reasons.push('连续字符序列')
    score -= 25
  }

  if (isCommonBirthday(password)) {
    reasons.push('常见生日格式')
    score -= 30
  }

  if (isKeyboardPattern(password)) {
    reasons.push('键盘连续字符')
    score -= 20
  }

  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)
  const charTypes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length

  if (charTypes === 1 && !isPureDigits(password)) {
    reasons.push('仅使用单一字符类型')
    score -= 15
  }

  score = Math.max(0, Math.min(100, score))

  let level: StrengthLevel
  if (score < 50) {
    level = 'weak'
  } else if (score < 80) {
    level = 'medium'
  } else {
    level = 'strong'
  }

  return { level, score, reasons }
}

export function findReusedPasswords(entries: PasswordEntry[]): ReuseInfo[] {
  const passwordMap = new Map<string, PasswordEntry[]>()

  for (const entry of entries) {
    const existing = passwordMap.get(entry.password) || []
    existing.push(entry)
    passwordMap.set(entry.password, existing)
  }

  const reused: ReuseInfo[] = []
  for (const [password, passwordEntries] of passwordMap) {
    if (passwordEntries.length >= 2) {
      reused.push({
        password,
        entries: passwordEntries,
        count: passwordEntries.length
      })
    }
  }

  return reused.sort((a, b) => b.count - a.count)
}

export function performSecurityAudit(entries: PasswordEntry[]): SecurityAuditResult {
  const reusedPasswords = findReusedPasswords(entries)
  const reusedPasswordSet = new Set(reusedPasswords.map(r => r.password))

  const weakEntries: { entry: PasswordEntry; result: StrengthResult }[] = []
  const weakOrReusedIds = new Set<string>()

  for (const entry of entries) {
    const result = analyzePasswordStrength(entry.password)
    const isReused = reusedPasswordSet.has(entry.password)

    if (result.level === 'weak') {
      weakEntries.push({ entry, result })
      weakOrReusedIds.add(entry.id)
    }

    if (isReused && result.level !== 'weak') {
      const reuseReason = `该密码已用于${reusedPasswords.find(r => r.password === entry.password)!.count}个网站，建议区分`
      const updatedResult: StrengthResult = {
        ...result,
        level: 'medium',
        reasons: [...result.reasons, reuseReason]
      }
      weakEntries.push({ entry, result: updatedResult })
      weakOrReusedIds.add(entry.id)
    }
  }

  return {
    weakEntries,
    reusedPasswords,
    totalEntries: entries.length,
    weakCount: weakEntries.filter(e => e.result.level === 'weak').length,
    reusedCount: reusedPasswords.reduce((sum, r) => sum + r.entries.length, 0),
    safeCount: entries.length - weakOrReusedIds.size
  }
}
