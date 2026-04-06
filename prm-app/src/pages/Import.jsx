import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Contact, Zap, Download, Check, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { saveContact, getCircles, getContacts } from '../utils/store'
import * as XLSX from 'xlsx'

// Excel列名映射
const FIELD_MAP = {
  '姓名': 'name', '名字': 'name', '全名': 'name', 'name': 'name',
  '实际称呼': 'nickname', '称呼': 'nickname', '昵称': 'nickname', 'nickname': 'nickname',
  '手机': 'phone', '电话': 'phone', '手机号': 'phone', 'phone': 'phone', 'tel': 'phone',
  '微信': 'wechat', '微信号': 'wechat', 'wechat': 'wechat',
  '公司': 'company', '单位': 'company', '组织': 'company', 'company': 'company',
  '职位': 'title', '头衔': 'title', '职务': 'title', 'title': 'title',
  '圈子': 'circles', '所属圈子': 'circles', 'circles': 'circles',
  '人情': 'favor', 'favor': 'favor',
  '策略': 'strategy', '关系策略': 'strategy', 'strategy': 'strategy',
  '提醒频率': 'reminderFreq', '联系频率': 'reminderFreq',
  '生日': 'birthday', 'birthday': 'birthday',
  '备注': 'notes', 'notes': 'notes',
  '私密备注': 'privateNotes',
  '认识经过': 'howWeMet',
  '关心细节': 'details',
  '家庭信息': 'familyInfo',
}

// vCard解析
function parseVCard(text) {
  const contacts = []
  const cards = text.split(/BEGIN:VCARD/i).filter(s => s.trim())
  for (const card of cards) {
    const c = {}
    const lines = card.split(/\r?\n/)
    for (const line of lines) {
      if (line.match(/^FN[;:]/i)) {
        c.name = line.replace(/^FN[;:][^:]*:/i, '').replace(/^FN:/i, '').trim()
      }
      if (line.match(/^TEL[;:]/i)) {
        const phone = line.replace(/^TEL[^:]*:/i, '').replace(/[\s\-()]/g, '').trim()
        if (phone) c.phone = phone
      }
      if (line.match(/^ORG[;:]/i)) {
        c.company = line.replace(/^ORG[^:]*:/i, '').replace(/;/g, ' ').trim()
      }
      if (line.match(/^TITLE[;:]/i)) {
        c.title = line.replace(/^TITLE[^:]*:/i, '').trim()
      }
      if (line.match(/^BDAY[;:]/i)) {
        const bday = line.replace(/^BDAY[^:]*:/i, '').trim()
        // 格式化为 YYYY-MM-DD
        if (bday.length === 8) c.birthday = `${bday.slice(0,4)}-${bday.slice(4,6)}-${bday.slice(6,8)}`
        else c.birthday = bday
      }
      if (line.match(/^NOTE[;:]/i)) {
        c.notes = line.replace(/^NOTE[^:]*:/i, '').trim()
      }
    }
    if (c.name) contacts.push(c)
  }
  return contacts
}

