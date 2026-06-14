import { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { CATEGORIES, CategoryType } from '../types'
import PasswordItem from './PasswordItem'
import PasswordForm from './PasswordForm'
import PasswordGenerator from './PasswordGenerator'
import CategoryFilter from './CategoryFilter'
import SearchBar from './SearchBar'
import { Plus, LogOut, Settings, Download, Upload, KeyRound, X, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'
import { exportDataAsJSON, importDataFromJSON } from '../utils/storage'
import { performSecurityAudit } from '../utils/passwordStrength'

export default function PasswordList() {
  const { entries, lock, addEntry, updateEntry, deleteEntry } = useApp()
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [showSecurityAudit, setShowSecurityAudit] = useState(false)

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
              </div>

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

              {securityAudit.weakCount === 0 && securityAudit.reusedPasswords.length === 0 && (
                <div className="audit-all-safe">
                  <ShieldCheck size={48} />
                  <p>所有密码均安全</p>
                  <span>没有发现弱密码或重复使用的密码</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
