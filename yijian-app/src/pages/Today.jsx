import { useState, useEffect } from 'react'
import { Sun, Cloud, CloudRain, Thermometer, RefreshCw, Check, ChevronRight } from 'lucide-react'
import { getItems, saveOutfit, getOutfits, getSetting, SCENES } from '../utils/store'
import { getWeather, getTempAdvice } from '../utils/weather'
import { generateOutfits } from '../utils/ai'

const weatherIcons = {
  '晴': Sun, '大部晴': Sun, '多云': Cloud, '阴': Cloud,
  '小雨': CloudRain, '中雨': CloudRain, '大雨': CloudRain, '阵雨': CloudRain,
}

export default function Today({ onNavigate }) {
  const [weather, setWeather] = useState(null)
  const [outfits, setOutfits] = useState([])
  const [scene, setScene] = useState('日常')
  const [selected, setSelected] = useState(0)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [itemCount, setItemCount] = useState(0)
  const [userName, setUserName] = useState('道俊')

  useEffect(() => {
    getSetting('userName').then(n => { if (n) setUserName(n) })
    load()
  }, [])
  // 仅scene变化时重新推荐，weather变化由load处理
  useEffect(() => { if (weather) recommend() }, [scene])

  async function load() {
    setLoading(true)
    const [w, items, recentOutfits] = await Promise.all([getWeather(), getItems(), getOutfits(5)])
    setWeather(w)
    setItemCount(items.length)
    // 检查今天是否已记录穿着
    const today = new Date().toDateString()
    const todayOutfit = recentOutfits.find(o => new Date(o.date).toDateString() === today)
    if (todayOutfit) setSaved(true)
    if (items.length > 0) {
      const results = generateOutfits(items, w, scene)
      setOutfits(results)
    }
    setLoading(false)
  }

  async function recommend() {
    const items = await getItems()
    if (items.length > 0) {
      const results = generateOutfits(items, weather, scene)
      setOutfits(results)
      setSelected(0)
      setSaved(false)
    }
  }

  async function handleWear() {
    if (!outfits[selected]) return
    await saveOutfit({
      date: Date.now(),
      itemIds: outfits[selected].items.map(i => i.id),
      scene,
      weather: weather ? { temp: weather.temp, desc: weather.weatherDesc } : null,
    })
    setSaved(true)
  }

  const tempAdvice = weather ? getTempAdvice(weather.temp) : null
  const WeatherIcon = weather ? (weatherIcons[weather.weatherDesc] || Cloud) : Cloud
  const greeting = getGreeting(userName)

  return (
    <div className="today-page">
      {/* 问候 + 天气 */}
      <div className="today-header">
        <div className="greeting">
          <h1>{greeting}</h1>
          <p className="date">{formatDate()}</p>
        </div>
        {weather && (
          <div className="weather-card">
            <div className="weather-main">
              <WeatherIcon size={28} />
              <span className="weather-temp">{weather.temp}°</span>
              <span className="weather-desc">{weather.weatherDesc}</span>
            </div>
            <div className="weather-detail">
              <span>{weather.todayMin}°~{weather.todayMax}°</span>
              {weather.rainChance > 20 && <span className="rain-warn">降雨{weather.rainChance}%</span>}
            </div>
            {tempAdvice && <div className="temp-advice">{tempAdvice.advice}</div>}
          </div>
        )}
      </div>

      {/* 场景选择 */}
      <div className="scene-bar">
        <span className="scene-label">今天的场景</span>
        <div className="scene-chips">
          {SCENES.map(s => (
            <button
              key={s.value}
              className={`scene-chip ${scene === s.value ? 'active' : ''}`}
              style={scene === s.value ? { background: s.color, borderColor: s.color } : {}}
              onClick={() => setScene(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 衣橱为空 */}
      {!loading && itemCount === 0 && (
        <div className="empty-wardrobe">
          <div className="empty-icon">👔</div>
          <h3>衣橱还是空的</h3>
          <p>先拍几件衣服入库，我才能帮你搭配</p>
          <button className="btn btn-primary" onClick={() => onNavigate('wardrobe')}>
            去录入衣物 <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 衣物太少无法搭配 */}
      {!loading && itemCount > 0 && outfits.length === 0 && (
        <div className="empty-wardrobe">
          <div className="empty-icon">👕</div>
          <h3>衣物还不够搭配</h3>
          <p>至少录入上装+下装各一件，才能生成搭配方案</p>
          <button className="btn btn-primary" onClick={() => onNavigate('wardrobe')}>
            继续录入 <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 搭配方案 */}
      {outfits.length > 0 && (
        <div className="outfit-section">
          <div className="outfit-header">
            <h2>今日推荐</h2>
            <button className="btn-icon" onClick={recommend} title="换一批">
              <RefreshCw size={18} />
            </button>
          </div>

          {/* 方案切换 */}
          <div className="outfit-tabs">
            {outfits.map((_, i) => (
              <button
                key={i}
                className={`outfit-tab ${selected === i ? 'active' : ''}`}
                onClick={() => { setSelected(i); setSaved(false) }}
              >
                方案 {i + 1}
              </button>
            ))}
          </div>

          {/* 当前方案 */}
          <div className="outfit-display">
            <div className="outfit-items">
              {outfits[selected]?.items.map(item => (
                <div key={item.id} className="outfit-item-card">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="outfit-item-img" />
                  ) : (
                    <div className="outfit-item-placeholder">{item.name?.charAt(0) || item.category}</div>
                  )}
                  <div className="outfit-item-info">
                    <div className="outfit-item-name">{item.name || item.category}</div>
                    <div className="outfit-item-meta">{item.color} {item.category}</div>
                    {item.story && <div className="outfit-item-story">"{item.story}"</div>}
                    {item.people?.length > 0 && <div className="outfit-item-people">和 {item.people.join('、')}</div>}
                    {!item.lastWorn && <div className="outfit-item-badge">久未翻牌</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* 搭配建议 */}
            {outfits[selected]?.tips?.length > 0 && (
              <div className="outfit-tips">
                {outfits[selected].tips.map((tip, i) => (
                  <div key={i} className="tip">{tip}</div>
                ))}
              </div>
            )}

            {/* 确认按钮 */}
            <button
              className={`btn-wear ${saved ? 'saved' : ''}`}
              onClick={handleWear}
              disabled={saved}
            >
              {saved ? <><Check size={18} /> 已记录今日穿着</> : '就穿这套'}
            </button>
          </div>
        </div>
      )}

      {/* 加载中 */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>正在为你搭配...</p>
        </div>
      )}
    </div>
  )
}

function getGreeting(name = '道俊') {
  const h = new Date().getHours()
  if (h < 6) return `夜深了，${name}`
  if (h < 9) return `早上好，${name}`
  if (h < 12) return `上午好，${name}`
  if (h < 14) return `中午好，${name}`
  if (h < 18) return `下午好，${name}`
  return `晚上好，${name}`
}

function formatDate() {
  const d = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
}
