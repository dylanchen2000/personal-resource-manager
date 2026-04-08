// AI 搭配推荐引擎
// 规则引擎 + AI Gateway增强

const AI_API_URL = 'https://ai-gateway.happycapy.ai/api/v1/chat/completions'
const AI_MODEL = 'anthropic/claude-haiku-4-5'

// 颜色搭配规则
const COLOR_MATCH = {
  '黑': ['白', '灰', '蓝', '红', '卡其', '军绿'],
  '白': ['黑', '蓝', '灰', '卡其', '军绿', '红'],
  '灰': ['黑', '白', '蓝', '酒红'],
  '蓝': ['白', '灰', '卡其', '黑'],
  '卡其': ['白', '蓝', '黑', '军绿', '酒红'],
  '军绿': ['黑', '白', '卡其', '灰'],
  '红': ['黑', '白', '灰'],
  '酒红': ['灰', '卡其', '黑', '白'],
}

// 场景适配
const SCENE_CATEGORY_MAP = {
  '日常': ['上装', '下装', '鞋', '帽子'],
  '工作': ['上装', '下装', '鞋', '正装'],
  '商务': ['正装', '上装', '下装', '鞋'],
  '运动': ['运动', '鞋', '帽子'],
  '聚会': ['上装', '下装', '鞋', '配饰'],
  '户外': ['外套', '上装', '下装', '鞋', '帽子'],
}

// 规则引擎搭配
export function ruleBasedOutfit(items, weather, scene = '日常') {
  if (!items || items.length === 0) return null

  const temp = weather?.temp ?? 22
  const rainChance = weather?.rainChance ?? 0
  const categories = SCENE_CATEGORY_MAP[scene] || SCENE_CATEGORY_MAP['日常']

  // 按品类筛选
  const pool = {}
  for (const cat of ['上装', '下装', '外套', '鞋', '帽子', '配饰', '正装', '运动']) {
    pool[cat] = items.filter(i => i.category === cat && matchSeason(i, temp) && matchScene(i, scene))
  }

  const outfit = { items: [], tips: [] }

  // 选上装
  const tops = scene === '商务' ? [...pool['正装'], ...pool['上装']] : pool['上装']
  if (tops.length > 0) {
    const top = pickLeastWorn(tops)
    outfit.items.push(top)
  }

  // 选下装
  if (pool['下装'].length > 0) {
    const bottom = pickLeastWorn(pool['下装'])
    outfit.items.push(bottom)
  }

  // 温度低加外套
  if (temp < 20 && pool['外套'].length > 0) {
    outfit.items.push(pickLeastWorn(pool['外套']))
    outfit.tips.push(`今天${temp}度，建议加外套`)
  }

  // 选鞋
  if (pool['鞋'].length > 0) {
    const shoes = pickLeastWorn(pool['鞋'])
    outfit.items.push(shoes)
  }

  // 选帽子
  if (pool['帽子'].length > 0) {
    outfit.items.push(pickLeastWorn(pool['帽子']))
  }

  // 下雨提示
  if (rainChance > 50) {
    outfit.tips.push(`降雨概率${rainChance}%，记得带伞`)
  }

  return outfit
}

function matchSeason(item, temp) {
  if (!item.season || item.season === '四季') return true
  if (item.season === '夏' && temp >= 25) return true
  if (item.season === '冬' && temp < 10) return true
  if (item.season === '春秋' && temp >= 10 && temp < 25) return true
  return false
}

function matchScene(item, scene) {
  if (!item.scenes || item.scenes.length === 0) return true
  return item.scenes.includes(scene) || item.scenes.includes('日常')
}

// 优先选最久没穿的（发现被遗忘的好东西），带随机性以生成不同方案
function pickLeastWorn(items) {
  if (items.length === 0) return null
  // 30%概率选从未穿过的（惊喜感）
  const neverWorn = items.filter(i => !i.lastWorn)
  if (neverWorn.length > 0 && Math.random() < 0.3) {
    return neverWorn[Math.floor(Math.random() * neverWorn.length)]
  }
  // 按最久没穿排序，从前3名中随机选（保证多样性）
  const sorted = [...items].sort((a, b) => (a.lastWorn || 0) - (b.lastWorn || 0))
  const topN = Math.min(3, sorted.length)
  return sorted[Math.floor(Math.random() * topN)]
}

// 生成多套方案（衣物少时自动减少方案数，避免重复）
export function generateOutfits(items, weather, scene = '日常', count = 3) {
  const results = []
  const usedSignatures = new Set() // 用签名去重

  for (let i = 0; i < count + 2; i++) { // 多尝试几次
    if (results.length >= count) break
    const outfit = ruleBasedOutfit(items, weather, scene)
    if (outfit && outfit.items.length >= 2) {
      // 用itemId组合作为签名去重
      const sig = outfit.items.map(i => i.id).sort().join(',')
      if (!usedSignatures.has(sig)) {
        usedSignatures.add(sig)
        results.push(outfit)
      }
    }
  }
  return results
}

// AI增强（可选）
export async function aiEnhancedOutfit(items, weather, scene, userProfile) {
  const key = import.meta.env.VITE_AI_GATEWAY_KEY
  if (!key) return null

  const itemsSummary = items.slice(0, 30).map(i =>
    `[${i.id}] ${i.category} | ${i.color || ''} | ${i.name || ''} | 穿${i.wearCount || 0}次 | ${i.story ? '有故事' : ''}`
  ).join('\n')

  try {
    const resp = await fetch(AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `你是"衣见"App的AI穿衣顾问。用户是一位177cm/75kg的男性，科技公司创始人兼跑步俱乐部主理人，日常戴帽子。
风格偏好：实用、不浮夸、有品但不刻意。不需要太正式。
你的任务：从用户衣橱中选出今日搭配方案。
特别注意：优先选"很久没穿的好东西"（唤醒被遗忘的衣物），如果衣物有"故事"，在建议中温暖地提及。
回复JSON格式：{"items":[衣物id列表],"reason":"搭配理由（简短温暖）","tips":["穿着小贴士"]}`
          },
          {
            role: 'user',
            content: `今天天气：${weather?.temp || 22}度，${weather?.weatherDesc || '晴'}，降雨${weather?.rainChance || 0}%
场景：${scene}
我的衣橱：
${itemsSummary}`
          }
        ],
        temperature: 0.8,
      }),
    })
    if (!resp.ok) return null
    const data = await resp.json()
    const text = data.choices?.[0]?.message?.content || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch (e) {
    console.warn('AI搭配调用失败:', e)
  }
  return null
}
