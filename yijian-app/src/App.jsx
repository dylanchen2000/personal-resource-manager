import { useState } from 'react'
import { Shirt, Sparkles, BarChart3, Settings as SettingsIcon } from 'lucide-react'
import Today from './pages/Today'
import Wardrobe from './pages/Wardrobe'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

const TABS = [
  { id: 'today', label: '今天', icon: Sparkles },
  { id: 'wardrobe', label: '衣橱', icon: Shirt },
  { id: 'stats', label: '统计', icon: BarChart3 },
  { id: 'settings', label: '设置', icon: SettingsIcon },
]

export default function App() {
  const [page, setPage] = useState('today')

  return (
    <div className="app">
      <main className="app-main">
        {page === 'today' && <Today onNavigate={setPage} />}
        {page === 'wardrobe' && <Wardrobe onNavigate={setPage} />}
        {page === 'stats' && <Stats />}
        {page === 'settings' && <Settings />}
      </main>

      {/* 底部导航栏（手机优先） */}
      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`bottom-nav-item ${page === tab.id ? 'active' : ''}`}
            onClick={() => setPage(tab.id)}
          >
            <tab.icon size={22} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
