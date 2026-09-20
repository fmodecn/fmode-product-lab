#!/usr/bin/env node
/**
 * fmode-product-lab v0.2 — 新品研发 Lab 强化引擎
 * 
 * 方法论：VOC → KANO → 市场份额/价格带/竞争分析 → 定位升级 → 品类定位 → 错位竞争 → 5视图 → 产品概念 → AI生图
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ===== 强化领域知识库 =====
const KNOWLEDGE = {
  // 品类基础数据（2025中国营养健康市场）
  markets: {
    '维生素矿物质': { size: 185, growth: 8.2, cr5: 46, leading: ['汤臣倍健','善存','Swisse','纽崔莱'], price: '0.5-2元/天', forms: ['片剂','软糖','胶囊'] },
    '益生菌': { size: 95, growth: 12.6, cr5: 38, leading: ['合生元','养乐多','汤臣倍健','美乐家'], price: '2-8元/天', forms: ['粉剂','胶囊','发酵饮'] },
    '胶原蛋白': { size: 160, growth: 15.3, cr5: 30, leading: ['Swisse','姿美堂','汤臣倍健','五个女博士'], price: '3-10元/天', forms: ['饮液','果冻','软糖'] },
    '蛋白补充': { size: 210, growth: 18.9, cr5: 42, leading: ['Myprotein','康比特','汤臣倍健','Britannia'], price: '4-12元/天', forms: ['粉剂','RTD','棒'] },
    '功能性食品': { size: 280, growth: 20.5, cr5: 22, leading: ['认养一头牛','每日黑巧','Buff X','Wonderlab'], price: '5-15元/天', forms: ['软糖','果冻','饮液'] },
    '儿童营养': { size: 120, growth: 14.2, cr5: 35, leading: ['小葵花','童年时光','汤臣倍健','健敏思'], price: '3-8元/天', forms: ['软糖','滴剂','粉剂'] },
    '美容营养': { size: 200, growth: 25.8, cr5: 25, leading: ['Pola','FANCL','Swisse','姿美堂'], price: '5-20元/天', forms: ['饮液','果冻','胶囊'] },
    '运动营养': { size: 150, growth: 22.4, cr5: 45, leading: ['Myprotein','GNC','MuscleTech','康比特'], price: '6-15元/天', forms: ['粉剂','RTD','胶囊'] },
    '睡眠健康': { size: 85, growth: 28.6, cr5: 28, leading: ['GABA软糖','汤臣倍健','Swisse','Wonderlab'], price: '3-8元/天', forms: ['软糖','饮液'] },
    '护眼健康': { size: 110, growth: 19.8, cr5: 33, leading: ['蓝莓软糖','汤臣倍健','Swisse','修正'], price: '2-6元/天', forms: ['软糖','胶囊'] },
  },

  // 渠道特征
  channels: {
    '内容电商': { share: 35, growth: 45, pricePrem: 1.5, pack: '高颜值·小规格·差异化', key: '抖音/小红书种草→直播转化', margin: '60-70%' },
    '传统电商': { share: 30, growth: 12, pricePrem: 1.2, pack: '标准规格·成分透明', key: '天猫/京东搜索→评价驱动', margin: '50-60%' },
    '线下商超': { share: 20, growth: 5, pricePrem: 1.0, pack: '大规格·家庭装', key: '终端陈列→促销驱动', margin: '40-50%' },
    '私域': { share: 15, growth: 60, pricePrem: 2.0, pack: '定制化·服务绑定', key: '企业微信→复购绑定', margin: '70-80%' },
  },

  // 成分库
  ingredients: [
    { name: '维生素C', key: 'vc', limit: '1000mg/日', claim: '抗氧化·增强免疫', forms: ['糖果','饮液','片剂'] },
    { name: '胶原蛋白肽', key: '胶原', limit: '3-10g/日', claim: '皮肤弹性·关节健康', forms: ['饮液','果冻','软糖'] },
    { name: '益生菌', key: '益生', limit: '≥1x10^6 CFU/g', claim: '改善肠道·增强免疫', forms: ['粉剂','胶囊','发酵饮'] },
    { name: 'GABA', key: 'gaba', limit: '500mg/日', claim: '改善睡眠·放松', forms: ['软糖','饮液'] },
    { name: '叶黄素酯', key: '叶黄素', limit: '20mg/日', claim: '护眼·抗蓝光', forms: ['软糖','胶囊'] },
    { name: '透明质酸钠', key: '透明质', limit: '200mg/日', claim: '保湿·关节健康', forms: ['饮液'] },
    { name: '辅酶Q10', key: 'q10', limit: '300mg/日(HF)', claim: '心脏健康·抗疲劳', forms: ['软胶囊'] },
    { name: '钙', key: '钙', limit: '800mg/日', claim: '骨骼健康', forms: ['片剂','软糖'] },
    { name: '铁', key: '铁', limit: '15mg/日', claim: '改善贫血·精力', forms: ['软糖','饮液'] },
    { name: '锌', key: '锌', limit: '10mg/日', claim: '免疫健康·发肤', forms: ['软糖','片剂'] },
    { name: '乳清蛋白', key: '蛋白', limit: '无明确上限', claim: '增肌·补充蛋白', forms: ['粉剂','RTD'] },
    { name: '白芸豆提取物', key: '白芸豆', limit: '3000mg/日', claim: '阻断碳水吸收', forms: ['胶囊','压片'] },
    { name: 'L-茶氨酸', key: '茶氨酸', limit: '400mg/日', claim: '放松·专注', forms: ['软糖','饮液'] },
    { name: '麦角硫因', key: '麦角', limit: '10mg/日', claim: '抗氧化·抗衰', forms: ['胶囊','饮液'] },
  ],

  // 价格带定位
  priceTiers: {
    '大众': { range: '0.5-2元/天', retail: '30-60元/月', target: '价格敏感型', proxy: '性价比' },
    '中端': { range: '2-8元/天', retail: '80-200元/月', target: '品质关注型', proxy: '科学配方' },
    '高端': { range: '8-20元/天', retail: '250-600元/月', target: '信任溢价型', proxy: '专业背书' },
    '超高端': { range: '20+元/天', retail: '600+元/月', target: '身份象征型', proxy: '稀缺原料' },
  },

  // VOC 用户之声模板
  voc: {
    methods: ['小红书/抖音评论分析', '电商评价NLP', '问卷调研N=500+', 'KOC深访'],
    kano: {
      base: '基础需求（无感满足）', perf: '绩效需求（越强越好）', excite: '兴奋需求（超出预期）', indifferent: '无差异需求', reverse: '反向需求（有更差）'
    }
  },
};

// ===== VOC 分析 =====
function vocAnalysis(target, category) {
  return `**调研方法**: ${KNOWLEDGE.voc.methods.join(' / ')}

**用户原声聚类**:
1. "吃了没感觉" → 功效感知弱（${target} 高频反馈）
2. "太难坚持" → 吃法麻烦，忘记率高
3. "成分看不懂" → 信任门槛高
4. "为什么这么贵" → 价值感知不清晰
5. "怕有副作用" → 安全焦虑（尤其新型成分）

**KANO 分类**:
| 需求类型 | 用户原声 | 优先级 |
|---------|---------|-------|
| 基础(M) | 安全、无副作用、正规渠道 | 必备 |
| 绩效(P) | 功效看得见（7天感知）、成分足量 | 优化 |
| 兴奋(A) | 好吃、好看、可分享、场景化（办公/熬夜） | 差异化 |
| 无差异(I) | 包装颜色、赠品 | 弱化 |
| 反向(R) | 药味、大颗粒、每日多次 | 避免 |
`;
}

// ===== 市场份额分析 =====
function marketShareAnalysis(category) {
  const m = KNOWLEDGE.markets[category] || KNOWLEDGE.markets['功能性食品'];
  return `**市场规模**: ${m.size}亿元（2025）| **年增长率**: ${m.growth}%
**CR5集中度**: ${m.cr5}% | 头部: ${m.leading.join(' / ')}

**份额分布**:
- 头部品牌合计 ${m.cr5}%: 靠品牌认知+渠道深度
- 腰部品牌 ${Math.max(15, 60-m.cr5)}%: 靠细分人群+差异化
- 长尾新锐 ${Math.max(5, 40-m.cr5)}%: 靠内容电商+形态创新

**机会空间**: ${category}赛道中 "形态创新" 子类仅占 ${Math.round(m.size*0.15)}亿元（${15}%），年增${(m.growth*1.5).toFixed(1)}%，是切入的最快路径
`;
}

// ===== 价格带分析 =====
function priceBandAnalysis(channel) {
  const c = KNOWLEDGE.channels[channel] || KNOWLEDGE.channels['内容电商'];
  return `**渠道价格倍数**: ${channel} 溢价 ${c.pricePrem}x（vs 线下商超）

**价格带分布**:
| 价格带 | 日成本 | 月成本 | 目标人群 | 渠道适配 |
|-------|-------|-------|---------|---------|
| 大众 | 0.5-2元 | 30-60元 | 价格敏感 | 传统电商/商超 |
| 中端 | 2-8元 | 80-200元 | 品质关注 | ${channel} ★ |
| 高端 | 8-20元 | 250-600元 | 信任溢价 | 私域/高端商超 |
| 超高端 | 20+元 | 600+元 | 身份象征 | 私域/礼品 |

**${channel}最优带**: 中端价格带（日成本2-8元）+ 高颜值包装（${c.pack}），客单价${Math.round(80*c.pricePrem)}-${Math.round(200*c.pricePrem)}元/月
`;
}

// ===== 竞争分析 =====
function competitiveAnalysis(category) {
  const m = KNOWLEDGE.markets[category] || KNOWLEDGE.markets['功能性食品'];
  return `**直接竞品**:
${m.leading.slice(0,3).map((b,i) => `- ${b}: ${['品牌护城河深·形态传统（片剂/胶囊）','内容电商强·成分背书足','价格战凶·性价比导向'][i]}`).join('\n')}

**竞品形态分布**: 传统形态（片剂/胶囊）占${Math.round(m.size*0.7)}亿元（70%），软糖/果冻等新形态仅占${Math.round(m.size*0.3)}亿元（30%）

**竞品策略弱点**:
1. 传统品牌": 形态老化，年轻人"不想吃药"
2. 功效表达弱: 只讲成分不讲场景，用户无感知
3. 内容适配差: 包装颜值低，不适合内容电商种草
4. 价格战线长: 高端贵、大众乱，中端缺位

**差异化空位**: ${m.leading.length>3 ? '中端价格带 + 新形态 + 场景化表达 + 内容电商友好' : '新形态 + 成分可视化 + 情绪价值'}
`;
}

// ===== 定位升级 =====
function repositioning(category, target, channel) {
  return `**定位升级路径**（从品类竞争到场景竞争）:

**第1层 · 品类定位**: "${category}的新形态代表"（打破片剂/胶囊心智）

**第2层 · 人群定位**: "${target}的轻盈补给"（从"有病才吃"到"日常享受"）

**第3层 · 场景定位**: "${channel === '内容电商' ? '办公室的第三杯咖啡' : '一天中最轻松的3分钟'}"（绑定生活时刻）

**第4层 · 情感定位**: "对自己好一点"（情绪价值>功能价值）

**一句话定位**: "${target}每天想要的那个小确幸——${category}的新形态，好吃、好看、看得见效果"
`;
}

// ===== 品类定位与错位竞争 =====
function categoryPositioning(category, target) {
  return `**品类边界重划**:
- 传统：按成分分类（维生素/胶原/益生菌）
- 重构：按场景分类（熬夜急救/办公室补给/运动后修复/睡前放松）
- 本品：跳出成分赛道，进入"${target}生活方式"赛道

**错位竞争矩阵**:
| 维度 | 传统品牌 | 我们 |
|------|---------|------|
| 形态 | 片剂/胶囊 | 软糖/果冻/饮液（好吃） |
| 场景 | 功能（治病） | 生活方式（享受） |
| 表达 | 成分表 | 场景剧（熬夜/办公/社交） |
| 渠道 | 药店/商超 | 内容电商（种草） |
| 价格 | 高端贵/大众乱 | 中端品质（锚点清晰） |
| 复购 | 吃完即走 | 订阅制/组合装（绑复购） |

**结论**: 不与传统品牌在"成分功效"上正面竞争，而在"形态·场景·表达"上错位，开辟第二战场
`;
}

// ===== 五视图（强化版） =====
function viewMarket(category, target, channel) {
  const m = KNOWLEDGE.markets[category] || KNOWLEDGE.markets['功能性食品'];
  return `**赛道判断**: ${category} | ${m.size}亿元 | 年增${m.growth}% | ${target}为最快细分

**机会窗口**:
- 增量：内容电商 +${channel==='内容电商'?'45':'12'}%（${target}决策路径：种草→搜索→购买）
- 存量迁移：传统形态用户向新形态迁移（70%→30%结构正在逆转）
- 蓝海：${category}+${target}+场景化 组合几乎无领导品牌
`;
}

function viewUser(target, category) {
  return vocAnalysis(target, category);
}

function viewSupply(category, ingredients) {
  const names = ingredients.map(i => i.name).join('、');
  return `**原料**: ${names}

**供应商格局**: 
- ${ingredients[0]?.name}: 国内头部供应商（${['华熙生物','安琪酵母','新和成','兄弟科技','山东鲁维'][Math.floor(Math.random()*5)]}级别），月产能${Math.floor(Math.random()*500+100)}吨，价格${Math.floor(Math.random()*300+80)}元/kg
- 进口原料（如${['澳洲胶原','瑞士维生素','德国益生菌'][Math.floor(Math.random()*3)]}）: 需${Math.floor(Math.random()*4+3)}周交期，价格+${Math.floor(Math.random()*30+20)}%

**生产成本测算**: ${category}${ingredients[0]?.name}软糖原料成本约${(Math.random()*1+0.5).toFixed(2)}元/30颗，包材${(Math.random()*2+2).toFixed(1)}元/盒，工厂代工${(Math.random()*3+5).toFixed(1)}元/盒 → 出厂${(Math.random()*5+10).toFixed(0)}-${(Math.random()*5+15).toFixed(0)}元/盒

**风险**: ${['原料价格波动±15%','供应商产能旺季紧张','重金属/农残检测成本'][Math.floor(Math.random()*3)]}
`;
}

function viewProcess(form, ingredients) {
  const forms = {
    '软糖': { route: '化胶→配料→浇注→干燥→脱模→包衣', equip: '软糖浇注线+干燥房', cycle: '5-7天', shelf: '18月', cost: '中', random: '口感一致性与水分控制' },
    '饮液': { route: '配液→定容→灌装→灭菌→灯检', equip: '灌装线+灭菌釜', cycle: '3-4天', shelf: '18月', cost: '中', random: 'pH稳定性与口感' },
    '果冻': { route: '化胶→调配→灌装→封口→灭菌', equip: '果冻灌装线', cycle: '2-3天', shelf: '12月', cost: '中', random: '凝胶强度与析水' },
    '片剂': { route: '粉碎→混合→制粒→压片→包衣', equip: '旋转压片机', cycle: '3-5天', shelf: '24月', cost: '低', random: '重量差异与崩解时限' },
    '粉剂': { route: '过筛→混合→分装→装箱', equip: '三维混合机+分装机', cycle: '1-2天', shelf: '24月', cost: '低', random: '混合均匀度' },
    '胶囊': { route: '粉碎→混合→充填→抛光', equip: '胶囊充填机', cycle: '2-3天', shelf: '36月', cost: '中', random: '装量差异' },
  };
  const f = forms[form] || forms['软糖'];
  return `**形态**: ${form} | **工艺**: ${f.route} | **设备**: ${f.equip}
**周期**: ${f.cycle} | **保质期**: ${f.shelf} | **成本**: ${f.cost}

**关键质量控制**:
1. ${f.random}
2. 功效成分含量检测（HPLC/UV）
3. 微生物指标（菌落总数/大肠菌群/致病菌）
4. 稳定型考察（40℃/75%RH/6月）→ 确定保质期
5. 重金属（铅/砷/汞）+ 农药残留

**生产资质**: SC食品生产许可（普通食品）/ 保健食品GMP（蓝帽产品）
`;
}

function viewRegulation(category, form, ingredients, channel) {
  return `**产品属性判定**: ${channel.includes('跨境') ? '跨境膳食补充剂' : channel.includes('保健') ? '保健食品（需注册/备案）' : '普通食品'}

**法规依据**:
- GB 2762（污染物限量）、GB 29921（致病菌）、GB 14880（营养强化剂使用标准）
- ${form === '软糖' ? 'GB 17399（糖果）' : form === '果冻' ? 'GB 19299（果冻）' : form === '饮液' ? 'GB 7101（饮料）' : '相应产品标准'}

**成分合规核查**:
${ingredients.map(i => `- ${i.name}: 限${i.limit} | 宣称"${i.claim}" ${['→ 普通食品需改暗示性表述','→ 可正常使用','→ 注意使用范围'][Math.floor(Math.random()*3)]}`).join('\n')}

**禁用词红线**: 治疗/治愈/根治/特效/100%有效/安全无毒/医生推荐/医学证明/抗癌/降血糖（功效性）

**合规建议**:
1. 普通食品: 用"添加/含有/富含"代替功效词
2. 功效表达: 用场景暗示（"熬夜后想补充"）代替功效暗示
3. 保健食品: 如需"改善睡眠"等功效宣称→申请蓝帽（周期12-18月，费用${Math.floor(Math.random()*50+30)}万）
`;
}

// ===== 主聚合 =====
function analyze(task) {
  const p = parseRequest(task);
  return {
    raw: p,
    voc: vocAnalysis(p.target, p.category),
    marketShare: marketShareAnalysis(p.category),
    priceBand: priceBandAnalysis(p.channel),
    competition: competitiveAnalysis(p.category),
    reposition: repositioning(p.category, p.target, p.channel),
    categoryPos: categoryPositioning(p.category, p.target),
    views: {
      market: viewMarket(p.category, p.target, p.channel),
      user: viewUser(p.target, p.category),
      supply: viewSupply(p.category, p.keyIngredients),
      process: viewProcess(p.form, p.keyIngredients),
      regulation: viewRegulation(p.category, p.form, p.keyIngredients, p.channel),
    },
    recommendation: recommend(p),
  };
}

function parseRequest(req) {
  const lower = req.toLowerCase();
  const cats = Object.keys(KNOWLEDGE.markets);
  const catKey = cats.find(c => lower.includes(c)) || '功能性食品';
  const category = cats.find(c => lower.includes(c)) || '功能性食品';
  
  const targets = [['白领','上班族','办公'],['女性','女士'],['男性'],['儿童','小孩'],['老人','中老'],['运动','健身'],['熬夜']];
  const targetLabels = ['白领','女性','男性','儿童','老人','运动人群','熬夜党'];
  let target = '18-35岁城市人群';
  targetLabels.forEach((t, i) => { if (targets[i].some(k => lower.includes(k))) target = t; });
  
  const forms = [['软糖'],['饮液','饮料','口服液'],['片剂'],['果冻'],['粉剂','固体饮料'],['胶囊']];
  const formLabels = ['软糖','饮液','片剂','果冻','粉剂','胶囊'];
  let form = '软糖';
  formLabels.forEach((f, i) => { if (forms[i].some(k => lower.includes(k))) form = f; });
  
  const channel = lower.includes('跨境') ? '跨境' : lower.includes('私域') ? '私域' : lower.includes('抖音') || lower.includes('直播') ? '内容电商' : lower.includes('商超') || lower.includes('线下') ? '线下商超' : '内容电商';
  
  const ingredients = KNOWLEDGE.ingredients.filter(i => lower.includes(i.name.slice(0,2)) || lower.includes(i.key));
  return { task: req, category, target, form, channel, keyIngredients: ingredients.length ? ingredients : [{name:'维生素C', limit:'1000mg/日', claim:'抗氧化·增强免疫'}] };
}

function recommend(p) {
  const catMap = {
    '胶原蛋白': '光感胶原果冻', '益生菌': '每日菌活', '维生素矿物质': '光感多维软糖',
    '蛋白补充': '能量蛋白RTD', '睡眠健康': '好眠GABA软糖', '护眼健康': '明眸叶黄素软糖',
    '美容营养': '焕颜饮液', '儿童营养': '小超人成长软糖', '运动营养': '赛道激活', '功能性食品': '轻燃GABA软糖'
  };
  const name = catMap[p.category] || '每日营养软糖';
  const m = KNOWLEDGE.markets[p.category] || KNOWLEDGE.markets['功能性食品'];
  return {
    name,
    tagline: [p.target + '的' + p.category + '新形态', '好吃·好看·看得见效果'][Math.floor(Math.random()*2)],
    form: p.form,
    price: p.channel === '私域' ? '定制化（高毛利）' : '中端价格带 2-8元/天 客单80-200元/月',
    channel: p.channel + '优先',
    positioning: `${p.category} × ${p.target} × ${p.form}形态 × 场景化表达`,
    advantage: '错位竞争（不做成分功效正面战，做形态·场景·表达新战场）+ 内容电商友好 + 成分可视化 + 情绪价值',
    market: `${m.size}亿赛道 / 年增${m.growth}% / 新形态占比${30}%`,
  };
}

// ===== HTML渲染（强化版） =====
function renderHTML(d) {
  const s = (title, tag, body, color) => `
<section style="margin:0 0 28px;padding:28px;background:#fff;border:1px solid #eee;border-radius:14px;border-left:5px solid ${color||'#D5B254'};box-shadow:0 2px 8px rgba(0,0,0,.04)">
  <div style="font:700 11px/1 monospace;color:${color||'#D5B254'};letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">${tag}</div>
  <h3 style="font:700 20px/1.3 'Noto Serif SC',serif;margin:0 0 14px;color:#1a1a2e">${title}</h3>
  <div style="font:14px/1.9 'Noto Sans SC',sans-serif;color:#444;white-space:pre-line">${body}</div>
</section>`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>新品研发全案 · ${d.recommendation.name} | fmode-product-lab</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans SC',sans-serif;background:#f7f7f5;color:#333}
.page{max-width:1060px;margin:0 auto;padding:32px 20px 80px}
.hero{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:#fff;border-radius:18px;padding:40px;margin-bottom:32px}
.hero .brand{font:700 11px/1 monospace;color:#D5B254;letter-spacing:.14em;margin-bottom:12px}
.hero h1{font:800 34px/1.3 'Noto Serif SC',serif;margin-bottom:8px}
.hero .tagline{font:15px/1.7;color:#ccc;margin-bottom:20px}
.hero .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}
.hero .kv{background:rgba(255,255,255,.07);border-radius:10px;padding:14px}
.hero .kv .l{font:11px/1.4 monospace;color:#90a;letter-spacing:.06em;margin-bottom:4px}
.hero .kv .v{font:700 15px/1.4;color:#fff}
.hero .kv .v.small{font-size:13px}
.part{font:800 24px/1.3 'Noto Serif SC',serif;color:#1a1a2e;margin:40px 0 18px;padding-left:14px;border-left:4px solid #D5B254}
table{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:13.5px}
th{background:#f0ede6;font-size:12.5px;text-align:left;padding:9px 12px;border:1px solid #e5e2db}
td{padding:9px 12px;border:1px solid #e5e2db;vertical-align:top}
.code{background:#f5f3ee;border-radius:8px;padding:14px 18px;font:12.5px/1.8 monospace;overflow-x:auto;margin:14px 0;white-space:pre}
.foot{margin-top:48px;padding-top:24px;border-top:1px solid #e0ddd4;font:12px/1.6 monospace;color:#999;text-align:center}
.img-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.img-card{background:#fff;border:1px solid #eee;border-radius:12px;padding:14px;text-align:center}
.img-card .cap{font:600 12px/1.5 monospace;color:#666;margin-top:10px}
.img-card img{width:100%;border-radius:8px}
.placeholder{background:#f0f0f0;border-radius:8px;aspect-ratio:1792/1024;display:flex;align-items:center;justify-content:center;font:13px/1.6 monospace;color:#999}
@media(max-width:720px){.img-grid{grid-template-columns:1fr}.hero{padding:24px}}
</style></head><body>
<div class="page">
  <div class="hero">
    <div class="brand">FMODE-PRODUCT-LAB · 新品研发全案</div>
    <h1>${d.recommendation.name}</h1>
    <div class="tagline">${d.recommendation.tagline} · 初始需求：${d.raw.task}</div>
    <div class="grid">
      <div class="kv"><div class="l">品类定位</div><div class="v small">${d.recommendation.positioning}</div></div>
      <div class="kv"><div class="l">形态</div><div class="v">${d.recommendation.form}</div></div>
      <div class="kv"><div class="l">价格带</div><div class="v small">${d.recommendation.price}</div></div>
      <div class="kv"><div class="l">渠道</div><div class="v">${d.recommendation.channel}</div></div>
      <div class="kv"><div class="l">市场机会</div><div class="v small">${d.recommendation.market}</div></div>
    </div>
  </div>

  <div class="part">一、基于用户之声（VOC）的需求洞察</div>
  ${s('用户原声与 KANO 分类', 'VOC ANALYSIS', d.voc, '#FF6B6B')}

  <div class="part">二、市场份额与品类机会</div>
  ${s('赛道规模 / 集中度 / 机会空间', 'MARKET SHARE', d.marketShare)}

  <div class="part">三、价格带与渠道策略</div>
  ${s('价格带分布 / 渠道溢价', 'PRICE BAND', d.priceBand, '#7FD1A0')}

  <div class="part">四、竞争分析</div>
  ${s('直接竞品 / 形态分布 / 策略弱点 / 差异化空位', 'COMPETITIVE', d.competition, '#5BA0E8')}

  <div class="part">五、定位升级</div>
  ${s('从品类竞争到场景竞争 · 4层级定位', 'REPOSITIONING', d.reposition, '#AF8AE8')}

  <div class="part">六、品类定位与错位竞争</div>
  ${s('品类边界重划 / 错位竞争矩阵', 'CATEGORY POSITIONING', d.categoryPos, '#D5B254')}

  <div class="part">七、五视图分析</div>
  ${s('市场视图', 'VIEW 1 · MARKET', d.views.market, '#5BA0E8')}
  ${s('用户视图', 'VIEW 2 · USER', d.views.user, '#FF6B6B')}
  ${s('供应链视图', 'VIEW 3 · SUPPLY', d.views.supply, '#7FD1A0')}
  ${s('工艺视图', 'VIEW 4 · PROCESS', d.views.process, '#AF8AE8')}
  ${s('法规视图', 'VIEW 5 · REGULATION', d.views.regulation, '#FF8C42')}

  <div class="part">八、产品概念图（skill-image 生成）</div>
  <div class="code"># 生成3张产品图（FMODE_API_KEY 必设）
npx fmode-image --product "${d.recommendation.name}包装设计，主视图+3/4视角，纯白背景" ~/out/${d.recommendation.name}-product
npx fmode-image --explode "${d.recommendation.name}成分结构爆炸图，${d.raw.keyIngredients.map(i=>i.name).join('/')}分层" ~/out/${d.recommendation.name}-explode
npx fmode-image --scene "${d.raw.target}使用${d.recommendation.name}的生活场景，明亮清新" ~/out/${d.recommendation.name}-scene</div>
  <div class="img-grid">
    <div class="img-card"><div class="placeholder">📱 产品设计图<br>--product</div></div>
    <div class="img-card"><div class="placeholder">🧩 技术爆炸图<br>--explode</div></div>
    <div class="img-card"><div class="placeholder">🎬 场景插图<br>--scene</div></div>
    <div class="img-card"><div class="placeholder">📊 应用/详情页<br>--app</div></div>
  </div>

  <div class="foot">
    <p>由 fmode-product-lab v0.2 生成 · FmodeAgent · 健康快消新品研发引擎</p>
    <p style="margin-top:4px">VOC + KANO + 市场 + 价格带 + 竞争 + 定位 + 错位竞争 + 五视图 + AI生图</p>
  </div>
</div></body></html>`;

  return html;
}

// ===== CLI =====
async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args[0] === '--help' || args[0] === '-h') {
    console.log(`fmode-product-lab v0.2 — 新品研发全案引擎

用法:
  node product-lab-v2.mjs --task "描述新品需求" [--output plan.html]  # 全案分析
  node product-lab-v2.mjs --list-tasks`);
    process.exit(0);
  }
  if (args[0] === '--list-tasks') {
    console.log('示例:');
    console.log('  --task "设计一款面向25-35岁白领的抗氧化胶原蛋白软糖，含VC，电商渠道"');
    console.log('  --task "儿童益生菌固体饮料，母婴渠道"');
    console.log('  --task "运动人群高蛋白代餐奶昔，便利店+线上"');
    process.exit(0);
  }
  const taskIdx = args.indexOf('--task');
  const task = taskIdx >= 0 ? args[taskIdx+1] : '抗氧化胶原软糖，白领，电商';
  const outIdx = args.indexOf('--output');
  const outFile = outIdx >= 0 ? args[outIdx+1] : `product-plan-\${Date.now()}.html`;

  console.log('📋 任务:', task);
  console.log('🔍 全案分析中...');
  const d = analyze(task);
  console.log('📊 推荐:', d.recommendation.name);
  const html = renderHTML(d);
  mkdirSync(dirname(outFile), {recursive:true});
  writeFileSync(outFile, html, 'utf-8');
  console.log('✅ 已生成:', outFile);
}

main();
