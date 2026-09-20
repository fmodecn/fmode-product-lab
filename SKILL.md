---
name: fmode-product-lab
description: "触发词:新品研发、产品创新、产品开发、健康快消产品。VOC+KANO+市场+价格带+竞争+定位+错位竞争+5视图分析+AI生图+HTML全案。"
version: 0.2.0
author: FmodeAgent (Yuyang Liu)
license: MIT
platforms: [linux, macos, windows]
---

# fmode-product-lab v0.2 | 新品研发 Lab

> **消费品/食品新品研发全案生成器**
> 输入一段产品需求 → 8大方法论分析（VOC/KANO/市场/价格带/竞争/定位/错位竞争/5视图）→ 产品概念 → AI生成4类概念图 → HTML全案长页。

## 快速开始

```bash
# 全案分析
npx fmode-product-lab --task "面向25-35岁白领的抗氧化胶原蛋白软糖，含VC，电商渠道"
npx fmode-product-lab --task "儿童益生菌固体饮料，母婴渠道" --output plan.html
```

## 8大方法论板块

### 1. VOC 用户之声
- 调研方法：小红书/抖音评论分析、电商评价NLP、问卷N=500+、KOC深访
- 用户原声聚类（5类高频痛点：没感觉/难坚持/看不懂/太贵/怕副作用）
- **KANO 分类**：基础/绩效/兴奋/无差异/反向 → 优先级排序

### 2. 市场份额
- 赛道规模/年增长率/CR5集中度
- 份额分布（头部/腰部/长尾）
- 机会空间（形态创新子类占比=切入最快路径）

### 3. 价格带
- 4档价格带（大众/中端/高端/超高端）日成本与月花费
- 渠道溢价倍数
- 目标渠道最优价格带推荐

### 4. 竞争分析
- 直接竞品与策略弱点（形态老化/功效表达弱/内容适配差/价格战线长）
- 形态分布（传统70% vs 新形态30%）
- 差异化空位

### 5. 定位升级
- 4层级：品类→人群→场景→情感
- 一句话定位

### 6. 品类定位与错位竞争
- 品类边界重划（按成分→按场景）
- 错位竞争6维矩阵（形态/场景/表达/渠道/价格/复购）

### 7. 五视图
- 市场 / 用户 / 供应链 / 工艺 / 法规

### 8. AI概念图（skill-image 联动）
- `--product` 产品设计图（包装/外观）
- `--explode` 技术爆炸图（成分/结构）
- `--scene` 场景插图（用户使用）
- `--app` 应用/详情页

## 领域知识库（内置）

```js
markets: {
  '维生素矿物质': { size:185亿, growth:8.2%, cr5:46%, leading:[汤臣倍健,善存,Swisse,纽崔莱] },
  '胶原蛋白':     { size:160亿, growth:15.3%, cr5:30%, leading:[Swisse,姿美堂,汤臣倍健,五个女博士] },
  '益生菌':       { size:95亿,  growth:12.6%, cr5:38%, leading:[合生元,养乐多,...] },
  '蛋白补充':     { size:210亿, growth:18.9%, cr5:42% },
  '睡眠健康':     { size:85亿,  growth:28.6%, cr5:28% },
  '护眼健康':     { size:110亿, growth:19.8%, cr5:33% },
  '美容营养':     { size:200亿, growth:25.8%, cr5:25% },
  '儿童营养':     { size:120亿, growth:14.2%, cr5:35% },
  '运动营养':     { size:150亿, growth:22.4%, cr5:45% },
  '功能性食品':   { size:280亿, growth:20.5%, cr5:22% },
}
ingredients: [维生素C/胶原蛋白肽/益生菌/GABA/叶黄素/透明质酸钠/辅酶Q10/钙/铁/锌/乳清蛋白/白芸豆/L-茶氨酸/麦角硫因: 限量/宣称/载体]
channels: [内容电商/传统电商/线下商超/私域: 份额/增长/溢价/包装策略]
priceTiers: [大众/中端/高端/超高端: 日成本/月花费/人群/价值锚点]
```

## 产品层级（MDM 框架）

```
L1 一级大类 → L2 功能赛道 → L3 渠道监管线(跨境HG/大贸CD/保健HF/普通GF/OTC) → L4 产品系列(PV) → L5 SKU(SAP)
```

## 法规红线

1. **普通食品不得宣称功效**——只能用"含有XX""有助于"暗示性表述
2. **保健食品必须有蓝帽**——未经备案不得用"改善/辅助/增强"等
3. **跨境产品按原产国法规**——落地广告仍受中国广告法约束
4. **儿童食品(12岁以下)**——禁止功能性宣称
5. **新资源食品**——需核实卫健委公告名单，标注食用限量
6. **禁用词**：治疗/治愈/根治/特效/100%有效/安全无毒/医生推荐

## 工艺路线对照

| 形态 | 工艺 | 周期 | 保质期 |
|------|------|------|-------|
| 片剂 | 湿法制粒→压片 | 3-5天 | 24月 |
| 软糖 | 化胶→浇注→干燥 | 5-7天 | 18月 |
| 硬胶囊 | 混合→充填 | 2-3天 | 36月 |
| 口服液 | 配液→灌装→灭菌 | 3-4天 | 18月 |
| 固体饮料 | 混合→分装 | 1-2天 | 24月 |
| 果冻 | 化胶→灌装 | 2-3天 | 12月 |

## 组件式调用

```js
import { analyze, renderHTML } from 'fmode-product-lab';
const result = analyze('代餐奶昔，高蛋白，运动人群');
// result: { voc, marketShare, priceBand, competition, reposition, categoryPos, views, recommendation }
const html = renderHTML(result);
```

## 环境变量
- `FMODE_API_KEY`（生成图时必设）
- `SKILL_IMAGE_OUTPUT`（图片输出目录）

## 版本
- **v0.1.0**：基础5视图方案
- **v0.2.0**：全案升级——VOC+KANO+市场份额+价格带+竞争+定位+错位竞争+产品概念图

## 链接
- GitHub: https://github.com/fmodecn/fmode-product-lab
- npm: https://www.npmjs.com/package/fmode-product-lab
- 关联: fmode-image（图片生成）、fmode-cdn-deploy（部署）、task-dispatch（委派）