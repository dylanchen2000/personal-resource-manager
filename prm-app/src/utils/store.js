import localforage from 'localforage'

// 初始化存储实例
const contactsDB = localforage.createInstance({ name: 'prm', storeName: 'contacts' })
const circlesDB = localforage.createInstance({ name: 'prm', storeName: 'circles' })
const interactionsDB = localforage.createInstance({ name: 'prm', storeName: 'interactions' })
const favorsDB = localforage.createInstance({ name: 'prm', storeName: 'favors' })

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

// 提醒频率
export const REMINDER_FREQUENCIES = [
  { value: null, label: '不提醒', days: null },
  { value: '每周', label: '每周', days: 7 },
  { value: '每两周', label: '每两周', days: 14 },
  { value: '每月', label: '每月', days: 30 },
  { value: '每季度', label: '每季度', days: 90 },
  { value: '每半年', label: '每半年', days: 180 },
  { value: '每年', label: '每年', days: 365 },
]

// 人情账本类型
export const FAVOR_RECORD_TYPES = [
  { value: '我送礼', label: '我送礼', icon: '🎁', direction: 'out' },
  { value: '他送礼', label: '他送礼', icon: '🎁', direction: 'in' },
  { value: '我帮忙', label: '我帮忙', icon: '🤝', direction: 'out' },
  { value: '他帮忙', label: '他帮忙', icon: '🤝', direction: 'in' },
  { value: '我借钱', label: '我借钱', icon: '💰', direction: 'out' },
  { value: '他借钱', label: '他借钱', icon: '💰', direction: 'in' },
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
  // 同时删除相关人情记录
  const favorKeys = await favorsDB.keys()
  for (const key of favorKeys) {
    const item = await favorsDB.getItem(key)
    if (item && item.contactId === id) {
      await favorsDB.removeItem(key)
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

// === 人情账本操作 ===
export async function getFavorRecords(contactId) {
  const items = []
  await favorsDB.iterate((value) => {
    if (!contactId || value.contactId === contactId) items.push(value)
  })
  return items.sort((a, b) => (b.date || 0) - (a.date || 0))
}

export async function saveFavorRecord(record) {
  if (!record.id) record.id = 'f_' + genId()
  record.updatedAt = Date.now()
  await favorsDB.setItem(record.id, record)
  return record
}

export async function deleteFavorRecord(id) {
  await favorsDB.removeItem(id)
}

// === 计算联系人到期状态 ===
export function getContactDueInfo(contact) {
  const freq = REMINDER_FREQUENCIES.find(f => f.value === contact.reminderFreq)
  if (!freq || !freq.days) return { status: 'none', daysOverdue: 0, dueDate: null }

  const lastContact = contact.lastContact || contact.createdAt || 0
  const dueDate = lastContact + freq.days * 86400000
  const now = Date.now()
  const daysUntilDue = Math.ceil((dueDate - now) / 86400000)

  if (daysUntilDue < 0) return { status: 'overdue', daysOverdue: Math.abs(daysUntilDue), dueDate }
  if (daysUntilDue <= 3) return { status: 'soon', daysOverdue: 0, daysUntilDue, dueDate }
  return { status: 'ok', daysOverdue: 0, daysUntilDue, dueDate }
}

// 关系健康度颜色（绿/黄/红）
export function getHealthColor(contact) {
  if (contact.strategy === '淡出') return '#64748b'
  const freq = REMINDER_FREQUENCIES.find(f => f.value === contact.reminderFreq)
  if (!freq || !freq.days) {
    // 无提醒频率，按默认30天判断
    const lastContact = contact.lastContact || 0
    const days = Math.floor((Date.now() - lastContact) / 86400000)
    if (days <= 30) return '#34d399'
    if (days <= 90) return '#fbbf24'
    return '#f87171'
  }
  const due = getContactDueInfo(contact)
  if (due.status === 'overdue') return '#f87171'
  if (due.status === 'soon') return '#fbbf24'
  return '#34d399'
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

  // 按提醒频率计算"今日待联系"
  const todayDue = contacts.filter(c => {
    const due = getContactDueInfo(c)
    return due.status === 'overdue' || due.status === 'soon'
  }).sort((a, b) => {
    const dueA = getContactDueInfo(a)
    const dueB = getContactDueInfo(b)
    // overdue排前面，然后按紧急程度
    if (dueA.status === 'overdue' && dueB.status !== 'overdue') return -1
    if (dueB.status === 'overdue' && dueA.status !== 'overdue') return 1
    return (dueA.dueDate || 0) - (dueB.dueDate || 0)
  })

  // 30天内未联系的"加密"联系人（没设提醒频率的兜底）
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const needAttention = contacts.filter(c =>
    c.strategy === '加密' && !c.reminderFreq && (!c.lastContact || c.lastContact < thirtyDaysAgo)
  )

  // 7天内未联系的"有恩于我"
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const favorReminders = contacts.filter(c =>
    c.favor === '有恩于我' && (!c.lastContact || c.lastContact < sevenDaysAgo)
  )

  // 今日生日
  const today = new Date()
  const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const birthdayToday = contacts.filter(c => c.birthday && c.birthday.slice(5) === todayMD)

  // 未来7天生日
  const birthdaySoon = contacts.filter(c => {
    if (!c.birthday) return false
    const bMD = c.birthday.slice(5)
    if (bMD === todayMD) return false
    const bDate = new Date(today.getFullYear(), parseInt(bMD.split('-')[0]) - 1, parseInt(bMD.split('-')[1]))
    if (bDate < today) bDate.setFullYear(bDate.getFullYear() + 1)
    const diff = (bDate - today) / 86400000
    return diff > 0 && diff <= 7
  })

  return {
    totalContacts: contacts.length,
    totalCircles: circles.length,
    totalInteractions: interactions.length,
    favorMe, favorThem,
    strengthen, maintain, fadeOut,
    todayDue,
    needAttention,
    favorReminders,
    birthdayToday,
    birthdaySoon,
    contacts,
  }
}

// === Bulk Snooze: 一键分散提醒 ===
export async function bulkSnooze(days = 14) {
  const contacts = await getContacts()
  const overdue = contacts.filter(c => {
    const due = getContactDueInfo(c)
    return due.status === 'overdue' || due.status === 'soon'
  })
  if (overdue.length === 0) return 0

  // 均匀分散到未来N天
  const interval = Math.max(1, Math.floor(days / overdue.length))
  const now = Date.now()
  for (let i = 0; i < overdue.length; i++) {
    const c = overdue[i]
    // 把lastContact设为"假装N天前联系过"，这样提醒会分散开
    const fakeLastContact = now - (c.reminderFreq
      ? (REMINDER_FREQUENCIES.find(f => f.value === c.reminderFreq)?.days || 30) * 86400000
      : 30 * 86400000
    ) + (i * interval * 86400000)
    c.lastContact = fakeLastContact
    c.updatedAt = now
    await contactsDB.setItem(c.id, c)
  }
  return overdue.length
}

// === 导出/导入 ===
export async function exportAll() {
  const contacts = await getContacts()
  const circles = await getCircles()
  const interactions = await getInteractions()
  const favors = await getFavorRecords()
  return { contacts, circles, interactions, favors, exportedAt: new Date().toISOString() }
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
  if (data.favors) {
    for (const f of data.favors) await favorsDB.setItem(f.id, f)
  }
}
