import { useState, useEffect } from 'react'
import { BarChart3, EyeOff, TrendingUp, Users, Calendar } from 'lucide-react'
import { getStats, getItems, getOutfits, CATEGORIES } from '../utils/store'

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [recentOutfits, setRecentOutfits] = useState([])
  const [allItems, setAllItems] = useState([])
  const [peopleMap, setPeopleMap] = useState({})

  useEffect(() => {
    (async () => {
      const [s, o, allItems] = await Promise.all([getStats(), getOutfits(10), getItems()])
      setStats(s)
      setRecentOutfits(o)
      setAllItems(allItems)
      // 构建人物->衣物映射
      const pMap = {}
      allItems.forEach(item => {
        (item.people || []).forEach(p => {
          if (!pMap[p]) pMap[p] = []
          pMap[p].push(item)
        })
      })
      setPeopleMap(pMap)
    })()
  }, [])

  if (!stats) return <div className="loading-state"><div className="loading-spinner" /><p>加载中...</p></div>

  return (
    <div className="stats-page">
      <h2>数据统计</h2>

      {/* 总览 */}
      <div className="stats-overview">
        <div className="stat-block">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-label">衣物总数</div>
        </div>
        <div className="stat-block">
          <div className="stat-num">{stats.outfitCount}</div>
          <div className="stat-label">穿着记录</div>
        </div>
        <div className="stat-block accent">
          <div className="stat-num">{stats.forgotten.length}</div>
          <div className="stat-label">30天未穿</div>
        </div>
        <div className="stat-block warn">
          <div className="stat-num">{stats.neverWorn.length}</div>
          <div className="stat-label">从未穿过</div>
        </div>
      </div>

      {/* 最近穿着 */}
      {recentOutfits.length > 0 && (
        <div className="stats-section">
          <h3><Calendar size={18} /> 最近穿着</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentOutfits.slice(0, 7).map(outfit => {
              const d = new Date(outfit.date)
              const dateStr = `${d.getMonth() + 1}/${d.getDate()}`
              const weekdays = ['日', '一', '二', '三', '四', '五', '六']
              const items = (outfit.itemIds || []).map(id => allItems.find(i => i.id === id)).filter(Boolean)
              return (
                <div key={outfit.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                  <div style={{ textAlign: 'center', minWidth: 44 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-h)' }}>{dateStr}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>周{weekdays[d.getDay()]}</div>
                  </div>
                  <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
                  <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center', overflow: 'hidden' }}>
                    {items.slice(0, 4).map(item => (
                      item.photo ? (
                        <img key={item.id} src={item.photo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div key={item.id} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                          {CATEGORIES.find(c => c.value === item.category)?.icon || '?'}
                        </div>
                      )
                    ))}
                    {items.length > 4 && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>+{items.length - 4}</span>}
                  </div>
                  {outfit.scene && <span style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: 10, flexShrink: 0 }}>{outfit.scene}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 品类分布 */}
      <div className="stats-section">
        <h3><BarChart3 size={18} /> 品类分布</h3>
        <div className="cat-bars">
          {CATEGORIES.map(c => {
            const count = stats.byCategory[c.value] || 0
            const pct = stats.total > 0 ? (count / stats.total * 100) : 0
            return (
              <div key={c.value} className="cat-bar-row">
                <span className="cat-bar-label">{c.icon} {c.label}</span>
                <div className="cat-bar-track">
                  <div className="cat-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="cat-bar-count">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 被遗忘的好东西 */}
      {stats.forgotten.length > 0 && (
        <div className="stats-section">
          <h3><EyeOff size={18} /> 被遗忘的好东西（30天未穿）</h3>
          <div className="forgotten-grid">
            {stats.forgotten.slice(0, 8).map(item => (
              <div key={item.id} className="forgotten-card">
                {item.photo ? (
                  <img src={item.photo} alt={item.name} />
                ) : (
                  <div className="placeholder">{item.name?.charAt(0) || '?'}</div>
                )}
                <div className="forgotten-name">{item.name || item.category}</div>
                {item.story && <div className="forgotten-story">"{item.story}"</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最常穿的 */}
      {stats.topWorn.length > 0 && (
        <div className="stats-section">
          <h3><TrendingUp size={18} /> 最常穿的</h3>
          <div className="top-list">
            {stats.topWorn.map((item, i) => (
              <div key={item.id} className="top-item">
                <span className="top-rank">#{i + 1}</span>
                {item.photo ? (
                  <img src={item.photo} alt={item.name} className="top-img" />
                ) : (
                  <div className="top-placeholder">{item.name?.charAt(0) || '?'}</div>
                )}
                <div className="top-info">
                  <div>{item.name || item.category}</div>
                  <div className="top-meta">{item.color} / 穿了{item.wearCount}次</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 衣橱里的人 */}
      {Object.keys(peopleMap).length > 0 && (
        <div className="stats-section">
          <h3><Users size={18} /> 衣橱里的人</h3>
          <div className="people-list">
            {Object.entries(peopleMap).sort((a, b) => b[1].length - a[1].length).map(([name, items]) => (
              <div key={name} className="people-row">
                <div className="people-avatar">{name.charAt(0)}</div>
                <div className="people-info">
                  <div className="people-name">{name}</div>
                  <div className="people-meta">{items.length}件衣物有共同记忆</div>
                </div>
                <div className="people-items">
                  {items.slice(0, 3).map(item => (
                    item.photo ? (
                      <img key={item.id} src={item.photo} alt="" className="people-item-thumb" />
                    ) : (
                      <div key={item.id} className="people-item-thumb placeholder">
                        {CATEGORIES.find(c => c.value === item.category)?.icon || '?'}
                      </div>
                    )
                  ))}
                  {items.length > 3 && <span className="people-more">+{items.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="people-hint-stats">整理衣服时想起了谁？去友人记记一笔，联络老朋友</div>
        </div>
      )}

    </div>
  )
}
