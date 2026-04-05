import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Users } from 'lucide-react'
import { getCircles, saveCircle, deleteCircle, getContacts } from '../utils/store'

export default function Circles({ onRefresh }) {
  const [circles, setCircles] = useState([])
  const [contacts, setContacts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [c, ct] = await Promise.all([getCircles(), getContacts()])
    setCircles(c)
    setContacts(ct)
  }

  function countMembers(circleName) {
    return contacts.filter(c => c.circles?.includes(circleName)).length
  }

  function openAdd() {
    setForm({ name: '', color: '#3b82f6', icon: '', desc: '' })
    setShowModal(true)
  }

  function openEdit(circle) {
    setForm({ ...circle })
    setShowModal(true)
  }

  async function handleSave() {
    await saveCircle({ ...form })
    setShowModal(false)
    setForm({})
    await loadData()
    onRefresh()
  }

  async function handleDelete(id) {
    if (!confirm('确定删除此圈子？（不会删除圈子中的联系人）')) return
    await deleteCircle(id)
    await loadData()
    onRefresh()
  }

  const PRESET_COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#f97316','#14b8a6','#6366f1','#84cc16']

  return (
    <div>
      <div className="page-header">
        <h2>圈子管理 ({circles.length})</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> 新建圈子</button>
      </div>

      <div className="circle-grid">
        {circles.map(c => (
          <div key={c.id} className="circle-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.color || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {c.icon || c.name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 16 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                <Users size={13} style={{ verticalAlign: 'middle' }} /> {countMembers(c.name)} 人
              </div>
              <div className="btn-group">
                <button className="btn btn-sm" onClick={() => openEdit(c)}><Edit3 size={12} /></button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{form.id ? '编辑圈子' : '新建圈子'}</h3>
            <div className="form-group">
              <label>圈子名称 *</label>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如：戈友圈、校友圈" />
            </div>
            <div className="form-group">
              <label>颜色</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESET_COLORS.map(color => (
                  <div key={color}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: color, cursor: 'pointer', border: form.color === color ? '3px solid #fff' : '3px solid transparent' }}
                    onClick={() => setForm({ ...form, color })}
                  />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea value={form.desc || ''} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="圈子描述..." rows={2} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name?.trim()}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
