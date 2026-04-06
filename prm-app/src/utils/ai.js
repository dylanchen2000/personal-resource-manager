/**
 * AI工具模块 - 基于社会渗透理论的智能关系建议
 * 优先使用规则引擎，AI Gateway为增强层
 */

const AI_API_URL = 'https://ai-gateway.happycapy.ai/api/v1/chat/completions';
const AI_MODEL = 'anthropic/claude-haiku-4-5';

// ─── 节日日历 ───────────────────────────────────────────────────────────────

const FESTIVALS_2026 = [
  { name: '春节', date: '2026-02-17' },
  { name: '元宵节', date: '2026-03-04' },
  { name: '清明节', date: '2026-04-05' },
  { name: '劳动节', date: '2026-05-01' },
  { name: '端午节', date: '2026-06-19' },
  { name: '七夕', date: '2026-08-06' },
  { name: '中秋节', date: '2026-09-24' },
  { name: '重阳节', date: '2026-10-07' },
  { name: '国庆节', date: '2026-10-01' },
  { name: '元旦', date: '2027-01-01' },
  { name: '春节', date: '2027-02-06' },
];

export function getNextFestival() {
  const today = new Date();
  for (const f of FESTIVALS_2026) {
    const d = new Date(f.date);
    const diffDays = Math.ceil((d - today) / 86400000);
    if (diffDays >= 0) {
      return { name: f.name, date: f.date, daysAway: diffDays };
    }
  }
  return { name: '元旦', date: '2027-01-01', daysAway: 270 };
}

// ─── 规则引擎工具函数 ────────────────────────────────────────────────────────

function getDaysSinceLastContact(lastContact) {
  if (!lastContact) return 999;
  return Math.floor((Date.now() - new Date(lastContact)) / 86400000);
}

function getDunbarLayer(strategy, reminderFreq) {
  if (strategy === '加密' || reminderFreq === '每周' || reminderFreq === '每两周') return 'inner';
  if (strategy === '保持' || reminderFreq === '每月') return 'middle';
  if (strategy === '淡出' || reminderFreq === '每季度' || reminderFreq === '每年') return 'outer';
  return 'middle';
}

function getFavorBalance(favorRecords) {
  if (!favorRecords || favorRecords.length === 0) return 0;
  const IN_TYPES = ['他送礼', '他帮忙', '他借钱'];
  const OUT_TYPES = ['我送礼', '我帮忙', '我借钱'];
  return favorRecords.reduce((sum, r) => {
    if (IN_TYPES.includes(r.type)) return sum + (r.amount || 1);
    if (OUT_TYPES.includes(r.type)) return sum - (r.amount || 1);
    return sum;
  }, 0);
}

function getExpectedFreqDays(reminderFreq) {
  const map = { '每周': 7, '每两周': 14, '每月': 30, '每季度': 90, '每半年': 180, '每年': 365 };
  return map[reminderFreq] || 60;
}

function getChannelByCircle(circles = []) {
  if (circles.includes('家人亲友')) return '电话/视频';
  if (circles.includes('校友圈') || circles.includes('同好圈')) return '微信消息';
  if (circles.includes('戈友圈') || circles.includes('沙友圈') || circles.includes('体育圈')) return '微信/活动邀约';
  if (circles.includes('商业圈')) return '微信/当面约';
  return '微信消息';
}

// ─── 规则引擎：生成消息草稿 ──────────────────────────────────────────────────

function ruleBasedMessageDraft(contact, interactions, favorRecords, occasion) {
  const days = getDaysSinceLastContact(contact.lastContact);
  const layer = getDunbarLayer(contact.strategy, contact.reminderFreq);
  const balance = getFavorBalance(favorRecords);
  const channel = getChannelByCircle(contact.circles);
  const warmUpNeeded = days > 90;
  const festival = getNextFestival();
  const tips = [];

  let message = '';
  const name = contact.nickname || contact.name || '朋友';

  // 预热开场（超过90天未联系必须先寒暄）
  if (warmUpNeeded) {
    message += `${name}，好久不见！最近怎么样？`;
    tips.push('超过90天未联系，建议先寒暄预热，不要直接切入主题');
  }

  // 按场合生成主体
  const occ = occasion || '日常维护';
  if (occ === '生日祝福') {
    message = `${name}，生日快乐！祝你${new Date().getFullYear()}岁岁平安，万事如意～`;
    tips.push('生日祝福发送时间建议：当天早上8-9点，或前一天晚上');
  } else if (occ === '节日问候') {
    message = warmUpNeeded
      ? `${message}\n\n${festival.daysAway <= 7 ? `马上就是${festival.name}了，` : ''}祝你节日快乐！`
      : `${name}，${festival.name}快到了，提前祝你节日快乐！`;
  } else if (occ === '有事请托') {
    if (warmUpNeeded) {
      message += `\n\n最近有件事想请你帮个忙，${layer === 'outer' ? '不知道是否方便——' : ''}`;
      tips.push('有事请托前务必先寒暄，避免"功利性联系"印象');
    } else {
      message += `${name}，有件事想麻烦你一下，${layer === 'outer' ? '不用特意回复，看你方便。' : ''}`;
    }
    if (balance > 2) tips.push('人情余额偏高（对方欠你较多），请托语气可以稍直接');
    if (balance < -2) tips.push('人情余额偏低（你欠对方较多），请托时需更礼貌，并适时回馈');
  } else {
    // 日常维护
    const topics = interactions?.slice(0, 1).map(i => i.content) || [];
    message = warmUpNeeded
      ? `${message}`
      : `${name}，最近忙什么呢？${topics.length ? `上次聊到${topics[0]}，` : ''}有空聊聊～`;
  }

  // 礼貌缓冲（外圈关系）
  if (layer === 'outer' && occ !== '生日祝福') {
    if (!message.includes('不用特意')) message += '（不用特意回复）';
    tips.push('外圈关系建议加"不用特意回复"，降低社交压力');
  }

  // 发送时间建议
  const isElder = contact.title?.includes('长辈') || contact.circles?.includes('长辈');
  const bestTime = isElder ? '上午9:00-10:30' : '晚上19:00-21:00';

  return {
    message: message.trim(),
    channel,
    bestTime,
    tips,
    warmUpNeeded,
  };
}

