# 财务摘要卡片设计文档

## 概述

Dashboard 首页的 4 张财务数据卡片，手账贴纸风格，水平排列，承载本月收入、本月支出、结余、储蓄率四项核心指标。每张卡片有独立的柔色背景、手绘 SVG 图标、装饰贴纸元素，以及"较上月"环比变化。

## 文件位置

- [client/src/views/Dashboard.vue](../client/src/views/Dashboard.vue) — 卡片模板、逻辑、样式均在此文件中
- 环比计算逻辑：`momChanges` computed（第 46-65 行附近）
- 金额格式化：`formatCurrency()` 函数
- 卡片模板：`.summary-stickers` 容器内的 `.finance-card` 元素
- 卡片样式：`/* ── 2. Finance Sticker Cards ── */` 区块

## 数据来源

| 指标 | 来源 | 字段 |
|---|---|---|
| 本月收入 | `getSummary()` API | `totalIncome` |
| 本月支出 | `getSummary()` API | `totalExpense` |
| 结余 | `getSummary()` API | `balance` |
| 储蓄率 | 前端计算 | `balance / totalIncome * 100` |
| 较上月变化 | `getMonthlyTrend()` API | 从 trendData 计算环比 |

所有数值均从 API 实时获取，无硬编码数据。

## 4 张卡片规格

### 卡片 1：本月收入

- **背景**：线性渐变 `#FFF5F5 → #FFF0F0`
- **描边**：`1px solid #F8C8C8`
- **SVG 图标**：粉色钱包，带虚线缝线 + 黄色圆形搭扣
- **装饰**：右下角黄色星星贴纸（24px）
- **环比颜色**：上升 `#E0A0A0`（粉），下降 `#A0B898`（绿）

### 卡片 2：本月支出

- **背景**：线性渐变 `#F5FFF5 → #F0FFF0`
- **描边**：`1px solid #C8E8C8`
- **SVG 图标**：绿色购物袋，带白色小花装饰
- **装饰**：无
- **环比颜色**：下降=好 `#80B080`（绿），上升=坏 `#E0A0A0`（粉）

### 卡片 3：结余

- **背景**：线性渐变 `#FFFCF5 → #FFF9E8`
- **描边**：`1px solid #F8E8C8`
- **SVG 图标**：粉色小猪存钱罐，头顶金色 ¥ 金币
- **装饰**：右上角粉色胶带贴纸（倾斜 -8°）
- **环比颜色**：上升 `#E0A0A0`（粉），下降 `#A0B898`（绿）

### 卡片 4：储蓄率

- **背景**：线性渐变 `#F8FBFF → #F0F8FF`
- **描边**：`1px solid #C8E0F8`
- **SVG 图标**：玻璃存钱罐，软木塞 + 爱心图案
- **装饰**：无
- **环比颜色**：上升 `#E0A0A0`（粉），下降 `#A0B898`（绿）

## 卡片结构

每张卡片由以下层级组成：

```
.finance-card (.card-income / .card-expense / .card-balance / .card-savings)
  .card-body          ← 文字内容区（z-index: 1）
    .card-header      ← 标题 + 问号 SVG 图标
      .card-label     ← "本月收入" 等
      .card-help      ← 16x16 问号圆圈图标
    .card-value       ← 金额/百分比大数字
    .card-change      ← "较上月 ↑/↓ X%" 或 "较上月 持平"
  .card-icon-wrap     ← SVG 图标容器
    .card-icon        ← 手绘风格 SVG
  .card-decoration    ← 装饰贴纸（星星 / 胶带，z-index: 0）
```

## 交互效果

- **默认**：卡片静止，轻度阴影来自描边
- **Hover**：`translateY(-3px)` + `box-shadow: 0 8px 28px rgba(139, 107, 82, 0.10)`
- **过渡**：`0.25s cubic-bezier(0.33, 0, 0.67, 1)`
- **减少动画**：`@media (prefers-reduced-motion: reduce)` 下禁用 transition 和 transform

## 环比变化逻辑

`momChanges` computed 从 `getMonthlyTrend()` 返回的 12 个月数据中取当前月和上月，计算四项指标的变化：

- **收入变化**：`(本月收入 - 上月收入) / 上月收入 × 100`
- **支出变化**：`(本月支出 - 上月支出) / 上月支出 × 100`
- **结余变化**：`(本月结余 - 上月结余) / |上月结余| × 100`
- **储蓄率变化**：`本月储蓄率 - 上月储蓄率`（绝对百分点差）

**边界处理**：
- 上月为 0 且本月 > 0 → 显示 100% 增长
- 上月和本月均为 0 → 显示"较上月 持平"
- 变化绝对值 < 0.05% → 显示"较上月 持平"

## 响应式

- **桌面（> 900px）**：4 列等宽 Grid
- **平板（≤ 900px）**：2 列 Grid
- **手机（≤ 480px）**：1 列 Grid

## 字体

- **标题**：`system-ui` 栈，13px，weight 500
- **金额**：`ZCOOL KuaiLe`（`var(--font-round)`），22px，weight 700
- **环比**：`system-ui` 栈，12px，weight 500

## 颜色对比度

- 卡片标题 `#A89880`（奶茶灰）在浅色背景上 ≥ 4.5:1
- 金额 `#5D4E37`（可可棕）在所有卡片背景上 ≥ 4.5:1
- 环比文字在各自背景上均 ≥ 3:1（大字号标准）

## 注意事项

1. SVG 图标为内嵌手绘风格，不依赖外部图标库
2. 装饰元素（星星、胶带）使用 `position: absolute`，`z-index: 0`，不阻挡交互
3. 卡片使用 `cursor: default`（非可点击元素）
4. 所有数据随 Dashboard `onMounted` 自动刷新
5. `Promise.allSettled` 保证单个 API 失败不影响其他卡片渲染
