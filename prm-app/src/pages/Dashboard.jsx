import { useState, useEffect } from 'react'
import { AlertTriangle, HeartHandshake, Shield, Users, CircleDot, MessageSquare } from 'lucide-react'
import { getStats } from '../utils/store'
import { timeAgo } from '../utils/helpers'

export default function Dashboard({ onOpenContact, onNavigate }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats)
  }, [])

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

      {/* 需要关注的人 */}
      {stats.needAttention.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, color: 'var(--text-h)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--yellow)" />
            需要加强联系（"加密"策略，30天+ 未联系）
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
