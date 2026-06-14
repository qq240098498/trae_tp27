import { useState, useEffect } from 'react'
import { generatePassword } from '../utils/crypto'
import { RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react'

interface PasswordGeneratorProps {
  onGenerate?: (password: string) => void
  onClose?: () => void
  defaultLength?: number
  standalone?: boolean
}

export default function PasswordGenerator({
  onGenerate,
  onClose,
  defaultLength = 16,
  standalone = false
}: PasswordGeneratorProps) {
  const [length, setLength] = useState(defaultLength)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [easyRead, setEasyRead] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(true)

  const regenerate = () => {
    const password = generatePassword(length, { uppercase, lowercase, numbers, symbols, easyRead })
    setGeneratedPassword(password)
  }

  useEffect(() => {
    regenerate()
  }, [length, uppercase, lowercase, numbers, symbols, easyRead])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUse = () => {
    onGenerate?.(generatedPassword)
    onClose?.()
  }

  const strength = calculateStrength(generatedPassword)

  const displayPassword = showPassword
    ? generatedPassword
    : generatedPassword.replace(/./g, '•')

  return (
    <div className={`password-generator ${standalone ? 'password-generator-standalone' : ''}`}>
      <div className="generator-preview">
        <span className="preview-password password-value" title={generatedPassword}>
          {displayPassword}
        </span>
        <div className="preview-actions">
          <button
            className="icon-btn-sm"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button className="icon-btn-sm" onClick={regenerate} title="重新生成">
            <RefreshCw size={16} />
          </button>
          <button className="icon-btn-sm" onClick={handleCopy} title="复制密码">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {copied && <div className="copy-success">已复制到剪贴板</div>}

      <div className="password-info-row">
        <div className="strength-indicator">
          <div className="strength-bar">
            <div
              className={`strength-fill strength-${strength.level}`}
              style={{ width: strength.percent + '%' }}
            />
          </div>
          <span className="strength-text">强度: {strength.label}</span>
        </div>
        <div className="password-length-info">
          长度: {generatedPassword.length} 位
        </div>
      </div>

      <div className="generator-options">
        <div className="option-row">
          <div className="option-label-row">
            <label>密码长度</label>
            <span className="option-value">{length}</span>
          </div>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>4</span>
            <span>64</span>
          </div>
        </div>

        <div className="option-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
            />
            <span>大写字母 A-Z</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
            />
            <span>小写字母 a-z</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
            />
            <span>数字 0-9</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
            />
            <span>特殊符号 !@#$</span>
          </label>
        </div>

        <div className="option-row easy-read-option">
          <label className="checkbox-label easy-read-label">
            <input
              type="checkbox"
              checked={easyRead}
              onChange={(e) => setEasyRead(e.target.checked)}
            />
            <div>
              <span className="easy-read-title">易读模式</span>
              <span className="easy-read-desc">适合手动输入，排除易混淆字符 (0/O, 1/l/I)</span>
            </div>
          </label>
        </div>
      </div>

      {onGenerate && (
        <button className="btn-primary btn-full" onClick={handleUse}>
          使用此密码
        </button>
      )}
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
