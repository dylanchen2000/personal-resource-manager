import { useState, useEffect } from 'react'
import { HeartHandshake, TrendingUp, TrendingDown } from 'lucide-react'
import { getContacts, getFavorRecords, FAVOR_RECORD_TYPES } from '../utils/store'
import { nameColor, nameInitial, timeAgo, formatAmount } from '../utils/helpers'

export default function Favors({ onOpenContact }) {
  const [contacts, setContacts] = useState([])
  const [allFavors, setAllFavors] = useState([])
  const [tab, setTab] = useState('有恩于我')

  useEffect(() => {
    Promise.all([getContacts(), getFavorRecords()]).then(([c, f]) => {
      setContacts(c)
      setAllFavors(f)
    })
  }, [])

  const favorMe = contacts.filter(c => c.favor === '有恩于我')
  const favorThem = contacts.filter(c => c.favor === '有恩于他')
  const list = tab === '有恩于我' ? favorMe : favorThem

  // 总人情统计
  const totalOut = allFavors.filter(r => FAVOR_RECORD_TYPES.find(t => t.value === r.type)?.direction === 'out').reduce((s, r) => s + (r.amount || 0), 0)
  const totalIn = allFavors.filter(r => FAVOR_RECORD_TYPES.find(t => t.value === r.type)?.direction === 'in').reduce((s, r) => s + (r.amount || 0), 0)
  const pendingCount = allFavors.filter(r => r.status === '待回馈').length

  // 每个联系人的人情记录数
  function getFavorCount(contactId) {
    return allFavors.filter(f => f.contactId === contactId).length
  }

  function getContactBalance(contactId) {
    return allFavors.filter(f => f.contactId === contactId).reduce((sum, r) => {
      const rec = FAVOR_RECORD_TYPES.find(t => t.value === r.type)
      if (!rec || !r.amount) return sum
      return rec.direction === 'out' ? sum - r.amount : sum + r.amount
    }, 0)
  }

  return (
    <div>
      <div className="page-header">
        <h2>人情账本</h2>
      </div>

      {/* 总览统计 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div className="stat-card" style={{ flex: 1, cursor: 'pointer', border: tab === '有恩于我' ? '2px solid var(--yellow)' : undefined }}
          onClick={() => setTab('有恩于我')}>
          <div className="label" style={{ color: 'var(--yellow)' }}>有恩于我</div>
          <div className="value" style={{ color: 'var(--yellow)' }}>{favorMe.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>别人帮过我，记着</div>
        </div>
        <div className="stat-card" style={{ flex: 1, cursor: 'pointer', border: tab === '有恩于他' ? '2px solid var(--accent)' : undefined }}
          onClick={() => setTab('有恩于他')}>
          <div className="label" style={{ color: 'var(--accent)' }}>有恩于他</div>
          <div className="value" style={{ color: 'var(--accent)' }}>{favorThem.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>我帮过别人，人情储备</div>
        </div>
      </div>

      {/* 人情流水统计 */}
      {allFavors.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="stat-card" style={{ flex: 1, padding: '12px 16px' }}>
            <div className="label" style={{ fontSize: 12 }}><TrendingDown size={12} style={{ verticalAlign: 'middle' }} /> 我付出总额</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)', marginTop: 4 }}>{formatAmount(totalOut)}</div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: '12px 16px' }}>
            <div className="label" style={{ fontSize: 12 }}><TrendingUp size={12} style={{ verticalAlign: 'middle' }} /> 他付出总额</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>{formatAmount(totalIn)}</div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: '12px 16px' }}>
            <div className="label" style={{ fontSize: 12 }}>待回馈</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: pendingCount > 0 ? 'var(--yellow)' : 'var(--text-dim)', marginTop: 4 }}>{pendingCount}</div>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty-state">
          <HeartHandshake size={48} />
          <p>暂无"{tab}"记录</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>在联系人详情中可以标记人情关系</p>
        </div>
      ) : (
        <div className="contact-list">
          {list.map(c => {
            const balance = getContactBalance(c.id)
            const recordCount = getFavorCount(c.id)
            return (
              <div key={c.id} className="contact-row" onClick={() => onOpenContact(c.id)}>
                <div className="contact-avatar" style={{ background: nameColor(c.name) }}>
                  {nameInitial(c.name)}
                </div>
                <div className="contact-info">
                  <div className="name">{c.name}</div>
                  <div className="sub">
                    {c.favorDetail || (tab === '有恩于我' ? '具体恩情未记录' : '具体帮助未记录')}
                  </div>
                </div>
                <div className="contact-tags">
                  {c.circles?.map(ci => (
                    <span key={ci} className="circle-tag">{ci}</span>
                  ))}
                  {c.strategy && (
                    <span className={`badge badge-${c.strategy === '加密' ? 'strengthen' : c.strategy === '保持' ? 'maintain' : 'fadeout'}`}>
                      {c.strategy}
                    </span>
                  )}
                </div>
                <div className="contact-meta">
                  <div>{c.lastContact ? timeAgo(c.lastContact) : '从未联系'}</div>
                  {recordCount > 0 && <div style={{ fontSize: 11, color: balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {recordCount}笔 | 净值 {balance >= 0 ? '+' : ''}{formatAmount(balance)}
                  </div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
