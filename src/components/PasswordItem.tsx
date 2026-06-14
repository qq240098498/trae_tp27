import { useState } from 'react'
import { PasswordEntry, CATEGORIES } from '../types'
import { Eye, EyeOff, Copy, Edit2, Trash2, Globe, User, ShieldAlert, ShieldCheck, Shield, AlertTriangle } from 'lucide-react'
import { analyzePasswordStrength, findReusedPasswords, StrengthLevel } from '../utils/passwordStrength'

interface PasswordItemProps {
  entry: PasswordEntry
  allEntries: PasswordEntry[]
  onEdit: () => void
  onDelete: () => void
}

function StrengthBadge({ level }: { level: StrengthLevel }) {
  if (level === 'strong') {
    return (
      <span className="strength-badge strength-badge-strong">
        <ShieldCheck size={12} />
        强
      </span>
    )
  }
  if (level === 'medium') {
    return (
      <span className="strength-badge strength-badge-medium">
        <Shield size={12} />
        中
      </span>
    )
  }
  return (
    <span className="strength-badge strength-badge-weak">
      <ShieldAlert size={12} />
      弱
    </span>
  )
}

export default function PasswordItem({ entry, allEntries, onEdit, onDelete }: PasswordItemProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const category = CATEGORIES.find(c => c.id === entry.category)

  const strengthResult = analyzePasswordStrength(entry.password)
  const reusedPasswords = findReusedPasswords(allEntries)
  const reuseInfo = reusedPasswords.find(r => r.password === entry.password)
  const isReused = reuseInfo && reuseInfo.count >= 2

  const copyPassword = async () => {
    await navigator.clipboard.writeText(entry.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyUsername = async () => {
    await navigator.clipboard.writeText(entry.username)
  }

  return (
    <div className={`password-card ${strengthResult.level === 'weak' ? 'password-card-weak' : ''} ${isReused ? 'password-card-reused' : ''}`}>
      <div className="password-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className="category-badge"
            style={{ backgroundColor: category?.color + '20', color: category?.color }}
          >
            {category?.name}
          </div>
          <StrengthBadge level={strengthResult.level} />
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

      {strengthResult.level === 'weak' && strengthResult.reasons.length > 0 && (
        <div className="password-warning weak-warning">
          <ShieldAlert size={14} />
          <div className="warning-content">
            <span className="warning-title">弱密码 — 建议修改</span>
            <span className="warning-reasons">{strengthResult.reasons.join('、')}</span>
          </div>
          <button className="warning-action-btn" onClick={onEdit}>修改</button>
        </div>
      )}

      {isReused && strengthResult.level !== 'weak' && (
        <div className="password-warning reuse-warning">
          <AlertTriangle size={14} />
          <div className="warning-content">
            <span className="warning-title">密码重复使用</span>
            <span className="warning-reasons">
              该密码已用于{reuseInfo!.count}个网站，建议区分
            </span>
          </div>
          <button className="warning-action-btn" onClick={onEdit}>修改</button>
        </div>
      )}

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