// ─── 规则引擎：礼物建议 ──────────────────────────────────────────────────────

function ruleBasedGiftSuggestion(contact, favorRecords, occasion) {
  const balance = getFavorBalance(favorRecords);
  const layer = getDunbarLayer(contact.strategy, contact.reminderFreq);
  const tips = [];

  // 金额档次
  const priceMap = {
    inner: balance > 0 ? '500-1000元' : '200-500元',
    middle: balance > 0 ? '200-500元' : '100-200元',
    outer: '50-150元',
  };
  const amountGuide = priceMap[layer] || '100-300元';

  tips.push('忌：钟表（谐音送终）、梨（谐音离）、伞（谐音散）、鞋（谐音邪）');
  tips.push('数量建议双数，寓意成双成对');
  if (balance > 2) tips.push('对方对你有恩，建议适当提高礼品档次');
  if (balance < -2) tips.push('你对对方有恩，选择轻巧但有心意的礼物即可');

  const occasionMap = {
    '生日': [
      { type: '实体', name: '精品茶叶礼盒', reason: '适合各年龄段，寓意健康', priceRange: amountGuide },
      { type: '体验', name: '下午茶邀约', reason: '增进感情，创造共同记忆', priceRange: '150-300元' },
      { type: '数字', name: '视频/语音祝福', reason: '内圈关系尤为走心', priceRange: '0元' },
    ],
    '春节': [
      { type: '实体', name: '坚果礼盒', reason: '春节必备，实用百搭', priceRange: amountGuide },
      { type: '实体', name: '红酒/白酒', reason: '节庆氛围浓，适合男性长辈', priceRange: amountGuide },
      { type: '社交', name: '拜年视频', reason: '真诚表达，成本低效果好', priceRange: '0元' },
    ],
    '中秋': [
      { type: '实体', name: '高端月饼礼盒', reason: '节日标配，简单直接', priceRange: amountGuide },
      { type: '信息', name: '分享一篇有价值的文章/资讯', reason: '体现关注对方的兴趣', priceRange: '0元' },
    ],
    '感谢': [
      { type: '体验', name: '请对方吃饭', reason: '当面致谢，感情最到位', priceRange: amountGuide },
      { type: '社交', name: '引荐有价值的人脉', reason: '非物质礼物，长效回馈', priceRange: '0元' },
      { type: '实体', name: '定制礼品（刻字/定制款）', reason: '彰显心意，印象深刻', priceRange: amountGuide },
    ],
  };

  const suggestions = occasionMap[occasion] || [
    { type: '实体', name: '精品水果礼盒', reason: '通用款，四季皆宜', priceRange: amountGuide },
    { type: '体验', name: '咖啡/茶叙邀约', reason: '轻松增进感情', priceRange: '80-150元' },
    { type: '信息', name: '推荐一本好书或课程', reason: '展现对对方成长的关心', priceRange: '0-100元' },
  ];

  return { suggestions, amountGuide, tips };
}

// ─── 规则引擎：关系健康卡 ────────────────────────────────────────────────────

