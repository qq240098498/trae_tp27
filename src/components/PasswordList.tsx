import { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { CATEGORIES, CategoryType, EXPIRY_OPTIONS } from '../types'
import PasswordItem from './PasswordItem'
import PasswordForm from './PasswordForm'
import PasswordGenerator from './PasswordGenerator'
import CategoryFilter from './CategoryFilter'
import SearchBar from './SearchBar'
import { Plus, LogOut, Settings, Download, Upload, KeyRound, X, ShieldAlert, ShieldCheck, AlertTriangle, Calendar, Clock } from 'lucide-react'
import { exportDataAsJSON, importDataFromJSON } from '../utils/storage'
import { performSecurityAudit } from '../utils/passwordStrength'
import { isExpired, isExpiringSoon, getDaysUntilExpiry } from '../utils/passwordExpiry'

export default function PasswordList() {
  const { entries, lock, addEntry, updateEntry, deleteEntry, settings, updateSettings } = useApp()
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [showSecurityAudit, setShowSecurityAudit] = useState(false)
  const [tempDefaultExpiryDays, setTempDefaultExpiryDays] = useState(settings.defaultExpiryDays)
  const [tempReminderDays, setTempReminderDays] = useState(settings.expiryReminderDays)

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory
      const matchesSearch = !searchQuery ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [entries, selectedCategory, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length }
    CATEGORIES.forEach(cat => {
      counts[cat.id] = entries.filter(e => e.category === cat.id).length
    })
    return counts
  }, [entries])

  const securityAudit = useMemo(() => {
    return performSecurityAudit(entries)
  }, [entries])

  const expiryStats = useMemo(() => {
    const expired = entries.filter(e => isExpired(e))
    const expiringSoon = entries.filter(e => isExpiringSoon(e, settings.expiryReminderDays))
    return { expired, expiringSoon, expiredCount: expired.length, expiringSoonCount: expiringSoon.length }
  }, [entries, settings.expiryReminderDays])

  const handleAdd = () => {
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const handleExport = async () => {
    const data = await exportDataAsJSON()
    if (data) {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `password-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      const success = await importDataFromJSON(text)
      if (success) {
        alert('导入成功，请重新解锁')
        lock()
      } else {
        alert('导入失败，文件格式不正确')
      }
    }
    input.click()
  }

  const editingEntry = editingId ? entries.find(e => e.id === editingId) : null

  const securityScore = entries.length > 0
    ? Math.round((securityAudit.safeCount / securityAudit.totalEntries) * 100)
    : 100

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">密码管家</h1>
        </div>
        <div className="header-right">
          <button
            className={`icon-btn ${securityAudit.weakCount > 0 || securityAudit.reusedPasswords.length > 0 ? 'icon-btn-security-alert' : ''}`}
            onClick={() => setShowSecurityAudit(true)}
            title="安全检测"
          >
            {securityAudit.weakCount > 0 || securityAudit.reusedPasswords.length > 0
              ? <ShieldAlert size={20} />
              : <ShieldCheck size={20} />
            }
          </button>
          <button className="icon-btn" onClick={() => setShowGenerator(true)} title="密码生成器">
            <KeyRound size={20} />
          </button>
          <button className="icon-btn" onClick={handleExport} title="导出数据">
            <Download size={20} />
          </button>
          <button className="icon-btn" onClick={handleImport} title="导入数据">
            <Upload size={20} />
          </button>
          <button className="icon-btn" onClick={() => setShowSettings(!showSettings)} title="设置">
            <Settings size={20} />
          </button>
          <button className="icon-btn" onClick={lock} title="锁定">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="app-content">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {expiryStats.expiredCount > 0 && (
          <div className="expiry-summary-bar expired-summary-bar" onClick={() => setShowSecurityAudit(true)}>
            <AlertTriangle size={16} />
            <span>{expiryStats.expiredCount} 个密码已过期，请及时修改</span>
            <span className="security-summary-action">查看 →</span>
          </div>
        )}

        {expiryStats.expiringSoonCount > 0 && expiryStats.expiredCount === 0 && (
          <div className="expiry-summary-bar expiring-soon-summary-bar" onClick={() => setShowSecurityAudit(true)}>
            <Clock size={16} />
            <span>该改密码了 — {expiryStats.expiringSoonCount} 个密码将在 {settings.expiryReminderDays} 天内过期</span>
            <span className="security-summary-action">查看 →</span>
          </div>
        )}

        {(securityAudit.weakCount > 0 || securityAudit.reusedPasswords.length > 0) && (
          <div className="security-summary-bar" onClick={() => setShowSecurityAudit(true)}>
            <ShieldAlert size={16} />
            <span>
              {securityAudit.weakCount > 0 && `${securityAudit.weakCount}个弱密码`}
              {securityAudit.weakCount > 0 && securityAudit.reusedPasswords.length > 0 && '，'}
              {securityAudit.reusedPasswords.length > 0 && `${securityAudit.reusedPasswords.length}组重复密码`}
            </span>
            <span className="security-summary-action">查看详情 →</span>
          </div>
        )}

        <CategoryFilter
          selected={selectedCategory}
          onChange={setSelectedCategory}
          counts={categoryCounts}
        />

        <div className="entry-list">
          {filteredEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔒</div>
              <p className="empty-text">
                {entries.length === 0 ? '还没有密码条目' : '没有匹配的结果'}
              </p>
              {entries.length === 0 && (
                <button className="btn-primary" onClick={handleAdd}>
                  添加第一个密码
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map(entry => (
              <PasswordItem
                key={entry.id}
                entry={entry}
                allEntries={entries}
                onEdit={() => handleEdit(entry.id)}
                onDelete={() => {
                  if (confirm('确定要删除这条密码吗？')) {
                    deleteEntry(entry.id)
                  }
                }}
              />
            ))
          )}
        </div>
      </div>

      <button className="fab" onClick={handleAdd}>
        <Plus size={24} />
      </button>

      {showForm && (
        <PasswordForm
          entry={editingEntry}
          onClose={handleCloseForm}
          onSubmit={async (data) => {
            if (editingId) {
              await updateEntry(editingId, data)
            } else {
              await addEntry(data)
            }
            handleCloseForm()
          }}
        />
      )}

      {showGenerator && (
        <div className="modal-overlay" onClick={() => setShowGenerator(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>密码生成器</h2>
              <button className="icon-btn" onClick={() => setShowGenerator(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <PasswordGenerator standalone onClose={() => setShowGenerator(false)} />
            </div>
          </div>
        </div>
      )}

      {showSecurityAudit && (
        <div className="modal-overlay" onClick={() => setShowSecurityAudit(false)}>
          <div className="modal-content security-audit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>安全检测</h2>
              <button className="icon-btn" onClick={() => setShowSecurityAudit(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <div className="security-score-section">
                <div className="security-score-ring">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={securityScore >= 80 ? 'var(--success)' : securityScore >= 50 ? 'var(--warning)' : 'var(--danger)'}
                      strokeWidth="8"
                      strokeDasharray={`${securityScore * 2.64} 264`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      className="security-score-circle"
                    />
                  </svg>
                  <div className="security-score-text">
                    <span className="security-score-number">{securityScore}</span>
                    <span className="security-score-label">安全分</span>
                  </div>
                </div>
                <div className="security-stats">
                  <div className="security-stat">
                    <span className="stat-number stat-total">{securityAudit.totalEntries}</span>
                    <span className="stat-label">总密码数</span>
                  </div>
                  <div className="security-stat">
                    <span className="stat-number stat-safe">{securityAudit.safeCount}</span>
                    <span className="stat-label">安全</span>
                  </div>
                  <div className="security-stat">
                    <span className="stat-number stat-weak">{securityAudit.weakCount}</span>
                    <span className="stat-label">弱密码</span>
                  </div>
                  <div className="security-stat">
                    <span className="stat-number stat-reused">{securityAudit.reusedPasswords.length}</span>
                    <span className="stat-label">重复组</span>
                  </div>
                </div>

                <div className="security-stats expiry-stats">
                  <div className="security-stat">
                    <span className="stat-number stat-expired">{expiryStats.expiredCount}</span>
                    <span className="stat-label">已过期</span>
                  </div>
                  <div className="security-stat">
                    <span className="stat-number stat-expiring-soon">{expiryStats.expiringSoonCount}</span>
                    <span className="stat-label">即将过期</span>
                  </div>
                  <div className="security-stat">
                    <span className="stat-number stat-expiry-never">
                      {entries.filter(e => e.expiryDays <= 0).length}
                    </span>
                    <span className="stat-label">永不过期</span>
                  </div>
                  <div className="security-stat">
                    <span className="stat-number stat-expiry-normal">
                      {entries.filter(e => e.expiryDays > 0 && !isExpired(e) && !isExpiringSoon(e, settings.expiryReminderDays)).length}
                    </span>
                    <span className="stat-label">正常</span>
                  </div>
                </div>
              </div>

              {expiryStats.expired.length > 0 && (
                <div className="audit-section">
                  <h3 className="audit-section-title">
                    <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
                    已过期的密码
                  </h3>
                  <div className="audit-list">
                    {expiryStats.expired.map(entry => {
                      const daysLeft = getDaysUntilExpiry(entry)
                      return (
                        <div key={entry.id} className="audit-item">
                          <div className="audit-item-info">
                            <span className="audit-item-title">{entry.title}</span>
                            <span className="audit-item-reasons">
                              已过期 {Math.abs(daysLeft || 0)} 天 · 每 {entry.expiryDays} 天更换
                            </span>
                          </div>
                          <button
                            className="audit-item-action"
                            onClick={() => {
                              setShowSecurityAudit(false)
                              handleEdit(entry.id)
                            }}
                          >
                            修改
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {expiryStats.expiringSoon.length > 0 && (
                <div className="audit-section">
                  <h3 className="audit-section-title">
                    <Clock size={16} style={{ color: 'var(--warning)' }} />
                    即将过期的密码
                  </h3>
                  <div className="audit-list">
                    {expiryStats.expiringSoon.map(entry => {
                      const daysLeft = getDaysUntilExpiry(entry)
                      return (
                        <div key={entry.id} className="audit-item">
                          <div className="audit-item-info">
                            <span className="audit-item-title">{entry.title}</span>
                            <span className="audit-item-reasons">
                              还有 {daysLeft} 天过期 · 每 {entry.expiryDays} 天更换
                            </span>
                          </div>
                          <button
                            className="audit-item-action"
                            onClick={() => {
                              setShowSecurityAudit(false)
                              handleEdit(entry.id)
                            }}
                          >
                            修改
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {securityAudit.weakEntries.length > 0 && (
                <div className="audit-section">
                  <h3 className="audit-section-title">
                    <ShieldAlert size={16} />
                    需要关注的密码
                  </h3>
                  <div className="audit-list">
                    {securityAudit.weakEntries.map(({ entry, result }) => (
                      <div key={entry.id} className="audit-item">
                        <div className="audit-item-info">
                          <span className="audit-item-title">{entry.title}</span>
                          <span className="audit-item-reasons">{result.reasons.join('、')}</span>
                        </div>
                        <button
                          className="audit-item-action"
                          onClick={() => {
                            setShowSecurityAudit(false)
                            handleEdit(entry.id)
                          }}
                        >
                          修改
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {securityAudit.reusedPasswords.length > 0 && (
                <div className="audit-section">
                  <h3 className="audit-section-title">
                    <AlertTriangle size={16} />
                    重复使用的密码
                  </h3>
                  <div className="audit-list">
                    {securityAudit.reusedPasswords.map((reuse, idx) => (
                      <div key={idx} className="audit-item">
                        <div className="audit-item-info">
                          <span className="audit-item-title">
                            该密码已用于{reuse.count}个网站
                          </span>
                          <span className="audit-item-reasons">
                            {reuse.entries.map(e => e.title).join('、')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {securityAudit.weakCount === 0 && securityAudit.reusedPasswords.length === 0 && expiryStats.expiredCount === 0 && expiryStats.expiringSoonCount === 0 && (
                <div className="audit-all-safe">
                  <ShieldCheck size={48} />
                  <p>所有密码均安全</p>
                  <span>没有发现弱密码、重复密码或过期密码</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>设置</h2>
              <button className="icon-btn" onClick={() => setShowSettings(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>
                  <Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  默认密码过期周期
                </label>
                <select
                  value={tempDefaultExpiryDays}
                  onChange={(e) => setTempDefaultExpiryDays(Number(e.target.value))}
                >
                  {EXPIRY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="settings-hint">新建密码时默认使用此过期周期</p>
              </div>

              <div className="form-group">
                <label>
                  <Clock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  提前提醒天数
                </label>
                <select
                  value={tempReminderDays}
                  onChange={(e) => setTempReminderDays(Number(e.target.value))}
                >
                  <option value={1}>提前 1 天</option>
                  <option value={3}>提前 3 天</option>
                  <option value={7}>提前 7 天</option>
                  <option value={14}>提前 14 天</option>
                  <option value={30}>提前 30 天</option>
                </select>
                <p className="settings-hint">密码到期前多少天开始提醒「该改密码了」</p>
              </div>

              <div className="settings-section">
                <h3 className="settings-section-title">关于密码历史</h3>
                <p className="settings-desc">
                  系统会记录您每次修改密码的时间，并保存密码的哈希值（非明文）。
                  为了安全，系统会阻止您使用最近 2 次使用过的旧密码。
                </p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowSettings(false)}>
                  取消
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={async () => {
                    await updateSettings({
                      defaultExpiryDays: tempDefaultExpiryDays,
                      expiryReminderDays: tempReminderDays
                    })
                    setShowSettings(false)
                  }}
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
