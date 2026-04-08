import { useState, useEffect } from 'react'
import { AlertTriangle, HeartHandshake, Shield, Users, CircleDot, MessageSquare, Clock, Cake, Zap, TrendingUp, Sparkles, ChevronRight, UserPlus } from 'lucide-react'
import { getStats, getCircles, getHealthColor, getContactDueInfo, bulkSnooze } from '../utils/store'
import { nameColor, nameInitial, timeAgo } from '../utils/helpers'
import { getNextFestival, generateMessageDraft } from '../utils/ai'

export default function Dashboard({ onOpenContact, onNavigate }) {
  const [stats, setStats] = useState(null)
  const [circles, setCircles] = useState([])
  const [snoozing, setSnoozing] = useState(false)
  const [blessingFor, setBlessingFor] = useState(null) // {contactId, message, loading}


  useEffect(() => {
    getStats().then(setStats)
    getCircles().then(setCircles)
  }, [])

  async function handleBulkSnooze() {
    if (!confirm('将所有积压提醒均匀分散到未来14天？')) return
    setSnoozing(true)
    const count = await bulkSnooze(14)
    alert(`已分散 ${count} 条提醒到未来14天`)
    setSnoozing(false)
    getStats().then(setStats)
  }

  async function handleBlessing(contact) {
    setBlessingFor({ contactId: contact.id, message: '', loading: true })
    try {
      const result = await generateMessageDraft(contact, [], [], '生日祝福')
      setBlessingFor({ contactId: contact.id, message: result.message, tips: result.tips, channel: result.channel, loading: false })
    } catch {
      const name = contact.nickname || contact.name || '朋友'
      setBlessingFor({ contactId: contact.id, message: `${name}，生日快乐！祝你万事如意，心想事成！`, tips: [], loading: false })
    }
  }

  function copyBlessing() {
    if (blessingFor?.message) {
      navigator.clipboard.writeText(blessingFor.message).then(() => {
        alert('已复制到剪贴板')
      }).catch(() => {
        // fallback: select text
        const ta = document.createElement('textarea')
        ta.value = blessingFor.message
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        alert('已复制到剪贴板')
      })
    }
  }

  if (!stats) return <div className="empty-state"><p>加载中...</p></div>

  const festival = getNextFestival()
  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const greeting = today.getHours() < 12 ? '早上好' : today.getHours() < 18 ? '下午好' : '晚上好'

  // 关系健康分布
  const healthGreen = stats.contacts.filter(c => getHealthColor(c) === '#34d399').length
  const healthYellow = stats.contacts.filter(c => getHealthColor(c) === '#fbbf24').length
  const healthRed = stats.contacts.filter(c => getHealthColor(c) === '#f87171').length
  const healthGrey = stats.contacts.filter(c => getHealthColor(c) === '#64748b').length

  // 圈子分布数据
  const circleDistribution = circles.map(ci => ({
    ...ci,
    count: stats.contacts.filter(c => c.circles?.includes(ci.name)).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)

  const displayName = (c) => c.nickname || c.name

  return (
    <div>
      {/* 顶部问候区 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-h)', marginBottom: 4 }}>
          {greeting}，道俊
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-dim)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>{dateStr} {weekDays[today.getDay()]}</span>
          {festival.daysAway <= 30 && (
            <span style={{ color: 'var(--pink)', fontSize: 13 }}>
              {festival.name}还有{festival.daysAway}天
            </span>
          )}
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="dash-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <div className="dash-metric" onClick={() => onNavigate('contacts')} style={{ cursor: 'pointer' }}>
          <div className="dash-metric-icon" style={{ background: 'rgba(96,165,250,0.12)', color: 'var(--accent)' }}><Users size={20} /></div>
          <div className="dash-metric-num">{stats.totalContacts}</div>
          <div className="dash-metric-label">联系人</div>
        </div>
        <div className="dash-metric">
          <div className="dash-metric-icon" style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--green)' }}><MessageSquare size={20} /></div>
          <div className="dash-metric-num">{stats.totalInteractions}</div>
          <div className="dash-metric-label">互动记录</div>
        </div>
        <div className="dash-metric" onClick={() => onNavigate('favors')} style={{ cursor: 'pointer' }}>
          <div className="dash-metric-icon" style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--yellow)' }}><HeartHandshake size={20} /></div>
          <div className="dash-metric-num">{stats.favorMe}</div>
          <div className="dash-metric-label">有恩于我</div>
        </div>
        <div className="dash-metric" onClick={() => onNavigate('favors')} style={{ cursor: 'pointer' }}>
          <div className="dash-metric-icon" style={{ background: 'rgba(167,139,250,0.12)', color: 'var(--purple)' }}><HeartHandshake size={20} /></div>
          <div className="dash-metric-num">{stats.favorThem}</div>
          <div className="dash-metric-label">有恩于他</div>
        </div>
      </div>

      {/* 关系健康度 + 策略分布 */}
      <div className="dash-cards-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* 健康度分布 */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={15} color="var(--accent)" /> 关系健康度
          </div>
          {stats.totalContacts > 0 ? (
            <>
              <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                {healthGreen > 0 && <div style={{ flex: healthGreen, background: 'var(--green)' }} />}
                {healthYellow > 0 && <div style={{ flex: healthYellow, background: 'var(--yellow)' }} />}
                {healthRed > 0 && <div style={{ flex: healthRed, background: 'var(--red)' }} />}
                {healthGrey > 0 && <div style={{ flex: healthGrey, background: '#64748b' }} />}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-dim)' }}>
                <span><span style={{ color: 'var(--green)' }}>●</span> 良好 {healthGreen}</span>
                <span><span style={{ color: 'var(--yellow)' }}>●</span> 需关注 {healthYellow}</span>
                <span><span style={{ color: 'var(--red)' }}>●</span> 疏远 {healthRed}</span>
                {healthGrey > 0 && <span><span style={{ color: '#64748b' }}>●</span> 淡出 {healthGrey}</span>}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>添加联系人后显示</div>
          )}
        </div>

        {/* 策略分布 */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={15} color="var(--green)" /> 关系策略
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: 'rgba(52,211,153,0.08)', borderRadius: 8, border: '1px solid rgba(52,211,153,0.2)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{stats.strengthen}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>加密</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: 'rgba(96,165,250,0.08)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{stats.maintain}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>保持</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: 'rgba(100,116,139,0.08)', borderRadius: 8, border: '1px solid rgba(100,116,139,0.2)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-dim)' }}>{stats.fadeOut}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>淡出</div>
            </div>
          </div>
        </div>
      </div>

      {/* 今日生日 */}
      {stats.birthdayToday.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--pink)', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Cake size={16} color="var(--pink)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)' }}>今日生日</span>
          </div>
          {stats.birthdayToday.map(c => (
            <div key={c.id} onClick={() => onOpenContact(c.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: 'pointer' }}>
              <div className="contact-avatar" style={{ background: nameColor(c.name), width: 36, height: 36, fontSize: 14 }}>{nameInitial(c.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14 }}>{displayName(c)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.birthday} {c.circles?.length ? `| ${c.circles.join(', ')}` : ''}</div>
              </div>
              <button className="btn btn-sm" style={{ fontSize: 11, color: 'var(--pink)', borderColor: 'rgba(244,114,182,0.3)' }}
                onClick={(e) => { e.stopPropagation(); handleBlessing(c) }}>
                <Sparkles size={11} /> {blessingFor?.contactId === c.id && blessingFor.loading ? '生成中...' : '生成祝福'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 即将生日（7天内） */}
      {stats.birthdaySoon.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--purple)', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Cake size={16} color="var(--purple)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)' }}>近期生日（7天内）</span>
          </div>
          {stats.birthdaySoon.map(c => (
            <div key={c.id} onClick={() => onOpenContact(c.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: 'pointer' }}>
              <div className="contact-avatar" style={{ background: nameColor(c.name), width: 36, height: 36, fontSize: 14 }}>{nameInitial(c.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14 }}>{displayName(c)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>生日 {c.birthday}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 今日待联系 */}
      {stats.todayDue.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="var(--accent)" />
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-h)' }}>待联系</span>
              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: 'rgba(96,165,250,0.15)', color: 'var(--accent)' }}>{stats.todayDue.length}</span>
            </div>
            {stats.todayDue.length > 5 && (
              <button className="btn btn-sm" onClick={handleBulkSnooze} disabled={snoozing}>
                <Zap size={12} /> {snoozing ? '分散中...' : '一键分散'}
              </button>
            )}
          </div>
          {stats.todayDue.slice(0, 10).map(c => {
            const due = getContactDueInfo(c)
            const healthColor = getHealthColor(c)
            return (
              <div key={c.id} className="reminder-item" onClick={() => onOpenContact(c.id)} style={{ cursor: 'pointer' }}>
                <div style={{ width: 4, height: 40, borderRadius: 2, background: healthColor, flexShrink: 0 }} />
                <div className="contact-avatar" style={{ background: nameColor(c.name), width: 36, height: 36, fontSize: 14 }}>{nameInitial(c.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {displayName(c)}
                    {c.favor === '有恩于我' && <span className="badge badge-favor-me" style={{ fontSize: 11, padding: '1px 6px' }}>恩</span>}
                    {c.strategy === '加密' && <span className="badge badge-strengthen" style={{ fontSize: 11, padding: '1px 6px' }}>密</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[c.company, c.circles?.join('/')].filter(Boolean).join(' | ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, color: healthColor, fontWeight: 600 }}>
                    {due.status === 'overdue' ? `逾期${due.daysOverdue}天` : `${due.daysUntilDue}天后`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {c.lastContact ? timeAgo(c.lastContact) : '从未联系'}
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-dim)" />
              </div>
            )
          })}
        </div>
      )}

      {/* 人情提醒 + 需要关注 */}
      <div className="dash-cards-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* 人情提醒 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <HeartHandshake size={16} color="var(--yellow)" />
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-h)' }}>人情待回馈</span>
          </div>
          {stats.favorReminders.length > 0 ? (
            stats.favorReminders.slice(0, 5).map(c => (
              <div key={c.id} className="reminder-item" onClick={() => onOpenContact(c.id)} style={{ cursor: 'pointer', marginBottom: 6 }}>
                <div className="contact-avatar" style={{ background: nameColor(c.name), width: 32, height: 32, fontSize: 13 }}>{nameInitial(c.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 13 }}>{displayName(c)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.favorDetail || '记得回馈'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-dim)', padding: '16px 0' }}>暂无人情待回馈</div>
          )}
        </div>

        {/* 需要加强 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color="var(--orange)" />
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-h)' }}>需要加强联系</span>
          </div>
          {stats.needAttention.length > 0 ? (
            stats.needAttention.slice(0, 5).map(c => (
              <div key={c.id} className="reminder-item" onClick={() => onOpenContact(c.id)} style={{ cursor: 'pointer', marginBottom: 6 }}>
                <div className="contact-avatar" style={{ background: nameColor(c.name), width: 32, height: 32, fontSize: 13 }}>{nameInitial(c.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 13 }}>{displayName(c)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {c.lastContact ? timeAgo(c.lastContact) : '从未联系'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-dim)', padding: '16px 0' }}>暂无需加强联系的人</div>
          )}
        </div>
      </div>

      {/* 圈子分布 */}
      {circleDistribution.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CircleDot size={16} color="var(--purple)" />
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-h)' }}>圈子分布</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {circleDistribution.map(ci => (
              <div key={ci.id} onClick={() => onNavigate('circles')}
                style={{ padding: '8px 16px', background: 'var(--bg-card)', border: `1px solid ${ci.color}40`, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 14 }}>{ci.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text-h)' }}>{ci.name}</span>
                <span style={{ fontSize: 12, color: ci.color, fontWeight: 700 }}>{ci.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 祝福弹窗 */}
      {blessingFor && !blessingFor.loading && blessingFor.message && (
        <div className="modal-overlay" onClick={() => setBlessingFor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--pink)" /> 生日祝福
            </h3>
            <div style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.15)', borderRadius: 12, padding: 16, fontSize: 15, lineHeight: 1.8, color: 'var(--text-h)', whiteSpace: 'pre-wrap' }}>
              {blessingFor.message}
            </div>
            {blessingFor.channel && (
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 10 }}>
                推荐渠道：{blessingFor.channel}
              </div>
            )}
            {blessingFor.tips?.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>
                {blessingFor.tips.map((t, i) => <div key={i}>- {t}</div>)}
              </div>
            )}
            <div className="modal-footer">
              <button className="btn" onClick={() => setBlessingFor(null)}>关闭</button>
              <button className="btn btn-primary" onClick={copyBlessing}>复制文案</button>
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {stats.totalContacts === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <UserPlus size={36} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-h)', marginBottom: 8 }}>开始管理你的人脉</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 20 }}>添加第一个联系人，AI助手会帮你维护关系</div>
          <button className="btn btn-primary" onClick={() => onNavigate('contacts')} style={{ fontSize: 15, padding: '10px 24px' }}>
            <UserPlus size={16} /> 添加联系人
          </button>
        </div>
      )}
    </div>
  )
}
