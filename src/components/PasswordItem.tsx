import { useState } from 'react'
import { PasswordEntry, CATEGORIES } from '../types'
import { Eye, EyeOff, Copy, Edit2, Trash2, Globe, User } from 'lucide-react'

interface PasswordItemProps {
  entry: PasswordEntry
  onEdit: () => void
  onDelete: () => void
}

export default function PasswordItem({ entry, onEdit, onDelete }: PasswordItemProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const category = CATEGORIES.find(c => c.id === entry.category)

  const copyPassword = async () => {
    await navigator.clipboard.writeText(entry.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyUsername = async () => {
    await navigator.clipboard.writeText(entry.username)
  }

  return (
    <div className="password-card">
      <div className="password-card-header">
        <div
          className="category-badge"
          style={{ backgroundColor: category?.color + '20', color: category?.color }}
        >
          {category?.name}
        </div>
        <div className="card-actions">
          <button className="icon-btn-sm" onClick={onEdit}>
            <Edit2 size={16} />
          </button>
          <button className="icon-btn-sm danger" onClick={onDelete}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <h3 className="entry-title">{entry.title}</h3>

      <div className="entry-field">
        <User size={16} className="field-icon" />
        <span className="field-label">账号</span>
        <span className="field-value" onClick={copyUsername} title="点击复制">
          {entry.username}
        </span>
      </div>

      <div className="entry-field">
        <div className="field-icon">🔑</div>
        <span className="field-label">密码</span>
        <span className="field-value password-value">
          {showPassword ? entry.password : '••••••••'}
        </span>
        <button
          className="icon-btn-sm"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          className="icon-btn-sm"
          onClick={copyPassword}
          title={copied ? '已复制' : '复制密码'}
        >
          <Copy size={16} />
        </button>
      </div>

      {entry.url && (
        <div className="entry-field">
          <Globe size={16} className="field-icon" />
          <span className="field-label">网址</span>
          <a
            href={entry.url.startsWith('http') ? entry.url : 'https://' + entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="field-link"
          >
            {entry.url}
          </a>
        </div>
      )}

      {entry.notes && (
        <div className="entry-notes">
          <span className="notes-label">备注</span>
          <p className="notes-text">{entry.notes}</p>
        </div>
      )}

      {copied && <div className="copy-toast">已复制到剪贴板</div>}
    </div>
  )
}
