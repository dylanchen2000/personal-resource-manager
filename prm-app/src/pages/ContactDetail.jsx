import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Edit3, Save, MessageSquare, Clock, Cake, Heart, Sparkles, Gift, Send, Copy, AlertTriangle } from 'lucide-react'
import { getContact, saveContact, deleteContact, getInteractions, saveInteraction, deleteInteraction, getCircles, getFavorRecords, saveFavorRecord, deleteFavorRecord, FAVOR_TYPES, STRATEGY_TYPES, INTERACTION_TYPES, REMINDER_FREQUENCIES, FAVOR_RECORD_TYPES, getHealthColor, getContactDueInfo } from '../utils/store'
import { nameColor, nameInitial, timeAgo, formatDate, todayStr, formatAmount } from '../utils/helpers'
import { generateMessageDraft, generateGiftSuggestion, generateContactAdvice } from '../utils/ai'

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
  const [activeTab, setActiveTab] = useState('ai') // 'ai' | 'interactions' | 'favors'

  // AI状态
  const [advice, setAdvice] = useState(null)
  const [msgDraft, setMsgDraft] = useState(null)
  const [giftSugg, setGiftSugg] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [msgOccasion, setMsgOccasion] = useState('日常维护')
  const [giftOccasion, setGiftOccasion] = useState('日常')
  const [copied, setCopied] = useState(false)

  useEffect(() => { loadData() }, [contactId])

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
    // 自动加载AI建议
    if (c) {
      const adv = await generateContactAdvice(c, ints, favs)
      setAdvice(adv)
    }
  }

  async function handleSave() {
    await saveContact({ ...form })
    setEditing(false)
    await loadData()
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm('确定删除此联系人及其所有记录？')) return
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

  async function handleGenerateMessage() {
    setAiLoading(true)
    const result = await generateMessageDraft(contact, interactions, favorRecords, msgOccasion)
    setMsgDraft(result)
    setAiLoading(false)
  }

  async function handleGenerateGift() {
    setAiLoading(true)
    const result = await generateGiftSuggestion(contact, favorRecords, giftOccasion)
    setGiftSugg(result)
    setAiLoading(false)
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!contact) return <div className="empty-state"><p>加载中...</p></div>

  const iconForType = (type) => {
    const found = INTERACTION_TYPES.find(t => t.value === type)
    return found ? found.icon : ''
  }

  const healthColor = getHealthColor(contact)
  const dueInfo = getContactDueInfo(contact)
  const favorBalance = favorRecords.reduce((sum, r) => {
    const rec = FAVOR_RECORD_TYPES.find(t => t.value === r.type)
    if (!rec || !r.amount) return sum
    return rec.direction === 'out' ? sum - r.amount : sum + r.amount
  }, 0)

  const OCCASIONS = ['日常维护', '节日问候', '生日祝福', '有事请托']
  const GIFT_OCCASIONS = ['日常', '生日', '春节', '中秋', '感谢', '道歉']

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={14} /> 返回
      </button>

      {/* 联系人头部 */}
      <div className="card" style={{ marginBottom: 20, borderTop: `3px solid ${healthColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
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
                {dueInfo.status === 'overdue' ? `逾期${dueInfo.daysOverdue}天` : `${dueInfo.daysUntilDue}天后到期`}
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

        {/* AI关系摘要（始终显示） */}
        {advice && !editing && (
          <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 4, fontWeight: 600 }}>
              <Sparkles size={12} style={{ verticalAlign: 'middle' }} /> 关系诊断
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, flexShrink: 0,
                background: advice.healthScore >= 70 ? 'rgba(52,211,153,0.15)' : advice.healthScore >= 40 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                color: advice.healthScore >= 70 ? 'var(--green)' : advice.healthScore >= 40 ? 'var(--yellow)' : 'var(--red)',
              }}>
                {advice.healthScore}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-h)' }}>{advice.summary}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  推荐: {advice.channelAdvice} | {advice.nextAction}
                </div>
              </div>
            </div>
            {advice.warnings?.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                {advice.warnings.map((w, i) => (
                  <div key={i} style={{ color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <AlertTriangle size={11} /> {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {editing ? (
          <div>
            <div className="form-row">
              <div className="form-group"><label>手机</label><input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="form-group"><label>微信</label><input value={form.wechat || ''} onChange={e => setForm({ ...form, wechat: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>公司</label><input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
              <div className="form-group"><label>职位</label><input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>生日</label><input type="date" value={form.birthday || ''} onChange={e => setForm({ ...form, birthday: e.target.value })} /></div>
              <div className="form-group">
                <label>提醒频率</label>
                <select value={form.reminderFreq || ''} onChange={e => setForm({ ...form, reminderFreq: e.target.value || null })}>
                  {REMINDER_FREQUENCIES.map(f => <option key={f.label} value={f.value || ''}>{f.label}</option>)}
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
                    }}>{c.name}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>人情</label>
              <div className="option-group">
                {FAVOR_TYPES.map(f => <button key={f.label} className={`option-btn ${form.favor === f.value ? 'selected' : ''}`} onClick={() => setForm({ ...form, favor: f.value })}>{f.label}</button>)}
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
                {STRATEGY_TYPES.map(s => <button key={s.label} className={`option-btn ${form.strategy === s.value ? 'selected' : ''}`} onClick={() => setForm({ ...form, strategy: s.value })}>{s.label}</button>)}
              </div>
            </div>
            <div className="form-group">
              <label>认识经过</label>
              <textarea value={form.howWeMet || ''} onChange={e => setForm({ ...form, howWeMet: e.target.value })} rows={2} placeholder="在哪里认识的？谁介绍的？" />
            </div>
            <div className="form-group">
              <label>关心细节（孩子、宠物、爱好、偏好等）</label>
              <textarea value={form.details || ''} onChange={e => setForm({ ...form, details: e.target.value })} rows={2} placeholder="如：儿子叫小明，养了一只金毛叫Lucky..." />
            </div>
            <div className="form-group">
              <label>家庭信息</label>
              <textarea value={form.familyInfo || ''} onChange={e => setForm({ ...form, familyInfo: e.target.value })} rows={2} placeholder="配偶、子女、父母等" />
            </div>
            <div className="form-group">
              <label>礼物想法</label>
              <textarea value={form.giftIdeas || ''} onChange={e => setForm({ ...form, giftIdeas: e.target.value })} rows={2} placeholder="送礼灵感" />
            </div>
            <div className="form-group"><label>备注</label><textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="form-group"><label>私密备注（仅本地可见）</label><textarea value={form.privateNotes || ''} onChange={e => setForm({ ...form, privateNotes: e.target.value })} rows={2} /></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14 }}>
            {contact.phone && <div><span style={{ color: 'var(--text-dim)' }}>手机：</span>{contact.phone}</div>}
            {contact.wechat && <div><span style={{ color: 'var(--text-dim)' }}>微信：</span>{contact.wechat}</div>}
            {contact.birthday && <div><span style={{ color: 'var(--text-dim)' }}>生日：</span><Cake size={12} style={{ verticalAlign: 'middle' }} /> {contact.birthday}</div>}
            {contact.reminderFreq && <div><span style={{ color: 'var(--text-dim)' }}>提醒频率：</span>{contact.reminderFreq}</div>}
            <div>
              <span style={{ color: 'var(--text-dim)' }}>圈子：</span>
              {contact.circles?.length ? contact.circles.map(ci => <span key={ci} className="circle-tag" style={{ marginLeft: 4 }}>{ci}</span>) : '未分组'}
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>人情：</span>
              {contact.favor ? <span className={`badge ${contact.favor === '有恩于我' ? 'badge-favor-me' : 'badge-favor-them'}`} style={{ marginLeft: 4 }}>{contact.favor}</span> : '无'}
            </div>
            {contact.favorDetail && (
              <div style={{ gridColumn: '1/-1' }}>
                <span style={{ color: 'var(--text-dim)' }}>{contact.favor === '有恩于我' ? '他帮了我：' : '我帮了他：'}</span>{contact.favorDetail}
              </div>
            )}
            <div>
              <span style={{ color: 'var(--text-dim)' }}>策略：</span>
              {contact.strategy ? <span className={`badge badge-${contact.strategy === '加密' ? 'strengthen' : contact.strategy === '保持' ? 'maintain' : 'fadeout'}`} style={{ marginLeft: 4 }}>{contact.strategy}</span> : '未定'}
            </div>
            <div><span style={{ color: 'var(--text-dim)' }}>最后联系：</span>{contact.lastContact ? timeAgo(contact.lastContact) : '从未'}</div>
            {contact.howWeMet && (
              <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--text-dim)' }}>认识经过：</span>{contact.howWeMet}</div>
            )}
            {contact.details && (
              <div style={{ gridColumn: '1/-1', padding: '8px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
                <span style={{ color: 'var(--accent)', fontSize: 12 }}>关心细节：</span><span style={{ fontSize: 13 }}>{contact.details}</span>
              </div>
            )}
            {contact.familyInfo && (
              <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--text-dim)' }}>家庭信息：</span>{contact.familyInfo}</div>
            )}
            {contact.giftIdeas && (
              <div style={{ gridColumn: '1/-1', padding: '8px 12px', background: 'rgba(236,72,153,0.08)', borderRadius: 8, border: '1px solid rgba(236,72,153,0.2)' }}>
                <span style={{ color: 'var(--pink)', fontSize: 12 }}>礼物想法：</span><span style={{ fontSize: 13 }}>{contact.giftIdeas}</span>
              </div>
            )}
            {contact.notes && <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--text-dim)' }}>备注：</span>{contact.notes}</div>}
            {contact.privateNotes && (
              <div style={{ gridColumn: '1/-1', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>
                <span style={{ color: 'var(--red)', fontSize: 12 }}>私密备注：</span><span style={{ fontSize: 13 }}>{contact.privateNotes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab切换 */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'ai', label: 'AI助手', icon: Sparkles, count: null },
          { id: 'interactions', label: '互动记录', icon: MessageSquare, count: interactions.length },
          { id: 'favors', label: '人情账本', icon: Heart, count: favorRecords.length },
        ].map(tab => (
          <button key={tab.id}
            style={{ padding: '10px 20px', background: 'none', border: 'none', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-dim)', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={14} style={{ verticalAlign: 'middle' }} /> {tab.label} {tab.count !== null ? `(${tab.count})` : ''}
            {tab.id === 'favors' && favorBalance !== 0 && (
              <span style={{ marginLeft: 8, fontSize: 12, color: favorBalance > 0 ? 'var(--green)' : 'var(--red)' }}>
                {favorBalance > 0 ? '+' : ''}{formatAmount(favorBalance)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* AI助手Tab */}
      {activeTab === 'ai' && (
        <div>
          {/* 消息草稿生成器 */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, color: 'var(--text-h)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={15} color="var(--accent)" /> 消息草稿
            </h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {OCCASIONS.map(o => (
                <button key={o} className={`option-btn ${msgOccasion === o ? 'selected' : ''}`}
                  onClick={() => setMsgOccasion(o)}>{o}</button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleGenerateMessage} disabled={aiLoading} style={{ marginBottom: 12 }}>
              <Sparkles size={14} /> {aiLoading ? '生成中...' : '生成消息'}
            </button>

            {msgDraft && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-h)', whiteSpace: 'pre-wrap', paddingRight: 32 }}>
                    {msgDraft.message}
                  </div>
                  <button className="btn btn-sm" onClick={() => handleCopy(msgDraft.message)}
                    style={{ position: 'absolute', top: 0, right: 0 }}>
                    <Copy size={12} /> {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                  <span>渠道: <strong style={{ color: 'var(--accent)' }}>{msgDraft.channel}</strong></span>
                  <span>最佳时间: <strong style={{ color: 'var(--green)' }}>{msgDraft.bestTime}</strong></span>
                  {msgDraft.warmUpNeeded && <span style={{ color: 'var(--yellow)' }}>需要先寒暄预热</span>}
                </div>
                {msgDraft.tips?.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-dim)' }}>
                    {msgDraft.tips.map((t, i) => <div key={i} style={{ marginTop: 2 }}>- {t}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 礼物建议 */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, color: 'var(--text-h)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gift size={15} color="var(--pink)" /> 礼物推荐
            </h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {GIFT_OCCASIONS.map(o => (
                <button key={o} className={`option-btn ${giftOccasion === o ? 'selected' : ''}`}
                  onClick={() => setGiftOccasion(o)}>{o}</button>
              ))}
            </div>
            <button className="btn" onClick={handleGenerateGift} disabled={aiLoading} style={{ marginBottom: 12 }}>
              <Sparkles size={14} /> {aiLoading ? '生成中...' : '推荐礼物'}
            </button>

            {giftSugg && (
              <div>
                <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 8 }}>
                  参考金额: {giftSugg.amountGuide}
                </div>
                {giftSugg.suggestions?.map((s, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4,
                          background: s.type === '实体' ? 'rgba(59,130,246,0.1)' : s.type === '体验' ? 'rgba(16,185,129,0.1)' : s.type === '社交' ? 'rgba(236,72,153,0.1)' : 'rgba(139,92,246,0.1)',
                          color: s.type === '实体' ? 'var(--accent)' : s.type === '体验' ? 'var(--green)' : s.type === '社交' ? 'var(--pink)' : 'var(--purple)',
                        }}>{s.type}</span>
                        <strong style={{ marginLeft: 8, fontSize: 14, color: 'var(--text-h)' }}>{s.name}</strong>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{s.priceRange}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{s.reason}</div>
                  </div>
                ))}
                {giftSugg.tips?.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--yellow)', marginTop: 8 }}>
                    {giftSugg.tips.map((t, i) => <div key={i} style={{ marginTop: 2 }}>- {t}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 话题建议 */}
          {advice?.topicSuggestions?.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 15, color: 'var(--text-h)', marginBottom: 12 }}>话题建议</h3>
              {advice.topicSuggestions.map((t, i) => (
                <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 6, marginBottom: 6, fontSize: 13, color: 'var(--text-h)', border: '1px solid var(--border)' }}>
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 互动记录Tab */}
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
                      onClick={() => setInterForm({ ...interForm, type: t.value })}>{t.icon} {t.label}</button>
                  ))}
                </div>
              </div>
              <div className="form-group"><label>日期</label><input type="date" value={interForm.date || todayStr()} onChange={e => setInterForm({ ...interForm, date: e.target.value })} /></div>
              <div className="form-group"><label>内容</label><textarea value={interForm.content} onChange={e => setInterForm({ ...interForm, content: e.target.value })} placeholder="互动内容..." rows={2} /></div>
              <div className="btn-group">
                <button className="btn" onClick={() => setShowAddInteraction(false)}>取消</button>
                <button className="btn btn-primary" onClick={handleAddInteraction}>保存</button>
              </div>
            </div>
          )}

          {interactions.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}><MessageSquare size={36} /><p>暂无互动记录</p></div>
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
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteInteraction(i.id)} style={{ alignSelf: 'flex-start' }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 人情账本Tab */}
      {activeTab === 'favors' && (
        <>
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
                      onClick={() => setFavorForm({ ...favorForm, type: t.value })}>{t.icon} {t.label}</button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>金额/价值（元）</label><input type="number" value={favorForm.amount || ''} onChange={e => setFavorForm({ ...favorForm, amount: e.target.value })} placeholder="可选" /></div>
                <div className="form-group"><label>日期</label><input type="date" value={favorForm.date || todayStr()} onChange={e => setFavorForm({ ...favorForm, date: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>场合</label><input value={favorForm.occasion || ''} onChange={e => setFavorForm({ ...favorForm, occasion: e.target.value })} placeholder="如：春节、生日、搬家..." /></div>
              <div className="form-group"><label>描述</label><textarea value={favorForm.description || ''} onChange={e => setFavorForm({ ...favorForm, description: e.target.value })} placeholder="具体内容..." rows={2} /></div>
              <div className="form-group">
                <label>状态</label>
                <div className="option-group">
                  {['已完成', '待回馈', '已回馈'].map(s => (
                    <button key={s} className={`option-btn ${favorForm.status === s ? 'selected' : ''}`}
                      onClick={() => setFavorForm({ ...favorForm, status: s })}>{s}</button>
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
            <div className="empty-state" style={{ padding: 40 }}><Heart size={36} /><p>暂无人情记录</p></div>
          ) : (
            <div className="timeline">
              {favorRecords.map(r => {
                const rt = FAVOR_RECORD_TYPES.find(t => t.value === r.type)
                return (
                  <div key={r.id} className="timeline-item">
                    <div className="timeline-icon" style={{ background: rt?.direction === 'out' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)' }}>{rt?.icon || ''}</div>
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
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteFavorRecord(r.id)} style={{ alignSelf: 'flex-start' }}><Trash2 size={12} /></button>
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
