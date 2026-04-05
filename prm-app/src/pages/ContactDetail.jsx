import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Edit3, Save, Phone, MessageSquare } from 'lucide-react'
import { getContact, saveContact, deleteContact, getInteractions, saveInteraction, deleteInteraction, getCircles, FAVOR_TYPES, STRATEGY_TYPES, INTERACTION_TYPES } from '../utils/store'
import { nameColor, nameInitial, timeAgo, formatDate, todayStr } from '../utils/helpers'

export default function ContactDetail({ contactId, onBack, onRefresh }) {
  const [contact, setContact] = useState(null)
  const [interactions, setInteractions] = useState([])
  const [circles, setCircles] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [interForm, setInterForm] = useState({ type: '微信', content: '', date: '' })

  useEffect(() => {
    loadData()
  }, [contactId])

  async function loadData() {
    const [c, ints, cirs] = await Promise.all([
      getContact(contactId),
      getInteractions(contactId),
      getCircles(),
    ])
    setContact(c)
    setInteractions(ints)
    setCircles(cirs)
    setForm(c || {})
  }

  async function handleSave() {
    await saveContact({ ...form })
    setEditing(false)
    await loadData()
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm('确定删除此联系人及其所有互动记录？')) return
    await deleteContact(contactId)
    onRefresh()
    onBack()
  }

  async function handleAddInteraction() {
    await saveInteraction({
      contactId,
      type: interForm.type,
      content: interForm.content,
      date: interForm.date ? new Date(interForm.date).getTime() : Date.now(),
    })
    setShowAddInteraction(false)
    setInterForm({ type: '微信', content: '', date: '' })
    await loadData()
    onRefresh()
  }

  async function handleDeleteInteraction(id) {
    await deleteInteraction(id)
    await loadData()
  }

  if (!contact) return <div className="empty-state"><p>加载中...</p></div>

  const iconForType = (type) => {
    const found = INTERACTION_TYPES.find(t => t.value === type)
    return found ? found.icon : '📝'
  }

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={14} /> 返回联系人列表
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="contact-avatar" style={{ background: nameColor(contact.name), width: 56, height: 56, fontSize: 22 }}>
            {nameInitial(contact.name)}
          </div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} style={{ fontSize: 20, fontWeight: 700 }} />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-h)' }}>{contact.name}</div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>
              {[contact.company, contact.title].filter(Boolean).join(' | ')}
            </div>
          </div>
          <div className="btn-group">
            {editing ? (
              <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> 保存</button>
            ) : (
              <button className="btn" onClick={() => setEditing(true)}><Edit3 size={14} /> 编辑</button>
            )}
            <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={14} /></button>
          </div>
        </div>

        {editing ? (
          <div>
            <div className="form-row">
              <div className="form-group">
                <label>手机</label>
                <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>微信</label>
                <input value={form.wechat || ''} onChange={e => setForm({ ...form, wechat: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>公司</label>
                <input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="form-group">
                <label>职位</label>
                <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>所属圈子</label>
              <div className="option-group">
                {circles.map(c => (
                  <button key={c.id} className={`option-btn ${form.circles?.includes(c.name) ? 'selected' : ''}`}
                    style={form.circles?.includes(c.name) ? { background: c.color, borderColor: c.color } : {}}
                    onClick={() => {
                      const has = form.circles?.includes(c.name)
                      setForm({ ...form, circles: has ? form.circles.filter(x => x !== c.name) : [...(form.circles || []), c.name] })
                    }}
                  >{c.name}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>人情</label>
              <div className="option-group">
                {FAVOR_TYPES.map(f => (
                  <button key={f.label} className={`option-btn ${form.favor === f.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, favor: f.value })}
                  >{f.label}</button>
                ))}
              </div>
            </div>
            {form.favor && (
              <div className="form-group">
                <label>{form.favor === '有恩于我' ? '他帮了我什么' : '我帮了他什么'}</label>
                <textarea value={form.favorDetail || ''} onChange={e => setForm({ ...form, favorDetail: e.target.value })} rows={2} />
              </div>
            )}
            <div className="form-group">
              <label>关系策略</label>
              <div className="option-group">
                {STRATEGY_TYPES.map(s => (
                  <button key={s.label} className={`option-btn ${form.strategy === s.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, strategy: s.value })}
                  >{s.label}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
              <label>私密备注（仅本地可见）</label>
              <textarea value={form.privateNotes || ''} onChange={e => setForm({ ...form, privateNotes: e.target.value })} rows={2} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14 }}>
            {contact.phone && <div><span style={{ color: 'var(--text-dim)' }}>手机：</span>{contact.phone}</div>}
            {contact.wechat && <div><span style={{ color: 'var(--text-dim)' }}>微信：</span>{contact.wechat}</div>}
            <div>
              <span style={{ color: 'var(--text-dim)' }}>圈子：</span>
              {contact.circles?.length ? contact.circles.map(ci => (
                <span key={ci} className="circle-tag" style={{ marginLeft: 4 }}>{ci}</span>
              )) : '未分组'}
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>人情：</span>
              {contact.favor ? (
                <span className={`badge ${contact.favor === '有恩于我' ? 'badge-favor-me' : 'badge-favor-them'}`} style={{ marginLeft: 4 }}>{contact.favor}</span>
              ) : '无'}
            </div>
            {contact.favorDetail && (
              <div style={{ gridColumn: '1/-1' }}>
                <span style={{ color: 'var(--text-dim)' }}>{contact.favor === '有恩于我' ? '他帮了我：' : '我帮了他：'}</span>
                {contact.favorDetail}
              </div>
            )}
            <div>
              <span style={{ color: 'var(--text-dim)' }}>策略：</span>
              {contact.strategy ? (
                <span className={`badge badge-${contact.strategy === '加密' ? 'strengthen' : contact.strategy === '保持' ? 'maintain' : 'fadeout'}`} style={{ marginLeft: 4 }}>{contact.strategy}</span>
              ) : '未定'}
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>最后联系：</span>
              {contact.lastContact ? timeAgo(contact.lastContact) : '从未'}
            </div>
            {contact.notes && <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--text-dim)' }}>备注：</span>{contact.notes}</div>}
            {contact.privateNotes && (
              <div style={{ gridColumn: '1/-1', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>
                <span style={{ color: 'var(--red)', fontSize: 12 }}>私密备注：</span>
                <span style={{ fontSize: 13 }}>{contact.privateNotes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 互动记录 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, color: 'var(--text-h)' }}>互动记录 ({interactions.length})</h3>
        <button className="btn btn-sm" onClick={() => setShowAddInteraction(true)}><Plus size={14} /> 记录互动</button>
      </div>

      {showAddInteraction && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label>互动类型</label>
            <div className="option-group">
              {INTERACTION_TYPES.map(t => (
                <button key={t.value} className={`option-btn ${interForm.type === t.value ? 'selected' : ''}`}
                  onClick={() => setInterForm({ ...interForm, type: t.value })}
                >{t.icon} {t.label}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>日期</label>
            <input type="date" value={interForm.date || todayStr()} onChange={e => setInterForm({ ...interForm, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>内容</label>
            <textarea value={interForm.content} onChange={e => setInterForm({ ...interForm, content: e.target.value })} placeholder="互动内容..." rows={2} />
          </div>
          <div className="btn-group">
            <button className="btn" onClick={() => setShowAddInteraction(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleAddInteraction}>保存</button>
          </div>
        </div>
      )}

      {interactions.length === 0 ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <MessageSquare size={36} />
          <p>暂无互动记录</p>
        </div>
      ) : (
        <div className="timeline">
          {interactions.map(i => (
            <div key={i.id} className="timeline-item">
              <div className="timeline-icon">{iconForType(i.type)}</div>
              <div className="timeline-content">
                <div className="type">{i.type}</div>
                {i.content && <div className="note">{i.content}</div>}
                <div className="date">{i.date ? formatDate(i.date) : '未知日期'}</div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteInteraction(i.id)} style={{ alignSelf: 'flex-start' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
