import { useState, useEffect, useRef } from 'react'
import { MapPin, Download, Upload, User } from 'lucide-react'
import { getSetting, setSetting, exportAllData, importAllData } from '../utils/store'
import { CITY_LIST } from '../utils/weather'

export default function Settings() {
  const [city, setCity] = useState(null)
  const [userName, setUserName] = useState('')
  const [backupMsg, setBackupMsg] = useState('')
  const importRef = useRef(null)

  useEffect(() => {
    getSetting('city').then(c => setCity(c || { city: '南昌', lat: 28.68, lon: 115.89 }))
    getSetting('userName').then(n => setUserName(n || '道俊'))
  }, [])

  async function selectCity(c) {
    setCity(c)
    await setSetting('city', c)
  }

  async function saveUserName(name) {
    setUserName(name)
    await setSetting('userName', name)
  }

  return (
    <div>
      <div className="page-header">
        <h2>设置</h2>
      </div>

      {/* 用户称呼 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={16} /> 称呼
        </div>
        <input
          value={userName}
          onChange={e => setUserName(e.target.value)}
          onBlur={e => saveUserName(e.target.value.trim() || '道俊')}
          placeholder="你的名字"
          style={{ maxWidth: 200 }}
        />
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>用于问候语显示</div>
      </div>

      {/* 城市选择 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={16} /> 所在城市
        </div>
        {city && (
          <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 10 }}>
            当前：{city.city}
          </div>
        )}
        <div className="option-group">
          {CITY_LIST.map(c => (
            <button
              key={c.city}
              className={`option-btn ${city?.city === c.city ? 'selected' : ''}`}
              onClick={() => selectCity(c)}
            >
              {c.city}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>影响天气数据和穿搭建议</div>
      </div>

      {/* 数据管理 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download size={16} /> 数据管理
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={async () => {
            try {
              const json = await exportAllData()
              const blob = new Blob([json], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `yijian-backup-${new Date().toISOString().slice(0, 10)}.json`
              a.click()
              URL.revokeObjectURL(url)
              setBackupMsg('备份文件已下载')
            } catch (e) { setBackupMsg('导出失败: ' + e.message) }
          }}>
            <Download size={14} /> 导出备份
          </button>
          <button className="btn" onClick={() => importRef.current?.click()}>
            <Upload size={14} /> 导入恢复
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files[0]
            if (!file) return
            if (!confirm('导入将覆盖当前所有数据，确定继续？')) { e.target.value = ''; return }
            try {
              const text = await file.text()
              const result = await importAllData(text)
              setBackupMsg(`恢复成功：${result.items}件衣物，${result.outfits}条穿着记录`)
            } catch (err) { setBackupMsg('导入失败: ' + err.message) }
            e.target.value = ''
          }} />
        </div>
        {backupMsg && <div style={{ fontSize: 13, color: 'var(--green)', marginTop: 8 }}>{backupMsg}</div>}
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
          删除桌面图标前请先导出备份，重新添加后导入恢复
        </div>
      </div>

      {/* 关于 */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)', marginBottom: 8 }}>关于</div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8 }}>
          <div>衣见 v1.0</div>
          <div>AI穿搭助手 - 每天帮你选衣服</div>
          <div style={{ marginTop: 4, fontSize: 12 }}>Powered by Gene&I Scientific</div>
        </div>
      </div>
    </div>
  )
}
