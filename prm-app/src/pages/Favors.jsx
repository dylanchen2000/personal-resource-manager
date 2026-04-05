import { useState, useEffect } from 'react'
import { HeartHandshake } from 'lucide-react'
import { getContacts } from '../utils/store'
import { nameColor, nameInitial, timeAgo } from '../utils/helpers'

export default function Favors({ onOpenContact }) {
  const [contacts, setContacts] = useState([])
  const [tab, setTab] = useState('有恩于我')

  useEffect(() => {
    getContacts().then(setContacts)
  }, [])

  const favorMe = contacts.filter(c => c.favor === '有恩于我')
  const favorThem = contacts.filter(c => c.favor === '有恩于他')
  const list = tab === '有恩于我' ? favorMe : favorThem

  return (
    <div>
      <div className="page-header">
        <h2>人情账本</h2>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
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

      {list.length === 0 ? (
        <div className="empty-state">
          <HeartHandshake size={48} />
          <p>暂无"{tab}"记录</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>在联系人详情中可以标记人情关系</p>
        </div>
      ) : (
        <div className="contact-list">
          {list.map(c => (
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
                {c.lastContact ? timeAgo(c.lastContact) : '从未联系'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
