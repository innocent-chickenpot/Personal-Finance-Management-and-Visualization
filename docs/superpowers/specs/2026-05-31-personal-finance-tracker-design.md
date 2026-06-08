# 个人财务管理与可视化系统 — 设计文档

## 项目背景与目标

打造一个多用户个人财务管理与可视化 Web 网站，帮助用户记录日常收支、统计资产、通过图表直观了解消费结构，并接入 AI 大模型提供消费分析和存钱建议。

---

## 技术栈

| 层 | 选型 | 说明 |
|------|------|------|
| 前端框架 | Vue 3 + JavaScript + Vite | SPA 单页应用 |
| UI 组件库 | Element Plus | 中文文档完善，组件丰富 |
| 状态管理 | Pinia | Vue 3 官方推荐 |
| 图表库 | ECharts | 功能最全，中文文档好 |
| 后端框架 | Node.js + Express | 资料最多，上手最快 |
| ORM | Prisma | 类型安全，自动生成查询 |
| 数据库 | MySQL | 国内使用最普遍 |
| AI | DeepSeek API | 国内直连，中文强，价格低 |
| 前端部署 | Vercel | 免费层够用 |
| 后端部署 | 先本地，后续上云 |  |
| 文件解析 | xlsx + csv-parser | Excel/CSV 导入解析 |

## 设计规范

### 代码规范
- 前端：Vue 3 Composition API + `<script setup>` 语法
- 后端：Express 路由-控制器-服务 三层结构
- 命名：前端组件 PascalCase，JS 变量 camelCase，数据库字段 snake_case
- API 统一返回格式：`{ code: 200, data: ... }` / `{ code: xxx, message: "..." }`

### UI 风格
- 活泼多彩风格（圆角、渐变、插画元素）
- 中英文双语切换
- 响应式适配（桌面端 + 移动端）
- Element Plus 主题色可自定义

### 架构原则
- 功能模块化，每个模块独立，后续新增不影响已有功能
- 系统预设分类/渠道 + 用户可自定义扩展
- 每个用户数据完全独立，无管理员角色

---

## 功能模块划分

### 模块一：用户系统
- 注册（邮箱+密码，后续迭代加手机号+验证码）
- 登录/退出（JWT Token）
- 个人中心（修改密码、绑定手机/邮箱）

### 模块二：收支记录
- 新增收入/支出（金额、日期、分类、来源/渠道、备注）
- 编辑/删除记录
- 批量导入 CSV / Excel
- 记录列表（支持分类、日期、金额排序筛选，分页）

### 模块三：分类与来源管理
- 系统预设支出分类：餐饮、购物、交通、娱乐、医疗、住房、教育、其他
- 系统预设收入来源：工资、奖金、兼职、投资、转账、其他
- 系统预设支付渠道：银行卡、微信、支付宝、现金、其他
- 用户可新增、编辑、删除自己的分类/来源/渠道
- 预设分类不可删除

### 模块四：统计与可视化
- 时间段筛选：今日、本周、本月、本年、自定义范围
- 饼图：支出分类占比、收入来源占比
- 柱状图：月度收支对比、每日消费趋势
- 折线图：时间段内消费趋势
- 各支付渠道余额统计
- 总资产概览：总收入 - 总支出 = 当前余额

### 模块五：预算管理
- 为支出分类设置月度预算
- 超支页面提醒
- 预算使用进度展示

### 模块六：AI 智能分析（接入 DeepSeek）
- 消费分析报告（消费习惯、高消费日识别）
- 存钱建议（基于消费模式给出可操作建议）
- 导入账单自动分类

---

## 数据库设计

```
users
├── id              INT PK AUTO_INCREMENT
├── email           VARCHAR(255) UNIQUE
├── password_hash   VARCHAR(255)
├── phone           VARCHAR(20)
├── created_at      DATETIME

categories
├── id              INT PK AUTO_INCREMENT
├── user_id         INT FK (NULL = 系统预设)
├── type            ENUM('income','expense')
├── name            VARCHAR(50)
├── icon            VARCHAR(50)
├── is_preset       BOOLEAN DEFAULT FALSE
├── created_at      DATETIME

payment_methods
├── id              INT PK AUTO_INCREMENT
├── user_id         INT FK (NULL = 系统预设)
├── name            VARCHAR(50)
├── balance         DECIMAL(12,2) DEFAULT 0
├── is_preset       BOOLEAN DEFAULT FALSE
├── created_at      DATETIME

transactions
├── id              INT PK AUTO_INCREMENT
├── user_id         INT FK
├── type            ENUM('income','expense')
├── amount          DECIMAL(12,2)
├── category_id     INT FK
├── payment_method_id INT FK
├── source_name     VARCHAR(50)
├── note            TEXT
├── transaction_date DATE
├── created_at      DATETIME

budgets
├── id              INT PK AUTO_INCREMENT
├── user_id         INT FK
├── category_id     INT FK
├── amount          DECIMAL(12,2)
├── period          ENUM('monthly','weekly') DEFAULT 'monthly'
├── created_at      DATETIME
```

---

