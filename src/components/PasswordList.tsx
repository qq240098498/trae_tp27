import { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { CATEGORIES, CategoryType } from '../types'
import PasswordItem from './PasswordItem'
import PasswordForm from './PasswordForm'
import CategoryFilter from './CategoryFilter'
import SearchBar from './SearchBar'
import { Plus, LogOut, Settings, Download, Upload } from 'lucide-react'
import { exportDataAsJSON, importDataFromJSON } from '../utils/storage'

export default function PasswordList() {
  const { entries, lock, addEntry, updateEntry, deleteEntry } = useApp()
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

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

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">密码管家</h1>
        </div>
        <div className="header-right">
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
    </div>
  )
}
