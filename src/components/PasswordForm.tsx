import { useState, FormEvent, useEffect } from 'react'
import { PasswordEntry, CategoryType, CATEGORIES, EXPIRY_OPTIONS } from '../types'
import PasswordGenerator from './PasswordGenerator'
import { X, Calendar, Clock, History, AlertCircle } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { isPasswordInLastN, formatLastChangedDate } from '../utils/passwordExpiry'

interface PasswordFormProps {
  entry?: PasswordEntry | null
  onClose: () => void
  onSubmit: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt' | 'passwordHistory' | 'lastPasswordChangeAt' | 'expiryDays'> & { expiryDays?: number }) => Promise<void>
}

export default function PasswordForm({ entry, onClose, onSubmit }: PasswordFormProps) {
  const { settings } = useApp()
  const [title, setTitle] = useState(entry?.title || '')
  const [category, setCategory] = useState<CategoryType>(entry?.category || 'other')
  const [username, setUsername] = useState(entry?.username || '')
  const [password, setPassword] = useState(entry?.password || '')
  const [url, setUrl] = useState(entry?.url || '')
  const [notes, setNotes] = useState(entry?.notes || '')
  const [expiryDays, setExpiryDays] = useState(entry?.expiryDays ?? settings.defaultExpiryDays)
  const [showGenerator, setShowGenerator] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordReuseWarning, setPasswordReuseWarning] = useState(false)
  const [checkingReuse, setCheckingReuse] = useState(false)

  useEffect(() => {
    if (!entry || !password || password === entry.password) {
      setPasswordReuseWarning(false)
      return
    }

    const checkReuse = async () => {
      setCheckingReuse(true)
      const isReused = await isPasswordInLastN(password, entry.passwordHistory, 2)
      setPasswordReuseWarning(isReused)
      setCheckingReuse(false)
    }

    const timer = setTimeout(checkReuse, 300)
    return () => clearTimeout(timer)
  }, [password, entry])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('请输入标题')
      return
    }

    if (!password) {
      setError('请输入密码')
      return
    }

    if (passwordReuseWarning) {
      setError('密码与最近两次使用的密码重复，请更换新密码')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        title: title.trim(),
        category,
        username: username.trim(),
        password,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        expiryDays
      })
    } catch (err) {
      setError('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePassword = (newPassword: string) => {
    setPassword(newPassword)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{entry ? '编辑密码' : '添加密码'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：微信、GitHub"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>账号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名/邮箱/手机号"
            />
          </div>

          <div className="form-group">
            <label>密码 *</label>
            <div className="password-input-row">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowGenerator(!showGenerator)}
              >
                生成
              </button>
            </div>
          </div>

          {showGenerator && (
            <PasswordGenerator
              onGenerate={handleGeneratePassword}
              onClose={() => setShowGenerator(false)}
            />
          )}

          {passwordReuseWarning && (
            <div className="password-warning reuse-warning">
              <AlertCircle size={16} />
              <div className="warning-content">
                <span className="warning-title">密码重复</span>
                <span className="warning-reasons">该密码与最近两次使用的密码重复，请更换新密码</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>
              <Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              密码过期周期
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
            >
              {EXPIRY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {entry && entry.passwordHistory.length > 0 && (
            <div className="form-group">
              <button
                type="button"
                className="btn-secondary btn-full"
                onClick={() => setShowHistory(!showHistory)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <History size={16} />
                {showHistory ? '隐藏' : '查看'}密码修改历史（{entry.passwordHistory.length} 条）
              </button>

              {showHistory && (
                <div className="password-history-list">
                  <div className="history-info">
                    <Clock size={14} />
                    <span>上次修改：{formatLastChangedDate(entry)}</span>
                  </div>
                  <div className="history-note">
                    为了安全，仅记录密码修改时间，不存储历史密码明文。
                    <br />
                    当前限制：不能使用最近 2 次的旧密码。
                  </div>
                  {entry.passwordHistory.slice().reverse().map((item, idx) => (
                    <div key={idx} className="history-item">
                      <span className="history-dot">•</span>
                      <span>第 {entry.passwordHistory.length - idx} 次修改</span>
                      <span className="history-date">
                        {new Date(item.changedAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>网址</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label>备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="如：包含特殊字符要求、安全问题答案等"
              rows={3}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