## API 接口设计

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/send-code | 发送短信验证码 |
| GET | /api/auth/me | 获取当前用户信息 |
| PUT | /api/auth/me | 修改个人信息/密码 |

### 收支记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/transactions | 列表（筛选：分类、日期范围、类型、分页） |
| POST | /api/transactions | 新增一条 |
| PUT | /api/transactions/:id | 编辑一条 |
| DELETE | /api/transactions/:id | 删除一条 |
| POST | /api/transactions/import | 批量导入 CSV/Excel |

### 分类管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/categories | 分类列表（预设 + 自定义） |
| POST | /api/categories | 新增自定义分类 |
| PUT | /api/categories/:id | 编辑自定义分类 |
| DELETE | /api/categories/:id | 删除自定义分类 |

### 支付渠道管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/payment-methods | 渠道列表 |
| POST | /api/payment-methods | 新增自定义渠道 |
| PUT | /api/payment-methods/:id | 编辑渠道（含更新余额） |
| DELETE | /api/payment-methods/:id | 删除自定义渠道 |

### 统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stats/summary | 总览（总收入、总支出、余额） |
| GET | /api/stats/by-category | 按分类统计（饼图数据） |
| GET | /api/stats/by-month | 月度收支对比 |
| GET | /api/stats/by-day | 每日消费趋势 |
| GET | /api/stats/account-balances | 各支付渠道余额 |

### 预算

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/budgets | 所有预算设定 |
| POST | /api/budgets | 新增预算 |
| PUT | /api/budgets/:id | 编辑预算 |
| GET | /api/budgets/status | 预算使用情况（含超支提醒） |

### AI 分析

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/ai/analysis | 生成消费分析报告 |
| GET | /api/ai/advice | 生成存钱建议 |
| POST | /api/ai/auto-classify | 对导入数据自动分类 |

### 通用约定
- 除注册/登录外，所有接口需 Authorization Header 传 JWT
- 返回格式：成功 `{ code: 200, data: ... }`，失败 `{ code: xxx, message: "..." }`
- 分页参数：`?page=1&pageSize=20`

---

## 页面结构

```
/                    首页/仪表盘（收支概览 + 快捷入口）
/login               登录页
/register            注册页
/transactions        收支记录列表
/transactions/new    新增收支
/transactions/:id    编辑收支
/import              CSV/Excel 导入
/categories          分类管理
/payment-methods     支付渠道管理
/stats               统计与分析（图表仪表盘）
/budgets             预算管理
/ai-analysis         AI 分析报告
/profile             个人中心
```

---

## 项目目录结构

```
my-finance/
├── client/                     ← Vue 3 前端
│   ├── src/
│   │   ├── views/              ← 页面组件
│   │   ├── components/         ← 可复用组件
│   │   ├── stores/             ← Pinia 状态管理
│   │   ├── api/                ← 后端请求封装（axios）
│   │   ├── router/             ← 路由配置
│   │   ├── i18n/               ← 国际化（中英文）
│   │   ├── utils/              ← 工具函数
│   │   ├── assets/             ← 静态资源
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     ← Express 后端
│   ├── src/
│   │   ├── routes/             ← API 路由
│   │   ├── controllers/        ← 业务逻辑
│   │   ├── services/           ← AI 调用、文件解析
│   │   ├── middleware/         ← JWT 验证、错误处理
│   │   ├── utils/              ← 工具函数
│   │   └── app.js              ← Express 入口
│   ├── prisma/
│   │   └── schema.prisma       ← 数据库模型
│   └── package.json
│
├── shared/                     ← 前后端共享常量
│   └── constants.js
│
├── docs/                       ← 项目文档
│   └── superpowers/
│       └── specs/
│           └── 2026-05-31-personal-finance-tracker-design.md
│
├── .gitignore
└── README.md
```

---

## 迭代开发计划

### MVP（迭代 0）
- 邮箱+密码注册登录
- 收支手动录入（新增、编辑、删除）
- 收支记录列表 + 基础筛选
- 系统预设分类和支付渠道
- 总收支概览 + 支出分类饼图

### 迭代 1
- 柱状图（月度对比）、折线图（消费趋势）
- 用户自定义分类和支付渠道
- 时间段筛选（今日/本周/本月/本年/自定义）
- 各支付渠道余额管理
- 移动端适配优化

### 迭代 2
- CSV/Excel 文件导入
- 手机号+验证码登录
- 预算设置 + 超支页面提醒
- 数据导出 CSV/Excel
- 中英文双语切换

### 迭代 3
- DeepSeek AI 接入
- 消费分析报告
- AI 存钱建议
- 导入账单 AI 自动分类

---

## 非功能性需求

- 密码使用 bcrypt 哈希存储，不存明文
- JWT Token 有效期 7 天，过期自动跳转登录页
- SQL 查询使用 Prisma 参数化，防止注入
- API 输入校验（金额非负、日期格式等）
- 前端路由懒加载，首屏加载控制在合理范围
- 图表数据缓存，避免频繁重复查询
- 后续扩展：功能模块保持独立，新增模块不影响已有代码
