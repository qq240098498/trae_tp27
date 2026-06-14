import { useState, useEffect } from 'react'
import { generatePassword } from '../utils/crypto'
import { RefreshCw, Copy, Check } from 'lucide-react'

interface PasswordGeneratorProps {
  onGenerate: (password: string) => void
  onClose?: () => void
  defaultLength?: number
}

export default function PasswordGenerator({
  onGenerate,
  onClose,
  defaultLength = 16
}: PasswordGeneratorProps) {
  const [length, setLength] = useState(defaultLength)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const regenerate = () => {
    const password = generatePassword(length, { uppercase, lowercase, numbers, symbols })
    setGeneratedPassword(password)
  }

  useEffect(() => {
    regenerate()
  }, [length, uppercase, lowercase, numbers, symbols])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUse = () => {
    onGenerate(generatedPassword)
    onClose?.()
  }

  const strength = calculateStrength(generatedPassword)

  return (
    <div className="password-generator">
      <div className="generator-preview">
        <span className="preview-password">{generatedPassword}</span>
        <div className="preview-actions">
          <button className="icon-btn-sm" onClick={regenerate} title="重新生成">
            <RefreshCw size={16} />
          </button>
          <button className="icon-btn-sm" onClick={handleCopy} title="复制">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <div className="strength-indicator">
        <div className="strength-bar">
          <div
            className={`strength-fill strength-${strength.level}`}
            style={{ width: strength.percent + '%' }}
          />
        </div>
        <span className="strength-text">强度: {strength.label}</span>
      </div>

      <div className="generator-options">
        <div className="option-row">
          <label>密码长度: {length}</label>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
          />
        </div>

        <div className="option-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
            />
            <span>大写字母</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
            />
            <span>小写字母</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
            />
            <span>数字</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
            />
            <span>特殊符号</span>
          </label>
        </div>
      </div>

      <button className="btn-primary btn-full" onClick={handleUse}>
        使用此密码
      </button>
    </div>
  )
}

function calculateStrength(password: string): { level: number; label: string; percent: number } {
  let score = 0
  if (password.length >= 6) score += 20
  if (password.length >= 10) score += 20
  if (password.length >= 16) score += 10
  if (/[a-z]/.test(password)) score += 15
  if (/[A-Z]/.test(password)) score += 15
  if (/[0-9]/.test(password)) score += 10
  if (/[^a-zA-Z0-9]/.test(password)) score += 10

  if (score < 40) return { level: 1, label: '弱', percent: score }
  if (score < 70) return { level: 2, label: '中', percent: score }
  return { level: 3, label: '强', percent: Math.min(100, score) }
}