function ruleBasedContactAdvice(contact, interactions, favorRecords) {
  const days = getDaysSinceLastContact(contact.lastContact);
  const layer = getDunbarLayer(contact.strategy, contact.reminderFreq);
  const balance = getFavorBalance(favorRecords);
  const expectedDays = getExpectedFreqDays(contact.reminderFreq);
  const channel = getChannelByCircle(contact.circles);
  const warnings = [];
  const topicSuggestions = [];

  // 健康分计算
  let score = 100;
  const overdue = days - expectedDays;
  if (overdue > 0) score -= Math.min(40, Math.floor(overdue / 10) * 5);
  if (Math.abs(balance) > 3) score -= 15;
  if (contact.strategy === '淡出') score -= 10;

  // 预警
  if (days > 180) warnings.push(`已${days}天未联系，关系可能已疏远`);
  else if (days > expectedDays) warnings.push(`超过预期联系周期${overdue}天，建议尽快联系`);
  if (balance > 3) warnings.push('人情余额较高，对方可能感到压力，适时回馈');
  if (balance < -3) warnings.push('人情欠账较多，注意维护关系，及时回馈');

  // 话题建议
  const recentTopics = (interactions || []).slice(0, 2).map(i => i.content).filter(Boolean);
  if (recentTopics.length > 0) topicSuggestions.push(`跟进上次聊到的：${recentTopics[0]}`);
  if (contact.circles?.length) topicSuggestions.push(`围绕共同圈子"${contact.circles[0]}"的近况`);
  const festival = getNextFestival();
  if (festival.daysAway <= 14) topicSuggestions.push(`借${festival.name}节点问候`);
  else topicSuggestions.push('分享一条对方可能感兴趣的行业资讯');

  // 关系摘要
  const layerLabel = { inner: '亲密关系', middle: '有效社交', outer: '泛泛之交' }[layer];
  const summary = `${layerLabel} · 人情${balance > 0 ? '余额正向' : balance < 0 ? '有所亏欠' : '基本平衡'} · ${days > expectedDays ? '联系偏少' : '保持良好'}`;

  // 下一步行动
  let nextAction = '';
  if (days > 90) nextAction = `发一条热身消息（如"最近怎样"），重建联系`;
  else if (days > expectedDays) nextAction = `通过${channel}发送一条轻松问候`;
  else nextAction = `维持当前节奏，下次联系约${expectedDays - days}天后`;

  return {
    summary,
    healthScore: Math.max(0, Math.min(100, score)),
    channelAdvice: channel,
    topicSuggestions: topicSuggestions.slice(0, 3),
    warnings,
    nextAction,
  };
}

// ─── AI API 调用 ─────────────────────────────────────────────────────────────

async function callAI(systemPrompt, userPrompt) {
  const key = import.meta.env.VITE_AI_GATEWAY_KEY;
  if (!key) throw new Error('AI_GATEWAY_KEY未配置');

  const resp = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!resp.ok) throw new Error(`AI API错误: ${resp.status}`);
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content || '';
  // 尝试解析JSON
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error('AI响应格式异常');
}

// ─── 公开接口 ────────────────────────────────────────────────────────────────

export async function generateMessageDraft(contact, interactions = [], favorRecords = [], occasion = '') {
  const fallback = ruleBasedMessageDraft(contact, interactions, favorRecords, occasion);
  if (!import.meta.env.VITE_AI_GATEWAY_KEY) return fallback;

  const sys = `你是一位中国人际关系顾问，精通社会渗透理论和礼貌理论。根据用户提供的联系人信息，生成一条自然、合适的中文消息草稿，以JSON格式返回，包含字段：message(消息正文)、channel(推荐渠道)、bestTime(最佳发送时间)、tips(注意事项数组)、warmUpNeeded(布尔值)。`;
  const usr = `联系人：${JSON.stringify(contact)}\n最近互动：${JSON.stringify(interactions.slice(0, 3))}\n人情记录：${JSON.stringify(favorRecords)}\n场合：${occasion || '日常维护'}\n规则引擎草稿参考：${JSON.stringify(fallback)}`;

  try {
    return await callAI(sys, usr);
  } catch {
    return fallback;
  }
}

export async function generateGiftSuggestion(contact, favorRecords = [], occasion = '日常') {
  const fallback = ruleBasedGiftSuggestion(contact, favorRecords, occasion);
  if (!import.meta.env.VITE_AI_GATEWAY_KEY) return fallback;

  const sys = `你是一位中国礼仪顾问，熟悉礼品文化禁忌和人情往来。根据联系人信息和人情记录，给出个性化礼物建议，以JSON返回，包含：suggestions(数组，每项含type/name/reason/priceRange)、amountGuide(金额指引)、tips(注意事项数组)。`;
  const usr = `联系人：${JSON.stringify(contact)}\n人情记录：${JSON.stringify(favorRecords)}\n场合：${occasion}\n参考：${JSON.stringify(fallback)}`;

  try {
    return await callAI(sys, usr);
  } catch {
    return fallback;
  }
}

export async function generateContactAdvice(contact, interactions = [], favorRecords = []) {
  const fallback = ruleBasedContactAdvice(contact, interactions, favorRecords);
  if (!import.meta.env.VITE_AI_GATEWAY_KEY) return fallback;

  const sys = `你是一位人际关系分析师，基于邓巴层理论和中国人情文化，分析联系人关系健康状况。以JSON返回：summary(一句话摘要)、healthScore(0-100整数)、channelAdvice(推荐渠道)、topicSuggestions(3条话题建议数组)、warnings(预警数组)、nextAction(下一步建议)。`;
  const usr = `联系人：${JSON.stringify(contact)}\n互动历史：${JSON.stringify(interactions.slice(0, 5))}\n人情记录：${JSON.stringify(favorRecords)}\n规则引擎结果参考：${JSON.stringify(fallback)}`;

  try {
    return await callAI(sys, usr);
  } catch {
    return fallback;
  }
}