export default function Import({ onDone, onRefresh }) {
  const [tab, setTab] = useState('excel') // excel | vcard | quick
  const [preview, setPreview] = useState([]) // 预览数据
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null) // { success, skipped, errors }
  const [circles, setCircles] = useState([])
  const [existingNames, setExistingNames] = useState(new Set())
  const fileRef = useRef(null)

  // 快速录入表
  const [quickRows, setQuickRows] = useState([
    { name: '', nickname: '', circles: [] }
  ])

  useState(() => {
    (async () => {
      const ci = await getCircles()
      setCircles(ci)
      const contacts = await getContacts()
      setExistingNames(new Set(contacts.map(c => c.name)))
    })()
  })

  // ─── Excel/CSV 导入 ────────────────────────────

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setResult(null)

    const reader = new FileReader()
    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target.result, { type: 'string' })
        processWorkbook(wb)
      }
      reader.readAsText(file)
    } else {
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        processWorkbook(wb)
      }
      reader.readAsArrayBuffer(file)
    }
  }

  function processWorkbook(wb) {
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    const mapped = rows.map(row => {
      const contact = {}
      for (const [col, val] of Object.entries(row)) {
        const field = FIELD_MAP[col.trim()] || FIELD_MAP[col.trim().toLowerCase()]
        if (field && val !== '') {
          if (field === 'circles') {
            // 圈子可以用逗号/顿号分隔
            contact.circles = String(val).split(/[,，、]/).map(s => s.trim()).filter(Boolean)
          } else {
            contact[field] = String(val).trim()
          }
        }
      }
      // 标记是否重复
      contact._duplicate = existingNames.has(contact.name)
      return contact
    }).filter(c => c.name) // 必须有姓名

    setPreview(mapped)
  }

  function downloadTemplate() {
    const headers = ['姓名', '实际称呼', '手机', '微信', '公司', '职位', '圈子', '人情', '策略', '提醒频率', '生日', '备注', '认识经过', '关心细节', '家庭信息']
    const example = ['陶永飞', '陶老师', '13800138000', 'tao_wechat', '省中西结合医院', '教授主任老师', '家人亲友,良师益友', '有恩于我', '加密', '每月', '1970-05-15', '实习时帮我很多', '校友介绍认识', '女儿刚生了宝宝', '爱人孙爱云老师']
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    // 设置列宽
    ws['!cols'] = headers.map(() => ({ wch: 16 }))
    XLSX.utils.book_append_sheet(wb, ws, '联系人')
    XLSX.writeFile(wb, '友人记-导入模板.xlsx')
  }

  // ─── vCard 导入 ─────────────────────────────────

  function handleVCardSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const contacts = parseVCard(ev.target.result)
      contacts.forEach(c => { c._duplicate = existingNames.has(c.name) })
      setPreview(contacts)
    }
    reader.readAsText(file)
  }

  // ─── 批量保存 ──────────────────────────────────

  async function handleImport() {
    setImporting(true)
    let success = 0, skipped = 0, errors = []

    const toImport = preview.filter(c => !c._skip)
    for (const c of toImport) {
      try {
        if (c._duplicate && !c._overwrite) {
          skipped++
          continue
        }
        const { _duplicate, _skip, _overwrite, ...contact } = c
        await saveContact(contact)
        success++
      } catch (err) {
        errors.push(`${c.name}: ${err.message}`)
      }
    }

    setImporting(false)
    setResult({ success, skipped, errors })
    setPreview([])
    onRefresh()
  }

  // ─── 快速录入 ──────────────────────────────────

  function addQuickRow() {
    setQuickRows([...quickRows, { name: '', nickname: '', circles: [] }])
  }

  function updateQuickRow(index, field, value) {
    const rows = [...quickRows]
    rows[index] = { ...rows[index], [field]: value }
    setQuickRows(rows)
  }

  function removeQuickRow(index) {
    if (quickRows.length <= 1) return
    setQuickRows(quickRows.filter((_, i) => i !== index))
  }

  function toggleQuickCircle(index, circleName) {
    const rows = [...quickRows]
    const circles = rows[index].circles || []
    if (circles.includes(circleName)) {
      rows[index].circles = circles.filter(c => c !== circleName)
    } else {
      rows[index].circles = [...circles, circleName]
    }
    setQuickRows(rows)
  }

  async function handleQuickImport() {
    setImporting(true)
    let success = 0
    const valid = quickRows.filter(r => r.name?.trim())
    for (const row of valid) {
      await saveContact({
        name: row.name.trim(),
        nickname: row.nickname?.trim() || '',
        circles: row.circles || [],
      })
      success++
    }
    setImporting(false)
    setResult({ success, skipped: 0, errors: [] })
    setQuickRows([{ name: '', nickname: '', circles: [] }])
    onRefresh()
  }

  return (
    <div>
      <div className="page-header">
        <h2>导入联系人</h2>
        <button className="btn" onClick={onDone}>返回</button>
      </div>

      {/* Tab切换 */}
      <div className="import-tabs">
        <button className={`import-tab ${tab === 'excel' ? 'active' : ''}`} onClick={() => { setTab('excel'); setPreview([]); setResult(null) }}>
          <FileSpreadsheet size={16} /> Excel/CSV导入
        </button>
        <button className={`import-tab ${tab === 'vcard' ? 'active' : ''}`} onClick={() => { setTab('vcard'); setPreview([]); setResult(null) }}>
          <Contact size={16} /> 手机通讯录导入
        </button>
        <button className={`import-tab ${tab === 'quick' ? 'active' : ''}`} onClick={() => { setTab('quick'); setPreview([]); setResult(null) }}>
          <Zap size={16} /> 快速录入
        </button>
      </div>

      {/* 导入结果 */}
      {result && (
        <div className="import-result" style={{ background: result.errors.length ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: '1px solid', borderColor: result.errors.length ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Check size={18} style={{ color: '#10b981' }} />
            <strong>导入完成：成功 {result.success} 人{result.skipped > 0 ? `，跳过 ${result.skipped} 人（重复）` : ''}</strong>
          </div>
          {result.errors.length > 0 && (
            <div style={{ color: '#f59e0b', fontSize: 13 }}>
              {result.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>
      )}

      {/* ─── Excel/CSV 导入面板 ─── */}
      {tab === 'excel' && (
        <div>
          <div className="import-guide" style={{ background: 'var(--card)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h4 style={{ marginBottom: 12 }}>使用方法</h4>
            <ol style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--text-secondary)' }}>
              <li>下载Excel模板，按格式填入联系人信息</li>
              <li>圈子可以用逗号分隔多个，如"戈友圈,校友圈"</li>
              <li>人情填"有恩于我"或"有恩于他"</li>
              <li>策略填"加密"、"保持"或"淡出"</li>
              <li>只有姓名是必填，其他字段后续可以慢慢补</li>
            </ol>
            <button className="btn btn-primary" onClick={downloadTemplate} style={{ marginTop: 12 }}>
              <Download size={14} /> 下载Excel模板
            </button>
          </div>

          <div className="upload-area" onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer', marginBottom: 20 }}
          >
            <Upload size={32} style={{ color: 'var(--text-dim)', marginBottom: 8 }} />
            <p style={{ color: 'var(--text-secondary)' }}>点击选择 Excel (.xlsx) 或 CSV 文件</p>
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>支持 .xlsx, .xls, .csv 格式</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleFileSelect} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {/* ─── vCard 导入面板 ─── */}
      {tab === 'vcard' && (
        <div>
          <div className="import-guide" style={{ background: 'var(--card)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h4 style={{ marginBottom: 12 }}>导出手机通讯录</h4>
            <div style={{ lineHeight: 2, color: 'var(--text-secondary)' }}>
              <p><strong>iPhone：</strong></p>
              <ol style={{ paddingLeft: 20 }}>
                <li>打开 iCloud.com → 通讯录</li>
                <li>全选联系人 → 左下角齿轮 → 导出vCard</li>
                <li>把下载的 .vcf 文件传到这里</li>
              </ol>
              <p style={{ marginTop: 12 }}><strong>安卓：</strong></p>
              <ol style={{ paddingLeft: 20 }}>
                <li>打开"通讯录"App → 设置 → 导出</li>
                <li>选择导出为 .vcf 文件</li>
                <li>把文件传到这里</li>
              </ol>
            </div>
          </div>

          <div className="upload-area" onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer', marginBottom: 20 }}
          >
            <Upload size={32} style={{ color: 'var(--text-dim)', marginBottom: 8 }} />
            <p style={{ color: 'var(--text-secondary)' }}>点击选择 vCard (.vcf) 文件</p>
            <input ref={fileRef} type="file" accept=".vcf,.vcard" onChange={handleVCardSelect} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {/* ─── 快速录入面板 ─── */}
      {tab === 'quick' && (
        <div>
          <div className="import-guide" style={{ background: 'var(--card)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h4 style={{ marginBottom: 8 }}>快速批量录入</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>只需填姓名和称呼，选择圈子。其他信息后续在联系人详情里慢慢补。</p>
          </div>

          <div className="quick-input-table" style={{ marginBottom: 20 }}>
            <div className="quick-header" style={{ display: 'grid', gridTemplateColumns: '160px 140px 1fr 40px', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-dim)' }}>
              <span>姓名 *</span>
              <span>实际称呼</span>
              <span>圈子（可多选）</span>
              <span></span>
            </div>
            {quickRows.map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '160px 140px 1fr 40px', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                <input
                  value={row.name}
                  onChange={e => updateQuickRow(idx, 'name', e.target.value)}
                  placeholder="姓名"
                  style={{ fontSize: 14 }}
                />
                <input
                  value={row.nickname}
                  onChange={e => updateQuickRow(idx, 'nickname', e.target.value)}
                  placeholder="如：陶老师"
                  style={{ fontSize: 14 }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {circles.map(c => (
                    <button
                      key={c.id}
                      className={`chip ${row.circles?.includes(c.name) ? 'active' : ''}`}
                      style={{ fontSize: 11, padding: '2px 8px' }}
                      onClick={() => toggleQuickCircle(idx, c.name)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <button className="btn btn-sm" onClick={() => removeQuickRow(idx)} style={{ padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button className="btn" onClick={addQuickRow} style={{ marginTop: 8, fontSize: 13 }}>
              <Plus size={14} /> 添加一行
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleQuickImport}
            disabled={importing || !quickRows.some(r => r.name?.trim())}
            style={{ fontSize: 15, padding: '10px 24px' }}
          >
            {importing ? '正在导入...' : `导入 ${quickRows.filter(r => r.name?.trim()).length} 个联系人`}
          </button>
        </div>
      )}

      {/* ─── 预览表格（Excel/vCard共用） ─── */}
      {preview.length > 0 && (tab === 'excel' || tab === 'vcard') && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4>预览：{preview.length} 条记录{preview.filter(c => c._duplicate).length > 0 && <span style={{ color: '#f59e0b', fontSize: 13, marginLeft: 8 }}>（{preview.filter(c => c._duplicate).length} 条重名）</span>}</h4>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing}
              style={{ fontSize: 15, padding: '10px 24px' }}
            >
              {importing ? '正在导入...' : `确认导入 ${preview.filter(c => !c._skip).length} 人`}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)' }}>状态</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)' }}>姓名</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)' }}>称呼</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)' }}>手机</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)' }}>公司/职位</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)' }}>圈子</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)' }}>人情</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)' }}>策略</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: c._skip ? 0.4 : 1 }}>
                    <td style={{ padding: '8px 12px' }}>
                      {c._duplicate ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}>
                          <AlertTriangle size={14} /> 重名
                        </span>
                      ) : (
                        <span style={{ color: '#10b981' }}><Check size={14} /></span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{c.nickname || '-'}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{c.phone || '-'}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{[c.company, c.title].filter(Boolean).join(' / ') || '-'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {c.circles?.map(ci => <span key={ci} className="chip" style={{ fontSize: 11, marginRight: 4 }}>{ci}</span>) || '-'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>{c.favor || '-'}</td>
                    <td style={{ padding: '8px 12px' }}>{c.strategy || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
