# fmode-product-lab

**健康快消/食品新品研发方案生成器**

输入一句话产品需求 → 5视图推理分析（市场/用户/供应链/工艺/法规）→ 推荐产品概念 → AI生成产品图 → HTML长页方案。

## 快速开始

```bash
# 安装
npm install -g fmode-product-lab

# 完整流程：分析 + 出方案
npx fmode-product-lab --task "设计一款面向25-35岁白领的抗氧化软糖，含胶原蛋白肽和维生素C，电商渠道"

# 指定输出
npx fmode-product-lab --task "益生菌固体饮料，儿童肠道健康" --output /path/to/plan.html
```

## 与 fmode-image 联动生成产品图

```bash
# 生成产品设计图（多角度/包装/概念）
npx fmode-image --product "光感胶原果冻包装设计，主视图+3/4视角，纯白背景，磨砂玻璃质感渲染" gummy-pack

# 生成产品爆炸图（成分/配方结构）
npx fmode-image --explode "光感胶原果冻成分爆炸图：胶原蛋白肽/维生素C/低聚果糖逐层分解，标注营养数据流向" gummy-explode

# 生成场景插图（用户使用场景）
npx fmode-image --scene "25-35岁白领办公桌上摆放胶原果冻，环境明亮清新，人物轻松愉悦" gummy-scene

# 生成产品详情页界面
npx fmode-image --app "光感胶原果冻品牌详情页：产品主图+成分表+功效说明+规格价格" gummy-app
```

## 五个分析视图

| 视图 | 分析内容 |
|------|---------|
| **市场** | 品类规模、增长趋势、竞争格局、机会窗口 |
| **用户** | 人群画像、痛点、使用场景、决策因子、购买路径 |
| **供应链** | 原料可得性、采购周期、生产可行性、风险 |
| **工艺** | 产品形态、工艺路线、设备、生产周期、质量控制 |
| **法规** | 食品分类、宣称策略、禁用词、营养强化规定 |

## 领域知识库（内置）

- **品类层级**：MDM 5级架构（L1大类→L2赛道→L3渠道监管→L4产品系列→L5 SKU）
- **法规规则**：普通食品/保健食品/跨境/特膳宣称边界与禁用词
- **成分规则库**：18种常见营养成分（维生素C/益生菌/胶原蛋白肽/GABA/叶黄素/透明质酸/辅酶Q10等）的每日限量/功效宣称/常见载体
- **工艺对照**：6种形态（片剂/软糖/饮液/果冻/粉剂/胶囊）的工艺路线/设备/周期/保质期
- **定价锚点**：各形态出厂价→零售价→毛利率

## ESM 独立调用

```js
import { analyze } from 'fmode-product-lab';
const result = analyze('代餐奶昔，高蛋白，运动人群，便利店+线上');
console.log(result.recommendation.name);
```

## 环境变量

- `FMODE_API_KEY` — 必设（生成图片时）
- `SKILL_IMAGE_OUTPUT` — 图片输出目录

## 链接
- GitHub: https://github.com/fmodecn/fmode-product-lab
- npm: https://www.npmjs.com/package/fmode-product-lab
- 关联: [fmode-image](https://github.com/fmodecn/fmode-image)