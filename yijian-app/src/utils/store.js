import localforage from 'localforage'

const wardrobeDB = localforage.createInstance({ name: 'yijian', storeName: 'wardrobe' })
const outfitsDB = localforage.createInstance({ name: 'yijian', storeName: 'outfits' })
const settingsDB = localforage.createInstance({ name: 'yijian', storeName: 'settings' })

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

// 常用颜色
export const COLORS = [
  { value: '黑', label: '黑' },
  { value: '白', label: '白' },
  { value: '灰', label: '灰' },
  { value: '深蓝', label: '深蓝' },
  { value: '浅蓝', label: '浅蓝' },
  { value: '卡其', label: '卡其' },
  { value: '军绿', label: '军绿' },
  { value: '酒红', label: '酒红' },
  { value: '红', label: '红' },
  { value: '棕', label: '棕' },
  { value: '米', label: '米' },
  { value: '藏青', label: '藏青' },
]

// 获得场景
export const ACQUIRE_SCENES = [
  { value: '自购', label: '自购' },
  { value: '出差', label: '出差' },
  { value: '旅行', label: '旅行' },
  { value: '礼物', label: '礼物' },
  { value: '活动', label: '活动' },
  { value: '网购', label: '网购' },
]

// 衣物品类
export const CATEGORIES = [
  { value: '上装', label: '上装', icon: '👔' },
  { value: '下装', label: '下装', icon: '👖' },
  { value: '外套', label: '外套', icon: '🧥' },
  { value: '鞋', label: '鞋', icon: '👟' },
  { value: '帽子', label: '帽子', icon: '🧢' },
  { value: '配饰', label: '配饰', icon: '⌚' },
  { value: '运动', label: '运动', icon: '🏃' },
  { value: '正装', label: '正装', icon: '👔' },
]

// 场景标签
export const SCENES = [
  { value: '日常', label: '日常', color: '#60a5fa' },
  { value: '工作', label: '工作', color: '#34d399' },
  { value: '商务', label: '商务', color: '#a78bfa' },
  { value: '运动', label: '运动', color: '#fb923c' },
  { value: '聚会', label: '聚会', color: '#f472b6' },
  { value: '户外', label: '户外', color: '#fbbf24' },
]

// 季节
export const SEASONS = [
  { value: '春秋', label: '春秋' },
  { value: '夏', label: '夏' },
  { value: '冬', label: '冬' },
  { value: '四季', label: '四季' },
]

// === 衣物操作 ===
export async function getItems() {
  const items = []
  await wardrobeDB.iterate((value) => { items.push(value) })
  return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getItem(id) {
  return await wardrobeDB.getItem(id)
}

export async function saveItem(item) {
  const now = Date.now()
  if (!item.id) {
    item.id = 'w_' + genId()
    item.createdAt = now
    item.wearCount = 0
  }
  item.updatedAt = now
  await wardrobeDB.setItem(item.id, item)
  return item
}

export async function deleteItem(id) {
  await wardrobeDB.removeItem(id)
}

// === 穿着记录 ===
export async function getOutfits(limit) {
  const items = []
  await outfitsDB.iterate((value) => { items.push(value) })
  const sorted = items.sort((a, b) => (b.date || 0) - (a.date || 0))
  return limit ? sorted.slice(0, limit) : sorted
}

export async function saveOutfit(outfit) {
  if (!outfit.id) outfit.id = 'o_' + genId()
  outfit.createdAt = Date.now()
  await outfitsDB.setItem(outfit.id, outfit)

  // 更新每件衣物的穿着次数和最后穿着时间
  for (const itemId of (outfit.itemIds || [])) {
    const item = await wardrobeDB.getItem(itemId)
    if (item) {
      item.wearCount = (item.wearCount || 0) + 1
      item.lastWorn = outfit.date || Date.now()
      item.updatedAt = Date.now()
      await wardrobeDB.setItem(item.id, item)
    }
  }
  return outfit
}

// === 设置 ===
export async function getSetting(key) {
  return await settingsDB.getItem(key)
}

export async function setSetting(key, value) {
  await settingsDB.setItem(key, value)
}

// === 数据备份/恢复 ===
export async function exportAllData() {
  const items = []
  await wardrobeDB.iterate((v) => { items.push(v) })
  const outfits = []
  await outfitsDB.iterate((v) => { outfits.push(v) })
  const settings = {}
  await settingsDB.iterate((v, k) => { settings[k] = v })
  return JSON.stringify({ items, outfits, settings, exportedAt: new Date().toISOString(), version: 1 })
}

export async function importAllData(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (!data.items) throw new Error('无效的备份数据')
  // 清空后写入
  await wardrobeDB.clear()
  for (const item of data.items) await wardrobeDB.setItem(item.id, item)
  await outfitsDB.clear()
  for (const outfit of (data.outfits || [])) await outfitsDB.setItem(outfit.id, outfit)
  if (data.settings) {
    await settingsDB.clear()
    for (const [k, v] of Object.entries(data.settings)) await settingsDB.setItem(k, v)
  }
  return { items: data.items.length, outfits: (data.outfits || []).length }
}

// === 统计 ===
export async function getStats() {
  const items = await getItems()
  const outfits = await getOutfits()

  const total = items.length
  const byCategory = {}
  CATEGORIES.forEach(c => { byCategory[c.value] = 0 })
  items.forEach(i => { if (byCategory[i.category] !== undefined) byCategory[i.category]++ })

  // 30天内没穿过的（排除7天内新录入的）
  const thirtyDaysAgo = Date.now() - 30 * 86400000
  const sevenDaysAgo = Date.now() - 7 * 86400000
  const forgotten = items.filter(i =>
    i.category !== '运动' &&
    (!i.lastWorn || i.lastWorn < thirtyDaysAgo) &&
    (i.createdAt || 0) < sevenDaysAgo // 新录入的不算遗忘
  )

  // 最常穿的
  const topWorn = [...items].filter(i => i.wearCount > 0).sort((a, b) => b.wearCount - a.wearCount).slice(0, 5)

  // 从未穿过
  const neverWorn = items.filter(i => !i.wearCount || i.wearCount === 0)

  return { total, byCategory, forgotten, topWorn, neverWorn, outfitCount: outfits.length }
}
