import { useState, useEffect } from 'react'
import { Plus, Search, Users, Sparkles } from 'lucide-react'
import { getContacts, getCircles, saveContact, deleteContact, FAVOR_TYPES, STRATEGY_TYPES, REMINDER_FREQUENCIES, getHealthColor, getContactDueInfo } from '../utils/store'
import { nameColor, nameInitial, timeAgo } from '../utils/helpers'

export default function Contacts({ onOpenContact, onRefresh }) {
  const [contacts, setContacts] = useState([])
  const [circles, setCircles] = useState([])
  const [search, setSearch] = useState('')
  const [filterCircle, setFilterCircle] = useState(null)
  const [filterFavor, setFilterFavor] = useState(null)
  const [filterStrategy, setFilterStrategy] = useState(null)
  const [sortBy, setSortBy] = useState('due') // 'due' | 'name' | 'lastContact'
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
    if (search && !c.name?.includes(search) && !c.nickname?.includes(search) && !c.company?.includes(search) && !c.phone?.includes(search)) return false
    if (filterCircle && !c.circles?.includes(filterCircle)) return false
    if (filterFavor && c.favor !== filterFavor) return false
    if (filterStrategy && c.strategy !== filterStrategy) return false
    return true
  })

  // 排序
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'due') {
      // 逾期的排前面，然后按即将到期
      const dueA = getContactDueInfo(a)
      const dueB = getContactDueInfo(b)
      const scoreA = dueA.status === 'overdue' ? -1000 + dueA.daysOverdue : dueA.status === 'soon' ? -500 + (dueA.daysUntilDue || 0) : dueA.dueDate || Infinity
      const scoreB = dueB.status === 'overdue' ? -1000 + dueB.daysOverdue : dueB.status === 'soon' ? -500 + (dueB.daysUntilDue || 0) : dueB.dueDate || Infinity
      return scoreA - scoreB
    }
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    if (sortBy === 'lastContact') return (a.lastContact || 0) - (b.lastContact || 0)
    return 0
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
    setForm({ name: '', nickname: '', phone: '', wechat: '', company: '', title: '', circles: [], favor: null, strategy: null, notes: '', privateNotes: '', favorDetail: '', reminderFreq: null, birthday: '', details: '', howWeMet: '', giftIdeas: '', familyInfo: '' })
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
        <div className="filter-chips" style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', marginRight: 4 }}>排序:</span>
          {[['due','按紧急度'],['name','按姓名'],['lastContact','按联系时间']].map(([val, label]) => (
            <button key={val} className={`chip ${sortBy === val ? 'active' : ''}`} onClick={() => setSortBy(val)}>{label}</button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p>{contacts.length === 0 ? '还没有联系人' : '没有匹配结果'}</p>
        </div>
      ) : (
        <div className="contact-list">
          {sorted.map(c => {
            const healthColor = getHealthColor(c)
            return (
              <div key={c.id} className="contact-row" onClick={() => onOpenContact(c.id)}>
                {/* 健康度色条 */}
                <div style={{ width: 4, height: 42, borderRadius: 2, background: healthColor, flexShrink: 0 }} />
                <div className="contact-avatar" style={{ background: nameColor(c.name) }}>
                  {nameInitial(c.name)}
                </div>
                <div className="contact-info">
                  <div className="name">{c.nickname || c.name}{c.nickname && <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 6 }}>({c.name})</span>}</div>
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
                  <div>{c.lastContact ? timeAgo(c.lastContact) : '从未联系'}</div>
                  {c.reminderFreq && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{c.reminderFreq}</div>}
                </div>
                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onOpenContact(c.id) }}
                  style={{ flexShrink: 0, fontSize: 11, color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)' }}
                  title="点击查看AI关系诊断和消息草稿">
                  <Sparkles size={12} /> AI
                </button>
              </div>
            )
          })}
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
                <label>实际称呼</label>
                <input value={form.nickname || ''} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="如：陶老师、飞哥、老陶" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>手机</label>
                <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="手机号" />
              </div>
              <div className="form-group">
                <label>微信</label>
                <input value={form.wechat || ''} onChange={e => setForm({ ...form, wechat: e.target.value })} placeholder="微信号" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>公司</label>
                <input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="所在公司" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>职位</label>
                <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="职位/角色" />
              </div>
              <div className="form-group">
                <label>生日</label>
                <input type="date" value={form.birthday || ''} onChange={e => setForm({ ...form, birthday: e.target.value })} />
              </div>
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
              <label>提醒频率</label>
              <div className="option-group">
                {REMINDER_FREQUENCIES.map(f => (
                  <button
                    key={f.label}
                    className={`option-btn ${form.reminderFreq === f.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, reminderFreq: f.value })}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>认识经过</label>
              <textarea value={form.howWeMet || ''} onChange={e => setForm({ ...form, howWeMet: e.target.value })} placeholder="在哪里认识的？谁介绍的？" rows={2} />
            </div>

            <div className="form-group">
              <label>关心细节（孩子、宠物、爱好、偏好等）</label>
              <textarea value={form.details || ''} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="如：儿子叫小明，养了一只金毛叫Lucky，喜欢跑步..." rows={2} />
            </div>

            <div className="form-group">
              <label>家庭信息</label>
              <textarea value={form.familyInfo || ''} onChange={e => setForm({ ...form, familyInfo: e.target.value })} placeholder="配偶、子女、父母等家庭信息..." rows={2} />
            </div>

            <div className="form-group">
              <label>礼物想法</label>
              <textarea value={form.giftIdeas || ''} onChange={e => setForm({ ...form, giftIdeas: e.target.value })} placeholder="送礼灵感：他/她喜欢什么？忌讳什么？" rows={2} />
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
