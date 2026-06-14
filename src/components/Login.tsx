import { useState, FormEvent } from 'react'
import { Lock, ShieldCheck, Eye, EyeOff, Fingerprint } from 'lucide-react'

interface LoginProps {
  onLogin: (password: string) => Promise<void>
  onBiometricLogin?: () => Promise<void>
  hasBiometric?: boolean
}

export default function Login({ onLogin, onBiometricLogin, hasBiometric }: LoginProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('请输入主密码')
      return
    }

    setLoading(true)
    try {
      await onLogin(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometric = async () => {
    if (!onBiometricLogin) return
    setError('')
    try {
      await onBiometricLogin()
    } catch (err) {
      setError('生物识别解锁失败，请使用密码登录')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon">
            <ShieldCheck size={48} />
          </div>
          <h1>密码管家</h1>
          <p>输入主密码解锁您的密码库</p>
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
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading}
          >
            {loading ? '解锁中...' : '解锁'}
          </button>

          {hasBiometric && (
            <>
              <div className="divider">
                <span>或</span>
              </div>
              <button
                type="button"
                className="btn-secondary btn-full btn-biometric"
                onClick={handleBiometric}
              >
                <Fingerprint size={20} />
                指纹/面部识别
              </button>
            </>
          )}
        </form>

        <div className="auth-footer">
          <p className="security-note">
            <ShieldCheck size={16} />
            您的数据仅存储在本地设备
          </p>
        </div>
      </div>
    </div>
  )
}
