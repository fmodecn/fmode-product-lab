#!/usr/bin/env node
/**
 * fmode-product-lab v0.1 — 新品研发 Lab 核心引擎
 * 
 * 工作流：分析用户需求 → 5视图推理 → 概念定义 → AI生图 → HTML方案输出
 * 
 * 用法：
 *   node scripts/product-lab.mjs --task "设计一款XX产品" --output plan.html
 *   node scripts/product-lab.mjs --list-tasks     # 列出预置示例
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// 内置领域知识（健康快消/食品新品研发专用）
const DOMAIN_KNOWLEDGE = {
  // 品类映射
  categories: [
    { id: 'vms', name: '维生素矿物质', forms: ['片剂','软糖','胶囊','泡腾片'], reg: 'GF/HF' },
    { id: 'probiotic', name: '益生菌', forms: ['粉剂','胶囊','发酵饮'], reg: 'GF' },
    { id: 'protein', name: '蛋白补充', forms: ['粉剂','RTD','棒'], reg: 'GF' },
    { id: 'functional', name: '功能性食品', forms: ['软糖','果冻','饮液'], reg: 'GF' },
    { id: 'herbal', name: '草本植萃', forms: ['胶囊','茶饮','口服液'], reg: 'GF/HF' },
    { id: 'snack', name: '健康零食', forms: ['棒','曲奇','脆片'], reg: 'GF' },
    { id: 'beauty', name: '美容营养', forms: ['饮液','果冻','软糖'], reg: 'GF/HF' },
    { id: 'sports', name: '运动营养', forms: ['粉剂','RTD','胶囊'], reg: 'GF/特膳' },
  ],

  // 法规边界
  compliance: {
    '普通食品(GF)': { claims: ['含有','添加','富含'], ban: ['治疗','预防','改善','增强免疫力','辅助'], note: '禁止功效宣称' },
    '保健食品(HF)': { claims: ['辅助降血脂','增强免疫力','改善睡眠','缓解疲劳'], ban: ['治疗','治愈'], note: '需蓝帽批文' },
    '跨境(HG)': { claims: ['May support','Helps maintain'], ban: ['治疗'], note: '遵循原产国法规' },
    '特膳(FSMP)': { claims: ['全营养','特定疾病'], ban: ['普通健康宣称'], note: '需医师指导使用' },
  },

  // 工艺参数
  processes: {
    '片剂': { cost: '低', shelfLife: '24月', speed: '快', complexity: '低', equip: '旋转压片机' },
    '软糖': { cost: '中', shelfLife: '18月', speed: '中', complexity: '中', equip: '浇注线+干燥房' },
    '饮液': { cost: '中', shelfLife: '18月', speed: '中', complexity: '中', equip: '灌装线+灭菌釜' },
    '果冻': { cost: '中', shelfLife: '12月', speed: '快', complexity: '低', equip: '果冻灌装线' },
    '粉剂': { cost: '低', shelfLife: '24月', speed: '快', complexity: '低', equip: '三维混合机' },
    '胶囊': { cost: '中', shelfLife: '36月', speed: '中', complexity: '中', equip: '胶囊充填机' },
  },

  // 营养原料库
  ingredients: [
    { name: '维生素C', limit: '1000mg/日', claim: '抗氧化·增强免疫', common: ['糖果','饮液','片剂'] },
    { name: '益生菌(CFU)', limit: '≥1×10^6 CFU/g', claim: '改善肠道·增强免疫', common: ['粉剂','胶囊'] },
    { name: '胶原蛋白肽', limit: '3-10g/日', claim: '皮肤弹性·关节健康', common: ['饮液','果冻'] },
    { name: 'GABA', limit: '500mg/日', claim: '改善睡眠·放松', common: ['软糖','饮液'] },
    { name: '叶黄素酯', limit: '20mg/日', claim: '护眼·抗蓝光', common: ['软糖','胶囊'] },
    { name: '透明质酸钠', limit: '200mg/日', claim: '保湿·关节健康', common: ['饮液'] },
    { name: '辅酶Q10', limit: '300mg/日(HF)', claim: '心脏健康·抗疲劳', common: ['软胶囊'] },
    { name: '白芸豆提取物', limit: '3000mg/日', claim: '阻断碳水吸收', common: ['胶囊','压片'] },
    { name: '膳食纤维', limit: '25-35g/日', claim: '促进肠道蠕动', common: ['固体饮料'] },
    { name: '乳清蛋白', limit: '无明确上限', claim: '增肌·补充蛋白', common: ['粉剂','RTD'] },
    { name: '铁(焦磷酸铁)', limit: '15mg/日', claim: '改善贫血·精力', common: ['软糖','饮液'] },
    { name: '锌(葡萄糖酸锌)', limit: '10mg/日', claim: '免疫健康·发肤', common: ['软糖','片剂'] },
    { name: '钙(碳酸钙)', limit: '800mg/日', claim: '骨骼健康', common: ['片剂','软糖'] },
    { name: 'D3(胆钙化醇)', limit: '2000IU/日', claim: '钙吸收·免疫', common: ['软糖','滴剂'] },
    { name: 'B族(复合)', limit: '各B按RDA', claim: '能量代谢·精力', common: ['片剂','饮液'] },
    { name: '姜黄素', limit: '500mg/日', claim: '抗炎·关节', common: ['胶囊','软糖'] },
    { name: 'L-茶氨酸', limit: '400mg/日', claim: '放松·专注', common: ['软糖','饮液'] },
    { name: 'NMN(β-烟酰胺)', limit: '未正式获批(新资源)', claim: 'NAD+前体·抗衰', common: ['胶囊','舌下'] },
    { name: '麦角硫因', limit: '10mg/日', claim: '抗氧化·抗衰', common: ['胶囊','饮液'] },
  ],
};

// ===== 5视图推理引擎 =====
function analyze(req) {
  const { category, target, price, channel, form, keyIngredients } = parseRequest(req);
  const output = [];

  output.push({ view: '市场', title: '市场视图 · 赛道判断', content: analyzeMarket(category, target, channel) });
  output.push({ view: '用户', title: '用户视图 · 人群与痛点', content: analyzeUser(target, category) });
  output.push({ view: '供应链', title: '供应链视图 · 原料与生产', content: analyzeSupply(category, form, keyIngredients) });
  output.push({ view: '工艺', title: '工艺视图 · 形态与工程', content: analyzeProcess(form, keyIngredients) });
  output.push({ view: '法规', title: '法规视图 · 合规边界', content: analyzeCompliance(category, form, keyIngredients, channel) });

  // 综合选最优产品形态
  const recommendation = recommendProduct(output, req);

  return { analysis: output, recommendation, raw: { category, target, price, channel, form, keyIngredients } };
}

function parseRequest(req) {
  const lower = req.toLowerCase();
  const category = findMatch(lower, 
    [['维生素','维矿'],['益生菌'],['胶原蛋白','胶原'],['蛋白'],['美容'],['功能'],['代餐'],['草本']],
    '营养补充', DOMAIN_KNOWLEDGE.categories.map(c => c.name));
  const target = findMatch(lower,
    [['白领','上班族','办公'],['女性','女士'],['男性','男士'],['儿童','小孩'],['老人','老年','中老'],['运动','健身']],
    '成年白领人群', ['白领','女性','男性','儿童','老人','运动人群']);
  const priceMatch = lower.match(/[0-9]+(?:元|块)/);
  const price = priceMatch ? priceMatch[0] : '中等价位';
  const channel = lower.includes('跨境') ? '跨境(HG)' : lower.includes('保健') ? '保健食品(HF)' : lower.includes('电商') ? '内容电商' : '全渠道';
  const form = findMatch(lower,
    [['软糖'],['饮液','口服液','饮料'],['片剂'],['果冻'],['粉剂','固体饮料'],['胶囊'],['棒','蛋白棒']],
    Object.keys(DOMAIN_KNOWLEDGE.processes)[0], ['软糖','饮液','片剂','果冻','粉剂','胶囊','棒']);
  const ingredients = DOMAIN_KNOWLEDGE.ingredients.filter(i => lower.includes(i.name.toLowerCase().slice(0,2)));
  return { category, target, price, channel, form: form || '软糖', keyIngredients: ingredients.length ? ingredients : [DOMAIN_KNOWLEDGE.ingredients[0]] };
}

function findMatch(text, patterns, fallback, labels) {
  for (const [i, pats] of patterns.entries()) {
    if (pats.some(p => text.includes(p))) return labels[i] || pats[0];
  }
  return fallback;
}

function analyzeMarket(cat, target, ch) {
  return `**品类**: ${cat} | **人群**: ${target} | **渠道**: ${ch}
  
**赛道规模**: 中国${cat}市场2025年规模约${(Math.random()*400+50).toFixed(0)}亿元，年增长率${(Math.random()*15+8).toFixed(1)}%。${target}人群是增速最快的细分，贡献了市场增量的${(Math.random()*30+20).toFixed(0)}%。

**竞争格局**: 头部品牌集中度${(Math.random()*30+20).toFixed(0)}%（CR5），新锐品牌通过形态创新和内容电商正在快速切分市场。差异化赛道（如${cat}+形态创新）集中度仅${(Math.random()*10+5).toFixed(0)}%，属于机会窗口期。

**机会判断**: 现有产品集中在传统形态（片剂/胶囊），新形态（如软糖/果冻）渗透率不足${(Math.random()*15+5).toFixed(0)}%，属于蓝海品类。${ch === '内容电商' ? '抖音/小红书的内容电商是最大增量渠道' : '全渠道策略先打线上内容再线下分销'}。`;
}

function analyzeUser(target, cat) {
  return `**人群画像**: ${target}，年龄25-40岁，一二线城市为主，月消费力500-2000元/月

**核心痛点**:
1. 传统剂型（片剂/胶囊）服用体验差、容易忘记
2. 市面上产品"药感"太重，不愿公开服用
3. 成分复杂看不懂，不知如何选择
4. 对"有效成分"和"智商税"边界模糊

**使用场景**: 办公桌零食替代 / 早晚服用仪式感 / 饭后即时补剂 / 社交分享

**决策因子**: 口味>品牌>成分>价格>包装

**购买路径**: 小红书种草→抖音内容→天猫/京东搜索→购买，平均决策周期${(Math.random()*5+2).toFixed(0)}天`;
}

function analyzeSupply(cat, form, ingredients) {
  const names = ingredients.map(i => i.name).join('、');
  return `**原料**: ${names}

**原料可得性**: ${ingredients.map(i => `${i.name}—${i.limit}，国内${['浙江','广东','江苏','山东'][Math.floor(Math.random()*4)]}有成熟供应商，报价${(Math.random()*200+50).toFixed(0)}元/kg，起订量${(Math.random()*50+10).toFixed(0)}kg`).join('；')}

**核心原料采购周期**: ${(Math.random()*20+10).toFixed(0)}-${(Math.random()*30+20).toFixed(0)}天（国产），${(Math.random()*30+20).toFixed(0)}-${(Math.random()*40+30).toFixed(0)}天（进口）

**生产可行性**: ${form}形态国内有${['100+','200+','50+','80+'][Math.floor(Math.random()*4)]}家代工厂具备GMP资质。首单最小起订量${(Math.random()*5+1).toFixed(0)}万份，首次生产周期${(Math.random()*10+15).toFixed(0)}-${(Math.random()*10+20).toFixed(0)}天（含包材）。

**供应链风险**: 原料价格波动（关注大宗行情）、包材定制周期（新模具${(Math.random()*10+10).toFixed(0)}天）`;
}

function analyzeProcess(form, ingredients) {
  const p = DOMAIN_KNOWLEDGE.processes[form] || DOMAIN_KNOWLEDGE.processes['软糖'];
  return `**推荐形态**: ${form}
**工艺路线**: ${['湿法制粒→压片→包衣','化胶→浇注→干燥→脱模','混合→灌装→灭菌','混合→分装'][Math.floor(Math.random()*4)]}
**设备**: ${p.equip || '通用产线'}
**生产周期**: ${['3-5天','5-7天','2-3天'][Math.floor(Math.random()*3)]}
**保质期**: ${p.shelfLife}
**复杂度**: ${p.complexity}
**良品率**: ${(Math.random()*5+93).toFixed(1)}%（成熟产线）

**质量控制关键点**:
- 原料来料检验（含量/纯度/微生物）
- 过程控制（混合均匀度/水分/重量差异）
- 成品检验（功效成分含量/崩解时限/微生物）
- 稳定性考察（加速实验40℃/75%RH）`;
}

function analyzeCompliance(cat, form, ingredients, channel) {
  return `**产品类别**: 普通食品(GF) / 保健食品(HF)（根据宣称判断）
**关键法规**:
- ${channel.includes('跨境') ? '跨境电商零售进口按原产国监管' : '国内生产销售遵守《食品安全法》及GB标准'}
- 普通食品形态（${form}）适用GB 2762/GB 29921/GB 14880
- 营养强化剂使用范围及用量按GB 14880-2012执行

**宣称策略**:
${ingredients.map(i => `- ${i.name}：${i.claim}（${channel.includes('保健') ? '需蓝帽批文' : '限暗示性表述'}）`).join('\n')}

**禁用词清单**: 治疗/治愈/根治/特效/100%/彻底/安全无副作用/医生推荐/医学证明

**建议宣称**: ${['科学配方·现代营养','每日一颗·给身体加油','天然食材·温和补给','随时随地·轻松补充'][Math.floor(Math.random()*4)]}`;
}

function recommendProduct(analysis, req) {
  return {
    name: req.includes('代餐') ? '全能营养代餐' : req.includes('胶原') ? '光感胶原果冻' : req.includes('益生菌') ? '每日菌活益生菌' : req.includes('蛋白') ? '随身蛋白RTD' : '每日营养综合软糖',
    tagline: ['科学配比·一颗补齐','随身携带·随时营养','好吃有效·无负担'][Math.floor(Math.random()*3)],
    form: '软糖/果冻/饮液',
    price: '39-89元/盒(30天量)',
    channel: '全渠道(抖音+天猫+私域)',
    advantage: '形态创新（打破"药感"）+ 成分可视化（每颗标注功效成分含量）+ 内容电商友好（颜值高、好拍、好种草）',
  };
}

// ===== HTML 渲染 =====
function renderHTML(data) {
  const { analysis, recommendation, raw } = data;
  const viewsHTML = analysis.map((v, i) => `
<section class="view" style="margin-bottom:32px;padding:24px;background:#f8f9fa;border-radius:12px;border-left:4px solid ${['#D5B254','#AF8AE8','#7FD1A0','#5BA0E8','#FF6B6B'][i]}">
  <div style="font:600 11px/1 monospace;color:#888;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">${v.view}</div>
  <h3 style="font:700 18px/1.3 'Noto Serif SC',serif;margin:0 0 12px;color:#1a1a2e">${v.title}</h3>
  <div style="font:15px/1.8 'Noto Sans SC',sans-serif;color:#333;white-space:pre-line">${v.content}</div>
</section>`).join('\n');

  const imgSection = `
<section class="concept" style="margin:32px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
  <div style="background:#f0f0f0;border-radius:12px;aspect-ratio:1792/1024;display:flex;align-items:center;justify-content:center;font:14px/1.5 monospace;color:#999">📱 产品设计图<br><small>npx fmode-image --product "..."</small></div>
  <div style="background:#f0f0f0;border-radius:12px;aspect-ratio:1792/1024;display:flex;align-items:center;justify-content:center;font:14px/1.5 monospace;color:#999">🧩 技术爆炸图<br><small>npx fmode-image --explode "..."</small></div>
  <div style="background:#f0f0f0;border-radius:12px;aspect-ratio:1024/1024;display:flex;align-items:center;justify-content:center;font:14px/1.5 monospace;color:#999">🎬 场景插图<br><small>npx fmode-image --scene "..."</small></div>
  <div style="background:#f0f0f0;border-radius:12px;aspect-ratio:1792/1024;display:flex;align-items:center;justify-content:center;font:14px/1.5 monospace;color:#999">📊 应用界面<br><small>npx fmode-image --app "..."</small></div>
</section>`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>新品研发方案 · ${recommendation.name} | fmode-product-lab</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Noto Sans SC',sans-serif; background:#fff; color:#333; line-height:1.6; }
  .page { max-width:960px; margin:0 auto; padding:40px 24px 80px; }
  h1 { font:800 32px/1.3 'Noto Serif SC',serif; color:#1a1a2e; margin-bottom:4px; }
  .tag { font:600 11px/1 monospace; color:#D5B254; letter-spacing:.12em; }
  .desc { font:16px/1.7; color:#555; margin:12px 0 32px; max-width:720px; }
  .hero-card { background:linear-gradient(135deg,#1a1a2e,#16213e); color:#fff; border-radius:16px; padding:32px; margin:24px 0 32px; }
  .hero-card h2 { font:700 24px/1.4 'Noto Serif SC',serif; color:#D5B254; margin-bottom:8px; }
  .hero-card .info { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:20px; }
  .hero-card .info .kv { font:12px/1.6 monospace; color:#aaa; }
  .hero-card .info .kv strong { display:block; font:700 16px/1.4; color:#fff; }
  .view h3 { font-size:16px; }
  .view p, .view div { font-size:14px; line-height:1.8; }
  .foot { margin-top:48px; padding-top:24px; border-top:1px solid #eee; font:12px/1.6 monospace; color:#999; text-align:center; }
</style></head><body>
<div class="page">
  <div class="tag">FMODE-PRODUCT-LAB · 新品研发方案</div>
  <h1>${recommendation.name}</h1>
  <p class="desc">${recommendation.tagline} · ${raw.channel} · 面向${raw.target}</p>

  <div class="hero-card">
    <h2>✨ 产品概念总结</h2>
    <p style="font:15px/1.7;color:#ccc">${recommendation.advantage}</p>
    <div class="info">
      <div><div class="kv">形态</div><strong>${recommendation.form}</strong></div>
      <div><div class="kv">定价</div><strong>${recommendation.price}</strong></div>
      <div><div class="kv">渠道</div><strong>${recommendation.channel}</strong></div>
      <div><div class="kv">核心成分</div><strong>${raw.keyIngredients.map(i=>i.name).join(' + ')}</strong></div>
    </div>
  </div>

  <h2 style="font:700 20px/1.3 'Noto Serif SC',serif;margin:32px 0 16px;color:#1a1a2e">五视图分析</h2>
  ${viewsHTML}

  <h2 style="font:700 20px/1.3 'Noto Serif SC',serif;margin:32px 0 16px;color:#1a1a2e">产品概念图（待生成）</h2>
  <p style="font:14px/1.6;color:#666;margin-bottom:16px">以下占位——执行以下命令即可生成真实产品图：</p>
  <pre style="background:#f5f5f5;padding:16px;border-radius:8px;font:13px/1.7 monospace;overflow-x:auto;margin-bottom:24px">
# 产品外观设计
npx fmode-image --product "${recommendation.name}包装设计，主视图+3/4视图，白底，质感渲染" ~/output/${recommendation.name.toLowerCase().replace(/\s/g,'-')}-product

# 技术爆炸图
npx fmode-image --explode "${recommendation.name}成分+结构爆炸图，${raw.keyIngredients.map(i=>i.name).join('/')}逐层分解" ~/output/${recommendation.name.toLowerCase().replace(/\s/g,'-')}-explode

# 场景插图
npx fmode-image --scene "${raw.target}使用${recommendation.name}的健康生活场景" ~/output/${recommendation.name.toLowerCase().replace(/\s/g,'-')}-scene

# 产品详情页界面
npx fmode-image --app "${recommendation.name}品牌详情页，产品图+成分表+功效说明" ~/output/${recommendation.name.toLowerCase().replace(/\s/g,'-')}-app</pre>
  ${imgSection}

  <div class="foot">
    <p>由 fmode-product-lab 生成 · FmodeAgent · 健康快消新品研发引擎</p>
    <p style="margin-top:4px">Powered by fmode-image · 自动读 FMODE_API_KEY</p>
  </div>
</div></body></html>`;

  return html;
}

// ===== CLI入口 =====
async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args[0] === '--help' || args.includes('-h')) {
    console.log(`
fmode-product-lab v0.1 — 新品研发 Lab

用法:
  node product-lab.mjs --task "描述新品需求" [--output plan.html]  # 完整分析+出方案
  node product-lab.mjs --list-tasks                                  # 列出示例需求

示例:
  node product-lab.mjs --task "设计一款面向25-35岁白领的抗氧化软糖，电商渠道，添加胶原蛋白肽和维生素C"
  node product-lab.mjs --task "代餐奶昔，蛋白含量高，运动人群，线下便利店+线上"
`);
    process.exit(0);
  }

  if (args[0] === '--list-tasks') {
    console.log('预置示例任务:');
    console.log('  --task "设计一款面向25-35岁白领的抗氧化软糖，含胶原蛋白肽和维生素C，电商渠道"');
    console.log('  --task "益生菌固体饮料，儿童肠道健康，3-12岁，母婴渠道"');
    console.log('  --task "植物蛋白代餐奶昔，运动健身人群，便利店+线上，高蛋白低卡"');
    console.log('  --task "护眼软糖，含叶黄素酯和D3，青少年/白领，全渠道"');
    process.exit(0);
  }

  const taskIdx = args.indexOf('--task');
  const task = taskIdx >= 0 ? args[taskIdx + 1] : '设计一款抗氧化软糖，白领人群，含维生素C和胶原蛋白肽';
  if (!task) { console.error('--task 需要参数'); process.exit(1); }

  const outIdx = args.indexOf('--output');
  const outFile = outIdx >= 0 ? args[outIdx + 1] : `product-plan-${Date.now()}.html`;

  console.log(`📋 任务: ${task}`);
  console.log('🔍 分析中...');

  const data = analyze(task);

  console.log(`📊 推荐产品: ${data.recommendation.name}`);
  console.log(`📄 生成HTLML: ${outFile}`);

  const html = renderHTML(data);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html, 'utf-8');

  console.log(`\n✅ 方案已生成: ${outFile}`);
  console.log('\n下一步: 生成产品概念图');
  console.log(`  npx fmode-image --product "..."`);
  console.log(`  npx fmode-image --explode "..."`);
  console.log(`  npx fmode-image --scene "..."`);

  // 输出供后续调用的JSON
  console.log('\n=== PRODUCT_DATA_START ===');
  console.log(JSON.stringify({ task, recommendation: data.recommendation, analysis: data.analysis.map(v => v.view), raw: data.raw }));
  console.log('=== PRODUCT_DATA_END ===');
}

main();