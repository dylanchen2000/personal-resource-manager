import { useState, useEffect } from 'react'
import { Download, Upload, Share2, Database } from 'lucide-react'
import { exportAll, importAll, getContacts, getCircles } from '../utils/store'
import { nameColor, nameInitial } from '../utils/helpers'

export default function SharePage() {
  const [contacts, setContacts] = useState([])
  const [circles, setCircles] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [cardHtml, setCardHtml] = useState('')

  useEffect(() => {
    Promise.all([getContacts(), getCircles()]).then(([c, ci]) => {
      setContacts(c)
      setCircles(ci)
    })
  }, [])

  // 导出所有数据
  async function handleExport() {
    const data = await exportAll()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prm-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入数据
  async function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      const text = await file.text()
      const data = JSON.parse(text)
      await importAll(data)
      alert('导入成功！刷新页面查看。')
      window.location.reload()
    }
    input.click()
  }

  // 生成可分享的联系人卡片HTML
  function generateCard(contact) {
    const color = nameColor(contact.name)
    const circleList = contact.circles?.length ? contact.circles.join(' / ') : ''
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${contact.name} - 联系人名片</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#0f172a;color:#cbd5e1;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:32px;max-width:380px;width:100%;text-align:center}
.avatar{width:72px;height:72px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;margin:0 auto 16px}
.name{font-size:24px;font-weight:700;color:#f1f5f9}
.title{font-size:14px;color:#64748b;margin-top:4px}
.circles{margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.circle-tag{padding:4px 14px;border-radius:20px;font-size:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#94a3b8}
.contact-info{margin-top:20px;padding-top:20px;border-top:1px solid #334155;text-align:left;font-size:14px}
.contact-info div{padding:6px 0;display:flex;justify-content:space-between}
.contact-info .label{color:#64748b}
.contact-info .val{color:#f1f5f9}
.footer{margin-top:20px;font-size:11px;color:#475569}
</style>
</head>
<body>
<div class="card">
<div class="avatar">${contact.name?.charAt(0) || '?'}</div>
<div class="name">${contact.name}</div>
${contact.company || contact.title ? `<div class="title">${[contact.company, contact.title].filter(Boolean).join(' | ')}</div>` : ''}
${circleList ? `<div class="circles">${contact.circles.map(c => `<span class="circle-tag">${c}</span>`).join('')}</div>` : ''}
<div class="contact-info">
${contact.phone ? `<div><span class="label">电话</span><span class="val">${contact.phone}</span></div>` : ''}
${contact.wechat ? `<div><span class="label">微信</span><span class="val">${contact.wechat}</span></div>` : ''}
${contact.notes ? `<div><span class="label">备注</span><span class="val">${contact.notes}</span></div>` : ''}
</div>
<div class="footer">PRM - 人脉资源管理</div>
</div>
</body>
</html>`
    return html
  }

  function handleGenerateCard(contact) {
    setSelectedContact(contact)
    const html = generateCard(contact)
    setCardHtml(html)
  }

  function handleDownloadCard() {
    if (!cardHtml || !selectedContact) return
    const blob = new Blob([cardHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedContact.name}-名片.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="page-header">
        <h2>分享 & 数据</h2>
      </div>

      {/* 数据管理 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, color: 'var(--text-h)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={16} /> 数据备份
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
          所有数据存储在本地浏览器中。建议定期导出备份。
        </p>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={14} /> 导出全部数据 (JSON)
          </button>
          <button className="btn" onClick={handleImport}>
            <Upload size={14} /> 导入数据
          </button>
        </div>
      </div>

      {/* 名片生成 */}
      <div className="card">
        <h3 style={{ fontSize: 16, color: 'var(--text-h)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={16} /> 生成可分享名片
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
          选择联系人，生成独立H5名片页面，可分享到微信/抖音。私密信息不会包含在名片中。
        </p>

        {contacts.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>暂无联系人</p>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {contacts.slice(0, 20).map(c => (
              <button key={c.id}
                className={`option-btn ${selectedContact?.id === c.id ? 'selected' : ''}`}
                onClick={() => handleGenerateCard(c)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {cardHtml && (
          <div>
            <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid var(--border)' }}>
              <iframe
                srcDoc={cardHtml}
                style={{ width: '100%', height: 400, border: 'none', borderRadius: 8 }}
                title="名片预览"
              />
            </div>
            <button className="btn btn-primary" onClick={handleDownloadCard}>
              <Download size={14} /> 下载名片 HTML
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
