import { useState } from 'react'
import { LayoutDashboard, Users, CircleDot, HeartHandshake, Share2, Upload } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import ContactDetail from './pages/ContactDetail'
import Circles from './pages/Circles'
import Favors from './pages/Favors'
import SharePage from './pages/SharePage'
import Import from './pages/Import'

const NAV = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { id: 'contacts', label: '联系人', icon: Users },
  { id: 'import', label: '导入', icon: Upload },
  { id: 'circles', label: '圈子', icon: CircleDot },
  { id: 'favors', label: '人情', icon: HeartHandshake },
  { id: 'share', label: '分享', icon: Share2 },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [previousPage, setPreviousPage] = useState('contacts')
  const [selectedContactId, setSelectedContactId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)

  const openContact = (id) => {
    setPreviousPage(page)
    setSelectedContactId(id)
    setPage('contact-detail')
  }

  const goBack = () => {
    setSelectedContactId(null)
    setPage(previousPage)
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard key={refreshKey} onOpenContact={openContact} onNavigate={setPage} />
      case 'contacts':
        return <Contacts key={refreshKey} onOpenContact={openContact} onRefresh={refresh} />
      case 'contact-detail':
        return <ContactDetail key={selectedContactId} contactId={selectedContactId} onBack={goBack} onRefresh={refresh} />
      case 'circles':
        return <Circles key={refreshKey} onRefresh={refresh} />
      case 'import':
        return <Import key={refreshKey} onDone={() => setPage('contacts')} onRefresh={refresh} />
      case 'favors':
        return <Favors key={refreshKey} onOpenContact={openContact} />
      case 'share':
        return <SharePage key={refreshKey} />
      default:
        return <Dashboard key={refreshKey} onOpenContact={openContact} onNavigate={setPage} />
    }
  }

  return (
    <>
      <nav className="sidebar">
        <div className="sidebar-brand">
          <h1>友人记</h1>
          <p>人脉资源管理</p>
        </div>
        <div className="sidebar-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <main className="main-content">
        {renderPage()}
      </main>
    </>
  )
}
