import { useState, useEffect } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { getContacts, getCircles, saveContact, deleteContact, FAVOR_TYPES, STRATEGY_TYPES } from '../utils/store'
import { nameColor, nameInitial, timeAgo } from '../utils/helpers'

export default function Contacts({ onOpenContact, onRefresh }) {
  const [contacts, setContacts] = useState([])
  const [circles, setCircles] = useState([])
  const [search, setSearch] = useState('')
  const [filterCircle, setFilterCircle] = useState(null)
  const [filterFavor, setFilterFavor] = useState(null)
  const [filterStrategy, setFilterStrategy] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [c, ci] = await Promise.all([getContacts(), getCircles()])
    setContacts(c)
    setCircles(ci)
  }

  const filtered = contacts.filter(c => {
    if (search && !c.name?.includes(search) && !c.company?.includes(search) && !c.phone?.includes(search)) return false
    if (filterCircle && !c.circles?.includes(filterCircle)) return false
    if (filterFavor && c.favor !== filterFavor) return false
    if (filterStrategy && c.strategy !== filterStrategy) return false
    return true
  })

  async function handleSave() {
    await saveContact({ ...form })
    setShowModal(false)
    setForm({})
    await loadData()
    onRefresh()
  }

  async function handleDelete(id) {
    if (!confirm('确定删除此联系人？')) return
    await deleteContact(id)
    await loadData()
    onRefresh()
  }

  function openAdd() {
    setForm({ name: '', phone: '', wechat: '', company: '', title: '', circles: [], favor: null, strategy: null, notes: '', privateNotes: '', favorDetail: '' })
    setShowModal(true)
  }

  return (
    <div>
      <div className="page-header">
        <h2>联系人 ({contacts.length})</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> 添加</button>
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative', flex: '0 0 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-dim)' }} />
          <input
            placeholder="搜索姓名/公司/电话..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>
        <div className="filter-chips">
          <button className={`chip ${!filterCircle ? 'active' : ''}`} onClick={() => setFilterCircle(null)}>全部圈子</button>
          {circles.map(c => (
            <button key={c.id} className={`chip ${filterCircle === c.name ? 'active' : ''}`} onClick={() => setFilterCircle(filterCircle === c.name ? null : c.name)}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="filter-chips">
          <button className={`chip ${!filterFavor ? 'active' : ''}`} onClick={() => setFilterFavor(null)}>全部人情</button>
          {FAVOR_TYPES.filter(f => f.value).map(f => (
            <button key={f.value} className={`chip ${filterFavor === f.value ? 'active' : ''}`} onClick={() => setFilterFavor(filterFavor === f.value ? null : f.value)}>{f.label}</button>
          ))}
        </div>
        <div className="filter-chips">
          <button className={`chip ${!filterStrategy ? 'active' : ''}`} onClick={() => setFilterStrategy(null)}>全部策略</button>
          {STRATEGY_TYPES.filter(s => s.value).map(s => (
            <button key={s.value} className={`chip ${filterStrategy === s.value ? 'active' : ''}`} onClick={() => setFilterStrategy(filterStrategy === s.value ? null : s.value)}>{s.label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p>{contacts.length === 0 ? '还没有联系人' : '没有匹配结果'}</p>
        </div>
      ) : (
        <div className="contact-list">
          {filtered.map(c => (
            <div key={c.id} className="contact-row" onClick={() => onOpenContact(c.id)}>
              <div className="contact-avatar" style={{ background: nameColor(c.name) }}>
                {nameInitial(c.name)}
              </div>
              <div className="contact-info">
                <div className="name">{c.name}</div>
                <div className="sub">{[c.company, c.title].filter(Boolean).join(' | ')}</div>
              </div>
              <div className="contact-tags">
                {c.circles?.map(ci => (
                  <span key={ci} className="circle-tag" style={{ borderColor: circles.find(x => x.name === ci)?.color || 'var(--border)' }}>
                    {ci}
                  </span>
                ))}
                {c.favor === '有恩于我' && <span className="badge badge-favor-me">有恩于我</span>}
                {c.favor === '有恩于他' && <span className="badge badge-favor-them">有恩于他</span>}
                {c.strategy === '加密' && <span className="badge badge-strengthen">加密</span>}
                {c.strategy === '保持' && <span className="badge badge-maintain">保持</span>}
                {c.strategy === '淡出' && <span className="badge badge-fadeout">淡出</span>}
              </div>
              <div className="contact-meta">
                {c.lastContact ? timeAgo(c.lastContact) : '从未联系'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加联系人模态框 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>添加联系人</h3>
            <div className="form-row">
              <div className="form-group">
                <label>姓名 *</label>
                <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="姓名" />
              </div>
              <div className="form-group">
                <label>手机</label>
                <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="手机号" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>微信</label>
                <input value={form.wechat || ''} onChange={e => setForm({ ...form, wechat: e.target.value })} placeholder="微信号" />
              </div>
              <div className="form-group">
                <label>公司</label>
                <input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="所在公司" />
              </div>
            </div>
            <div className="form-group">
              <label>职位</label>
              <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="职位/角色" />
            </div>

            <div className="form-group">
              <label>所属圈子</label>
              <div className="option-group">
                {circles.map(c => (
                  <button
                    key={c.id}
                    className={`option-btn ${form.circles?.includes(c.name) ? 'selected' : ''}`}
                    style={form.circles?.includes(c.name) ? { background: c.color, borderColor: c.color } : {}}
                    onClick={() => {
                      const has = form.circles?.includes(c.name)
                      setForm({ ...form, circles: has ? form.circles.filter(x => x !== c.name) : [...(form.circles || []), c.name] })
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>人情</label>
              <div className="option-group">
                {FAVOR_TYPES.map(f => (
                  <button
                    key={f.label}
                    className={`option-btn ${form.favor === f.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, favor: f.value })}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {form.favor && (
              <div className="form-group">
                <label>{form.favor === '有恩于我' ? '他帮了我什么' : '我帮了他什么'}</label>
                <textarea value={form.favorDetail || ''} onChange={e => setForm({ ...form, favorDetail: e.target.value })} placeholder="具体描述..." rows={2} />
              </div>
            )}

            <div className="form-group">
              <label>关系策略</label>
              <div className="option-group">
                {STRATEGY_TYPES.map(s => (
                  <button
                    key={s.label}
                    className={`option-btn ${form.strategy === s.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, strategy: s.value })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>备注（公开）</label>
              <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="一般备注..." rows={2} />
            </div>

            <div className="form-group">
              <label>私密备注（仅本地可见）</label>
              <textarea value={form.privateNotes || ''} onChange={e => setForm({ ...form, privateNotes: e.target.value })} placeholder="敏感信息，不会同步..." rows={2} />
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
