import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Edit3, Save, MessageSquare, Clock, Cake, Heart } from 'lucide-react'
import { getContact, saveContact, deleteContact, getInteractions, saveInteraction, deleteInteraction, getCircles, getFavorRecords, saveFavorRecord, deleteFavorRecord, FAVOR_TYPES, STRATEGY_TYPES, INTERACTION_TYPES, REMINDER_FREQUENCIES, FAVOR_RECORD_TYPES, getHealthColor, getContactDueInfo } from '../utils/store'
import { nameColor, nameInitial, timeAgo, formatDate, todayStr, formatAmount } from '../utils/helpers'

export default function ContactDetail({ contactId, onBack, onRefresh }) {
  const [contact, setContact] = useState(null)
  const [interactions, setInteractions] = useState([])
  const [circles, setCircles] = useState([])
  const [favorRecords, setFavorRecords] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [showAddFavor, setShowAddFavor] = useState(false)
  const [interForm, setInterForm] = useState({ type: '微信', content: '', date: '' })
  const [favorForm, setFavorForm] = useState({ type: '我送礼', amount: '', occasion: '', description: '', date: '', status: '已完成' })
  const [activeTab, setActiveTab] = useState('interactions') // 'interactions' | 'favors'

  useEffect(() => {
    loadData()
  }, [contactId])

  async function loadData() {
    const [c, ints, cirs, favs] = await Promise.all([
      getContact(contactId),
      getInteractions(contactId),
      getCircles(),
      getFavorRecords(contactId),
    ])
    setContact(c)
    setInteractions(ints)
    setCircles(cirs)
    setFavorRecords(favs)
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

  async function handleAddFavorRecord() {
    await saveFavorRecord({
      contactId,
      type: favorForm.type,
      amount: favorForm.amount ? parseFloat(favorForm.amount) : null,
      occasion: favorForm.occasion,
      description: favorForm.description,
      date: favorForm.date ? new Date(favorForm.date).getTime() : Date.now(),
      status: favorForm.status,
    })
    setShowAddFavor(false)
    setFavorForm({ type: '我送礼', amount: '', occasion: '', description: '', date: '', status: '已完成' })
    await loadData()
  }

  async function handleDeleteFavorRecord(id) {
    await deleteFavorRecord(id)
    await loadData()
  }

  if (!contact) return <div className="empty-state"><p>加载中...</p></div>

  const iconForType = (type) => {
    const found = INTERACTION_TYPES.find(t => t.value === type)
    return found ? found.icon : '📝'
  }

  const healthColor = getHealthColor(contact)
  const dueInfo = getContactDueInfo(contact)

  // 人情净值计算
  const favorBalance = favorRecords.reduce((sum, r) => {
    const rec = FAVOR_RECORD_TYPES.find(t => t.value === r.type)
    if (!rec || !r.amount) return sum
    return rec.direction === 'out' ? sum - r.amount : sum + r.amount
  }, 0)

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={14} /> 返回联系人列表
      </button>

      <div className="card" style={{ marginBottom: 20, borderTop: `3px solid ${healthColor}` }}>
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
            {dueInfo.status !== 'none' && (
              <div style={{ fontSize: 12, color: healthColor, marginTop: 4 }}>
                <Clock size={12} style={{ verticalAlign: 'middle' }} />{' '}
                {dueInfo.status === 'overdue' ? `逾期${dueInfo.daysOverdue}天，该联系了` : `${dueInfo.daysUntilDue}天后需要联系`}
                {contact.reminderFreq ? ` (${contact.reminderFreq})` : ''}
              </div>
            )}
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
            <div className="form-row">
              <div className="form-group">
                <label>生日</label>
                <input type="date" value={form.birthday || ''} onChange={e => setForm({ ...form, birthday: e.target.value })} />
              </div>
              <div className="form-group">
                <label>提醒频率</label>
                <select value={form.reminderFreq || ''} onChange={e => setForm({ ...form, reminderFreq: e.target.value || null })}>
                  {REMINDER_FREQUENCIES.map(f => (
                    <option key={f.label} value={f.value || ''}>{f.label}</option>
                  ))}
                </select>
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
              <label>关心细节（孩子、宠物、爱好、偏好等）</label>
              <textarea value={form.details || ''} onChange={e => setForm({ ...form, details: e.target.value })} rows={2} placeholder="如：儿子叫小明，养了一只金毛叫Lucky，喜欢跑步..." />
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
            {contact.birthday && (
              <div><span style={{ color: 'var(--text-dim)' }}>生日：</span><Cake size={12} style={{ verticalAlign: 'middle' }} /> {contact.birthday}</div>
            )}
            {contact.reminderFreq && (
              <div><span style={{ color: 'var(--text-dim)' }}>提醒频率：</span>{contact.reminderFreq}</div>
            )}
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
            {contact.details && (
              <div style={{ gridColumn: '1/-1', padding: '8px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
                <span style={{ color: 'var(--accent)', fontSize: 12 }}>关心细节：</span>
                <span style={{ fontSize: 13 }}>{contact.details}</span>
              </div>
            )}
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

      {/* Tab 切换：互动记录 / 人情账本 */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <button
          style={{ padding: '10px 20px', background: 'none', border: 'none', color: activeTab === 'interactions' ? 'var(--accent)' : 'var(--text-dim)', borderBottom: activeTab === 'interactions' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          onClick={() => setActiveTab('interactions')}
        >
          <MessageSquare size={14} style={{ verticalAlign: 'middle' }} /> 互动记录 ({interactions.length})
        </button>
        <button
          style={{ padding: '10px 20px', background: 'none', border: 'none', color: activeTab === 'favors' ? 'var(--accent)' : 'var(--text-dim)', borderBottom: activeTab === 'favors' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          onClick={() => setActiveTab('favors')}
        >
          <Heart size={14} style={{ verticalAlign: 'middle' }} /> 人情账本 ({favorRecords.length})
          {favorBalance !== 0 && (
            <span style={{ marginLeft: 8, fontSize: 12, color: favorBalance > 0 ? 'var(--green)' : 'var(--red)' }}>
              净值: {favorBalance > 0 ? '+' : ''}{formatAmount(favorBalance)}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'interactions' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
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
        </>
      )}

      {activeTab === 'favors' && (
        <>
          {/* 人情净值摘要 */}
          {favorRecords.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div className="stat-card" style={{ flex: 1, padding: '12px 16px' }}>
                <div className="label" style={{ fontSize: 12 }}>我付出</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>
                  {formatAmount(favorRecords.filter(r => FAVOR_RECORD_TYPES.find(t => t.value === r.type)?.direction === 'out').reduce((s, r) => s + (r.amount || 0), 0))}
                </div>
              </div>
              <div className="stat-card" style={{ flex: 1, padding: '12px 16px' }}>
                <div className="label" style={{ fontSize: 12 }}>他付出</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>
                  {formatAmount(favorRecords.filter(r => FAVOR_RECORD_TYPES.find(t => t.value === r.type)?.direction === 'in').reduce((s, r) => s + (r.amount || 0), 0))}
                </div>
              </div>
              <div className="stat-card" style={{ flex: 1, padding: '12px 16px' }}>
                <div className="label" style={{ fontSize: 12 }}>人情净值</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: favorBalance > 0 ? 'var(--green)' : favorBalance < 0 ? 'var(--red)' : 'var(--text-dim)' }}>
                  {favorBalance > 0 ? '+' : ''}{formatAmount(favorBalance)}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-sm" onClick={() => setShowAddFavor(true)}><Plus size={14} /> 记录人情</button>
          </div>

          {showAddFavor && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>类型</label>
                <div className="option-group">
                  {FAVOR_RECORD_TYPES.map(t => (
                    <button key={t.value} className={`option-btn ${favorForm.type === t.value ? 'selected' : ''}`}
                      onClick={() => setFavorForm({ ...favorForm, type: t.value })}
                    >{t.icon} {t.label}</button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>金额/价值（元）</label>
                  <input type="number" value={favorForm.amount || ''} onChange={e => setFavorForm({ ...favorForm, amount: e.target.value })} placeholder="可选" />
                </div>
                <div className="form-group">
                  <label>日期</label>
                  <input type="date" value={favorForm.date || todayStr()} onChange={e => setFavorForm({ ...favorForm, date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>场合</label>
                <input value={favorForm.occasion || ''} onChange={e => setFavorForm({ ...favorForm, occasion: e.target.value })} placeholder="如：春节、生日、搬家..." />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea value={favorForm.description || ''} onChange={e => setFavorForm({ ...favorForm, description: e.target.value })} placeholder="具体内容..." rows={2} />
              </div>
              <div className="form-group">
                <label>状态</label>
                <div className="option-group">
                  {['已完成', '待回馈', '已回馈'].map(s => (
                    <button key={s} className={`option-btn ${favorForm.status === s ? 'selected' : ''}`}
                      onClick={() => setFavorForm({ ...favorForm, status: s })}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div className="btn-group">
                <button className="btn" onClick={() => setShowAddFavor(false)}>取消</button>
                <button className="btn btn-primary" onClick={handleAddFavorRecord}>保存</button>
              </div>
            </div>
          )}

          {favorRecords.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <Heart size={36} />
              <p>暂无人情记录</p>
            </div>
          ) : (
            <div className="timeline">
              {favorRecords.map(r => {
                const rt = FAVOR_RECORD_TYPES.find(t => t.value === r.type)
                return (
                  <div key={r.id} className="timeline-item">
                    <div className="timeline-icon" style={{ background: rt?.direction === 'out' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)' }}>
                      {rt?.icon || '📝'}
                    </div>
                    <div className="timeline-content">
                      <div className="type">
                        {r.type}
                        {r.amount && <span style={{ marginLeft: 8, color: rt?.direction === 'out' ? 'var(--red)' : 'var(--green)' }}>{formatAmount(r.amount)}元</span>}
                        {r.status && r.status !== '已完成' && <span className="badge" style={{ marginLeft: 8, color: r.status === '待回馈' ? 'var(--yellow)' : 'var(--green)', borderColor: r.status === '待回馈' ? 'var(--yellow)' : 'var(--green)' }}>{r.status}</span>}
                      </div>
                      {r.occasion && <div className="note" style={{ color: 'var(--text-dim)' }}>场合: {r.occasion}</div>}
                      {r.description && <div className="note">{r.description}</div>}
                      <div className="date">{r.date ? formatDate(r.date) : '未知日期'}</div>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteFavorRecord(r.id)} style={{ alignSelf: 'flex-start' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
