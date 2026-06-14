import { useState, FormEvent } from 'react'
import { PasswordEntry, CategoryType, CATEGORIES } from '../types'
import PasswordGenerator from './PasswordGenerator'
import { X } from 'lucide-react'

interface PasswordFormProps {
  entry?: PasswordEntry | null
  onClose: () => void
  onSubmit: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

export default function PasswordForm({ entry, onClose, onSubmit }: PasswordFormProps) {
  const [title, setTitle] = useState(entry?.title || '')
  const [category, setCategory] = useState<CategoryType>(entry?.category || 'other')
  const [username, setUsername] = useState(entry?.username || '')
  const [password, setPassword] = useState(entry?.password || '')
  const [url, setUrl] = useState(entry?.url || '')
  const [notes, setNotes] = useState(entry?.notes || '')
  const [showGenerator, setShowGenerator] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    setLoading(true)
    try {
      await onSubmit({
        title: title.trim(),
        category,
        username: username.trim(),
        password,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined
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
