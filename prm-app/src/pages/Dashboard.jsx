import { useState, useEffect } from 'react'
import { AlertTriangle, HeartHandshake, Shield, Users, CircleDot, MessageSquare, Clock, Cake, Zap } from 'lucide-react'
import { getStats, getHealthColor, getContactDueInfo, bulkSnooze } from '../utils/store'
import { timeAgo } from '../utils/helpers'

export default function Dashboard({ onOpenContact, onNavigate }) {
  const [stats, setStats] = useState(null)
  const [snoozing, setSnoozing] = useState(false)

  useEffect(() => {
    getStats().then(setStats)
  }, [])

  async function handleBulkSnooze() {
    if (!confirm('将所有积压提醒均匀分散到未来14天？')) return
    setSnoozing(true)
    const count = await bulkSnooze(14)
    alert(`已分散 ${count} 条提醒到未来14天`)
    setSnoozing(false)
    getStats().then(setStats)
  }

  if (!stats) return <div className="empty-state"><p>加载中...</p></div>

  return (
    <div>
      <div className="page-header">
        <h2>仪表盘</h2>
      </div>

      <div className="card-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('contacts')}>
          <div className="label"><Users size={14} style={{ verticalAlign: 'middle' }} /> 联系人</div>
          <div className="value">{stats.totalContacts}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('circles')}>
          <div className="label"><CircleDot size={14} style={{ verticalAlign: 'middle' }} /> 圈子</div>
          <div className="value">{stats.totalCircles}</div>
        </div>
        <div className="stat-card">
          <div className="label"><MessageSquare size={14} style={{ verticalAlign: 'middle' }} /> 互动记录</div>
          <div className="value">{stats.totalInteractions}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('favors')}>
          <div className="label"><HeartHandshake size={14} style={{ verticalAlign: 'middle' }} /> 有恩于我</div>
          <div className="value" style={{ color: 'var(--yellow)' }}>{stats.favorMe}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('favors')}>
          <div className="label"><HeartHandshake size={14} style={{ verticalAlign: 'middle' }} /> 有恩于他</div>
          <div className="value" style={{ color: 'var(--accent)' }}>{stats.favorThem}</div>
        </div>
        <div className="stat-card">
          <div className="label"><Shield size={14} style={{ verticalAlign: 'middle' }} /> 加密</div>
          <div className="value" style={{ color: 'var(--green)' }}>{stats.strengthen}</div>
        </div>
      </div>

      {/* 今日生日 */}
      {stats.birthdayToday.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, color: 'var(--text-h)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cake size={16} color="var(--pink)" />
            今日生日
          </h3>
          {stats.birthdayToday.map(c => (
            <div key={c.id} className="reminder-item" onClick={() => onOpenContact(c.id)} style={{ cursor: 'pointer', borderColor: 'var(--pink)' }}>
              <div className="reminder-dot" style={{ background: 'var(--pink)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {c.birthday} {c.circles?.length ? `| ${c.circles.join(', ')}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 即将生日（7天内） */}
      {stats.birthdaySoon.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, color: 'var(--text-h)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cake size={16} color="var(--purple)" />
            近期生日（7天内）
          </h3>
          {stats.birthdaySoon.map(c => (
            <div key={c.id} className="reminder-item" onClick={() => onOpenContact(c.id)} style={{ cursor: 'pointer' }}>
              <div className="reminder-dot" style={{ background: 'var(--purple)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  生日 {c.birthday} {c.circles?.length ? `| ${c.circles.join(', ')}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 今日待联系 - 核心视图 */}
      {stats.todayDue.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="var(--accent)" />
              今日待联系 ({stats.todayDue.length})
            </h3>
            {stats.todayDue.length > 5 && (
              <button className="btn btn-sm" onClick={handleBulkSnooze} disabled={snoozing}>
                <Zap size={12} /> {snoozing ? '分散中...' : '一键分散'}
              </button>
            )}
          </div>
          {stats.todayDue.slice(0, 15).map(c => {
            const due = getContactDueInfo(c)
            const healthColor = getHealthColor(c)
            return (
              <div key={c.id} className="reminder-item" onClick={() => onOpenContact(c.id)} style={{ cursor: 'pointer' }}>
                <div style={{ width: 4, height: 36, borderRadius: 2, background: healthColor, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14 }}>
                    {c.name}
                    {c.favor === '有恩于我' && <span className="badge badge-favor-me" style={{ marginLeft: 8 }}>有恩于我</span>}
                    {c.strategy === '加密' && <span className="badge badge-strengthen" style={{ marginLeft: 8 }}>加密</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    {c.company || ''} {c.circles?.length ? `| ${c.circles.join(', ')}` : ''}
                    {c.reminderFreq ? ` | ${c.reminderFreq}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: healthColor, fontWeight: 600 }}>
                    {due.status === 'overdue' ? `逾期${due.daysOverdue}天` : `${due.daysUntilDue}天后到期`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {c.lastContact ? timeAgo(c.lastContact) : '从未联系'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 需要关注的人（无提醒频率的加密联系人） */}
      {stats.needAttention.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, color: 'var(--text-h)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--yellow)" />
            需要加强联系（30天+ 未联系的"加密"联系人）
          </h3>
          {stats.needAttention.slice(0, 8).map(c => (
            <div key={c.id} className="reminder-item" onClick={() => onOpenContact(c.id)} style={{ cursor: 'pointer' }}>
              <div className="reminder-dot" style={{ background: 'var(--yellow)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {c.company || ''} {c.circles?.length ? `| ${c.circles.join(', ')}` : ''}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                最后联系: {c.lastContact ? timeAgo(c.lastContact) : '从未'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 人情提醒 */}
      {stats.favorReminders.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, color: 'var(--text-h)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeartHandshake size={16} color="var(--orange)" />
            人情提醒（"有恩于我"，7天+ 未联系）
          </h3>
          {stats.favorReminders.slice(0, 8).map(c => (
            <div key={c.id} className="reminder-item" onClick={() => onOpenContact(c.id)} style={{ cursor: 'pointer' }}>
              <div className="reminder-dot" style={{ background: 'var(--orange)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {c.favorDetail || '记得回馈'}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                最后联系: {c.lastContact ? timeAgo(c.lastContact) : '从未'}
              </div>
            </div>
          ))}
        </div>
      )}

      {stats.totalContacts === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <p>还没有联系人，点击左侧"联系人"开始添加</p>
        </div>
      )}
    </div>
  )
}
