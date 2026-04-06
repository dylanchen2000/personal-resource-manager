// 名字首字取色
const COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#f97316','#14b8a6']

export function nameColor(name) {
  if (!name) return COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function nameInitial(name) {
  if (!name) return '?'
  return name.charAt(0)
}

// 相对时间
export function timeAgo(ts) {
  if (!ts) return '未知'
  const diff = Date.now() - ts
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

// 格式化日期
export function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 今日日期字符串 YYYY-MM-DD
export function todayStr() {
  return formatDate(Date.now())
}

// 距离天数（正数=过去N天，负数=未来N天）
export function daysSince(ts) {
  if (!ts) return Infinity
  return Math.floor((Date.now() - ts) / 86400000)
}

// 格式化金额
export function formatAmount(amount) {
  if (amount === null || amount === undefined || amount === '') return ''
  const n = parseFloat(amount)
  if (isNaN(n)) return amount
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
