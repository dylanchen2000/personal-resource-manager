import { useState, useEffect, useRef } from 'react'
import { Plus, Camera, Grid3X3, List, Search, Trash2, X, UserPlus, Edit3 } from 'lucide-react'
import { getItems, saveItem, deleteItem, CATEGORIES, SCENES, SEASONS, COLORS, ACQUIRE_SCENES } from '../utils/store'

export default function Wardrobe({ onNavigate }) {
  const [items, setItems] = useState([])
  const [filterCat, setFilterCat] = useState(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid') // grid | list
  const [showAdd, setShowAdd] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [form, setForm] = useState({})
  const [editingId, setEditingId] = useState(null) // null=新增, id=编辑
  const fileRef = useRef(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    setItems(await getItems())
  }

  const filtered = items.filter(i => {
    if (filterCat && i.category !== filterCat) return false
    if (search && !i.name?.includes(search) && !i.color?.includes(search) && !i.brand?.includes(search)) return false
    return true
  })

  const stats = {}
  CATEGORIES.forEach(c => { stats[c.value] = items.filter(i => i.category === c.value).length })

  function openAdd() {
    setEditingId(null)
    setForm({ category: '上装', color: '', name: '', brand: '', scenes: ['日常'], season: '四季', story: '', photo: null, people: [] })
    setPhotoPreview(null)
    setShowAdd(true)
  }

  function openEdit(item) {
    setEditingId(item.id)
    setForm({ ...item })
    setPhotoPreview(item.photo || null)
    setShowDetail(null)
    setShowAdd(true)
  }

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      // 压缩图片
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 600
        let w = img.width, h = img.height
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = h * maxSize / w; w = maxSize }
          else { w = w * maxSize / h; h = maxSize }
        }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const compressed = canvas.toDataURL('image/jpeg', 0.7)
        setPhotoPreview(compressed)
        setForm(f => ({ ...f, photo: compressed }))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.category) return
    const data = { ...form }
    if (data.price) data.price = Number(data.price) || 0
    if (editingId) data.id = editingId // 保留原ID，saveItem会更新而非新建
    await saveItem(data)
    setShowAdd(false)
    setEditingId(null)
    setForm({})
    await loadItems()
  }

  async function handleDelete(id) {
    if (!confirm('确定删除这件衣物？')) return
    await deleteItem(id)
    setShowDetail(null)
    await loadItems()
  }

  function openDetail(item) {
    setShowDetail(item.id)
  }

  return (
    <div className="wardrobe-page">
      <div className="page-header">
        <h2>我的衣橱 ({items.length})</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> 添加
        </button>
      </div>

      {/* 品类筛选 */}
      <div className="cat-bar">
        <button className={`cat-chip ${!filterCat ? 'active' : ''}`} onClick={() => setFilterCat(null)}>
          全部 {items.length}
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            className={`cat-chip ${filterCat === c.value ? 'active' : ''}`}
            onClick={() => setFilterCat(filterCat === c.value ? null : c.value)}
          >
            {c.icon} {c.label} {stats[c.value] || 0}
          </button>
        ))}
      </div>

      {/* 搜索 + 视图切换 */}
      <div className="wardrobe-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input placeholder="搜索衣物..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="view-toggle">
          <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><Grid3X3 size={16} /></button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={16} /></button>
        </div>
      </div>

      {/* 衣物列表 */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>👔</div>
          <p>{items.length === 0 ? '衣橱是空的，拍几张照片开始吧' : '没有匹配结果'}</p>
          {items.length === 0 && (
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 16 }}>
              <Camera size={16} /> 拍照入库
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="wardrobe-grid">
          {filtered.map(item => (
            <div key={item.id} className="wardrobe-card" onClick={() => openDetail(item)}>
              {item.photo ? (
                <img src={item.photo} alt={item.name} className="wardrobe-card-img" />
              ) : (
                <div className="wardrobe-card-placeholder">
                  {CATEGORIES.find(c => c.value === item.category)?.icon || '👔'}
                </div>
              )}
              <div className="wardrobe-card-info">
                <div className="wardrobe-card-name">{item.name || item.category}</div>
                <div className="wardrobe-card-meta">
                  {item.color && <span>{item.color}</span>}
                  {item.wearCount > 0 && <span>穿{item.wearCount}次</span>}
                  {!item.lastWorn && item.createdAt && <span className="never-worn">未穿</span>}
                </div>
              </div>
              {item.story && <div className="has-story-dot" />}
              {item.people?.length > 0 && <div className="has-people-dot" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="wardrobe-list">
          {filtered.map(item => (
            <div key={item.id} className="wardrobe-list-item" onClick={() => openDetail(item)}>
              {item.photo ? (
                <img src={item.photo} alt={item.name} className="wardrobe-list-img" />
              ) : (
                <div className="wardrobe-list-placeholder">
                  {CATEGORIES.find(c => c.value === item.category)?.icon || '👔'}
                </div>
              )}
              <div className="wardrobe-list-info">
                <div className="name">{item.name || item.category}</div>
                <div className="meta">{[item.color, item.brand, item.season].filter(Boolean).join(' / ')}</div>
                {item.story && <div className="story">"{item.story}"</div>}
              </div>
              <div className="wardrobe-list-stats">
                <div>穿{item.wearCount || 0}次</div>
                {item.lastWorn && <div className="last-worn">{daysAgo(item.lastWorn)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加衣物弹窗 */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? '编辑衣物' : '添加衣物'}</h3>
              <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>

            {/* 拍照区 */}
            <div className="photo-upload" onClick={() => fileRef.current?.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="预览" className="photo-preview" />
              ) : (
                <div className="photo-placeholder">
                  <Camera size={32} />
                  <span>拍照 / 选择图片</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            </div>

            {/* 品类 */}
            <div className="form-group">
              <label>品类</label>
              <div className="option-group">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    className={`option-btn ${form.category === c.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, category: c.value })}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 名称 */}
            <div className="form-group">
              <label>名称</label>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如：灰色Polo衫" />
            </div>

            {/* 颜色选择 */}
            <div className="form-group">
              <label>颜色</label>
              <div className="option-group">
                {COLORS.map(c => (
                  <button key={c.value}
                    className={`option-btn ${form.color === c.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, color: c.value })}>
                    {c.label}
                  </button>
                ))}
                <button
                  className={`option-btn ${form.color && !COLORS.find(c => c.value === form.color) ? 'selected' : ''}`}
                  onClick={() => {
                    const custom = prompt('输入颜色', form.color || '')
                    if (custom) setForm({ ...form, color: custom })
                  }}>
                  其他
                </button>
              </div>
              {form.color && !COLORS.find(c => c.value === form.color) && (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>已选: {form.color}</div>
              )}
            </div>

            {/* 品牌 */}
            <div className="form-group">
              <label>品牌</label>
              <input value={form.brand || ''} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="选填" />
            </div>

            {/* 价格+获得场景 */}
            <div className="form-row">
              <div className="form-group">
                <label>入手价格</label>
                <input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="选填" />
              </div>
              <div className="form-group">
                <label>获得场景</label>
                <select value={form.acquireScene || ''} onChange={e => setForm({ ...form, acquireScene: e.target.value })}>
                  <option value="">请选择</option>
                  {ACQUIRE_SCENES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 季节 */}
            <div className="form-group">
              <label>季节</label>
              <div className="option-group">
                {SEASONS.map(s => (
                  <button key={s.value} className={`option-btn ${form.season === s.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, season: s.value })}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 适用场景 */}
            <div className="form-group">
              <label>适用场景（可多选）</label>
              <div className="option-group">
                {SCENES.map(s => (
                  <button key={s.value}
                    className={`option-btn ${form.scenes?.includes(s.value) ? 'selected' : ''}`}
                    onClick={() => {
                      const has = form.scenes?.includes(s.value)
                      setForm({ ...form, scenes: has ? form.scenes.filter(x => x !== s.value) : [...(form.scenes || []), s.value] })
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 故事/记忆 */}
            <div className="form-group">
              <label>这件衣服的故事（选填）</label>
              <textarea
                value={form.story || ''}
                onChange={e => setForm({ ...form, story: e.target.value })}
                placeholder="在哪里买的？什么场合穿过？有什么特别的记忆？"
                rows={3}
              />
            </div>

            {/* 想起了谁 */}
            <div className="form-group">
              <label><UserPlus size={14} style={{ verticalAlign: -2 }} /> 想起了谁？（选填）</label>
              <div className="people-tags" onClick={e => e.currentTarget.querySelector('input')?.focus()}>
                {(form.people || []).map((p, i) => (
                  <span key={i} className="people-tag">
                    {p}
                    <button onClick={() => setForm({ ...form, people: form.people.filter((_, j) => j !== i) })}>x</button>
                  </span>
                ))}
                <input
                  className="people-input"
                  placeholder={(form.people || []).length === 0 ? "输入人名，回车添加（如：贵哥）" : "继续添加..."}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      e.preventDefault()
                      const name = e.target.value.trim()
                      if (!(form.people || []).includes(name)) {
                        setForm({ ...form, people: [...(form.people || []), name] })
                      }
                      e.target.value = ''
                    }
                  }}
                />
              </div>
              <div className="people-hint">这件衣服让你想起谁？一起买的朋友、送你的人...和友人记联动</div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 衣物详情弹窗 */}
      {showDetail && (() => {
        const detail = items.find(i => i.id === showDetail)
        if (!detail) return null
        return (
          <div className="modal-overlay" onClick={() => setShowDetail(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{detail.name || detail.category}</h3>
                <button className="btn-icon" onClick={() => setShowDetail(null)}><X size={20} /></button>
              </div>

              {detail.photo && <img src={detail.photo} alt="" className="detail-photo" />}

              <div className="detail-info">
                <div className="detail-row"><span>品类</span><span>{detail.category}</span></div>
                <div className="detail-row"><span>颜色</span><span>{detail.color || '-'}</span></div>
                <div className="detail-row"><span>品牌</span><span>{detail.brand || '-'}</span></div>
                <div className="detail-row"><span>季节</span><span>{detail.season || '-'}</span></div>
                <div className="detail-row"><span>场景</span><span>{detail.scenes?.join(', ') || '-'}</span></div>
                {detail.acquireScene && <div className="detail-row"><span>获得场景</span><span>{detail.acquireScene}</span></div>}
                <div className="detail-row"><span>穿着次数</span><span>{detail.wearCount || 0}次</span></div>
                <div className="detail-row"><span>最后穿着</span><span>{detail.lastWorn ? daysAgo(detail.lastWorn) : '从未'}</span></div>
                {detail.price > 0 && <div className="detail-row"><span>入手价</span><span>{detail.price}元</span></div>}
                {detail.price > 0 && detail.wearCount > 0 && (
                  <div className="detail-row highlight"><span>每穿成本</span><span>{Math.round(detail.price / detail.wearCount)}元/次</span></div>
                )}
              </div>

              {detail.story && (
                <div className="detail-story">
                  <div className="story-label">故事</div>
                  <div className="story-text">"{detail.story}"</div>
                </div>
              )}

              {detail.people?.length > 0 && (
                <div className="detail-people">
                  <div className="story-label"><UserPlus size={14} style={{ verticalAlign: -2 }} /> 关联的人</div>
                  <div className="people-tags">
                    {detail.people.map((p, i) => (
                      <span key={i} className="people-tag readonly">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button className="btn btn-danger" onClick={() => handleDelete(detail.id)}>
                  <Trash2 size={14} /> 删除
                </button>
                <button className="btn btn-primary" onClick={() => openEdit(detail)}>
                  <Edit3 size={14} /> 编辑
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function daysAgo(ts) {
  const days = Math.floor((Date.now() - ts) / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return `${days}天前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}
