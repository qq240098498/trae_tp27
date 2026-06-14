import { useState, FormEvent } from 'react'
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react'

interface SetupPasswordProps {
  onSetup: (password: string) => Promise<void>
}

export default function SetupPassword({ onSetup }: SetupPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('主密码至少需要 6 个字符')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      await onSetup(password)
    } catch (err) {
      setError('设置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const strength = calculateStrength(password)

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon">
            <ShieldCheck size={48} />
          </div>
          <h1>欢迎使用密码管家</h1>
          <p>设置主密码以保护您的数据安全</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">主密码</label>
            <div className="password-input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入主密码"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className={`strength-fill strength-${strength.level}`}
                    style={{ width: strength.percent + '%' }}
                  />
                </div>
                <span className="strength-text">{strength.label}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">确认主密码</label>
            <div className="password-input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入主密码"
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading}
          >
            {loading ? '设置中...' : '设置主密码'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="security-note">
            <ShieldCheck size={16} />
            您的数据仅存储在本地设备，不会上传到任何服务器
          </p>
          <p className="warning-note">
            请牢记主密码，丢失后无法找回！
          </p>
        </div>
      </div>
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
