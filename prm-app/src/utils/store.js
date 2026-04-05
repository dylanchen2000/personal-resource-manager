import localforage from 'localforage'

// 初始化存储实例
const contactsDB = localforage.createInstance({ name: 'prm', storeName: 'contacts' })
const circlesDB = localforage.createInstance({ name: 'prm', storeName: 'circles' })
const interactionsDB = localforage.createInstance({ name: 'prm', storeName: 'interactions' })

// 生成ID
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

// 默认圈子
const DEFAULT_CIRCLES = [
  { id: 'c_gebi', name: '戈友圈', color: '#f59e0b', icon: '🏜️', desc: '戈壁挑战赛结识的朋友' },
  { id: 'c_shayou', name: '沙友圈', color: '#ef4444', icon: '🏜️', desc: '沙漠挑战赛伙伴' },
  { id: 'c_alumni', name: '校友圈', color: '#3b82f6', icon: '🎓', desc: '同窗校友' },
  { id: 'c_sports', name: '体育圈', color: '#10b981', icon: '⚽', desc: '运动相关朋友' },
  { id: 'c_hobby', name: '同好圈', color: '#8b5cf6', icon: '🎯', desc: '共同爱好者' },
  { id: 'c_biz', name: '商业圈', color: '#6366f1', icon: '💼', desc: '商业合作伙伴' },
  { id: 'c_family', name: '家人亲友', color: '#ec4899', icon: '❤️', desc: '家人和亲戚' },
]

// 人情分类
export const FAVOR_TYPES = [
  { value: null, label: '无', color: '#64748b' },
  { value: '有恩于我', label: '有恩于我', color: '#f59e0b' },
  { value: '有恩于他', label: '有恩于他', color: '#3b82f6' },
]

// 策略分类
export const STRATEGY_TYPES = [
  { value: null, label: '未定', color: '#64748b' },
  { value: '加密', label: '加密', color: '#10b981', desc: '加强联系' },
  { value: '保持', label: '保持', color: '#3b82f6', desc: '维持现状' },
  { value: '淡出', label: '淡出', color: '#94a3b8', desc: '逐步减少联系' },
]

// 互动类型
export const INTERACTION_TYPES = [
  { value: '见面', label: '见面', icon: '🤝' },
  { value: '电话', label: '电话', icon: '📞' },
  { value: '微信', label: '微信', icon: '💬' },
  { value: '饭局', label: '饭局', icon: '🍜' },
  { value: '帮忙', label: '帮忙', icon: '🤲' },
  { value: '活动', label: '活动', icon: '🎪' },
  { value: '送礼', label: '送礼', icon: '🎁' },
  { value: '其他', label: '其他', icon: '📝' },
]

// === 圈子操作 ===
export async function getCircles() {
  const keys = await circlesDB.keys()
  if (keys.length === 0) {
    // 初始化默认圈子
    for (const c of DEFAULT_CIRCLES) {
      await circlesDB.setItem(c.id, c)
    }
    return [...DEFAULT_CIRCLES]
  }
  const circles = []
  for (const key of keys) {
    circles.push(await circlesDB.getItem(key))
  }
  return circles.sort((a, b) => (a.name > b.name ? 1 : -1))
}

export async function saveCircle(circle) {
  if (!circle.id) circle.id = 'c_' + genId()
  await circlesDB.setItem(circle.id, circle)
  return circle
}

export async function deleteCircle(id) {
  await circlesDB.removeItem(id)
}

// === 联系人操作 ===
export async function getContacts() {
  const contacts = []
  await contactsDB.iterate((value) => { contacts.push(value) })
  return contacts.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export async function getContact(id) {
  return await contactsDB.getItem(id)
}

export async function saveContact(contact) {
  const now = Date.now()
  if (!contact.id) {
    contact.id = 'p_' + genId()
    contact.createdAt = now
  }
  contact.updatedAt = now
  await contactsDB.setItem(contact.id, contact)
  return contact
}

export async function deleteContact(id) {
  await contactsDB.removeItem(id)
  // 同时删除相关互动
  const keys = await interactionsDB.keys()
  for (const key of keys) {
    const item = await interactionsDB.getItem(key)
    if (item && item.contactId === id) {
      await interactionsDB.removeItem(key)
    }
  }
}

// === 互动记录操作 ===
export async function getInteractions(contactId) {
  const items = []
  await interactionsDB.iterate((value) => {
    if (!contactId || value.contactId === contactId) items.push(value)
  })
  return items.sort((a, b) => (b.date || 0) - (a.date || 0))
}

export async function saveInteraction(interaction) {
  if (!interaction.id) interaction.id = 'i_' + genId()
  await interactionsDB.setItem(interaction.id, interaction)
  // 更新联系人的最后联系时间
  if (interaction.contactId) {
    const contact = await contactsDB.getItem(interaction.contactId)
    if (contact) {
      contact.lastContact = interaction.date || Date.now()
      contact.updatedAt = Date.now()
      await contactsDB.setItem(contact.id, contact)
    }
  }
  return interaction
}

export async function deleteInteraction(id) {
  await interactionsDB.removeItem(id)
}

// === 统计 ===
export async function getStats() {
  const contacts = await getContacts()
  const circles = await getCircles()
  const interactions = await getInteractions()

  const favorMe = contacts.filter(c => c.favor === '有恩于我').length
  const favorThem = contacts.filter(c => c.favor === '有恩于他').length
  const strengthen = contacts.filter(c => c.strategy === '加密').length
  const maintain = contacts.filter(c => c.strategy === '保持').length
  const fadeOut = contacts.filter(c => c.strategy === '淡出').length

  // 30天内未联系的"加密"联系人
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const needAttention = contacts.filter(c =>
    c.strategy === '加密' && (!c.lastContact || c.lastContact < thirtyDaysAgo)
  )

  // 7天内未联系的"有恩于我"
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const favorReminders = contacts.filter(c =>
    c.favor === '有恩于我' && (!c.lastContact || c.lastContact < sevenDaysAgo)
  )

  return {
    totalContacts: contacts.length,
    totalCircles: circles.length,
    totalInteractions: interactions.length,
    favorMe, favorThem,
    strengthen, maintain, fadeOut,
    needAttention,
    favorReminders,
  }
}

// === 导出/导入 ===
export async function exportAll() {
  const contacts = await getContacts()
  const circles = await getCircles()
  const interactions = await getInteractions()
  return { contacts, circles, interactions, exportedAt: new Date().toISOString() }
}

export async function importAll(data) {
  if (data.circles) {
    for (const c of data.circles) await circlesDB.setItem(c.id, c)
  }
  if (data.contacts) {
    for (const c of data.contacts) await contactsDB.setItem(c.id, c)
  }
  if (data.interactions) {
    for (const i of data.interactions) await interactionsDB.setItem(i.id, i)
  }
}
