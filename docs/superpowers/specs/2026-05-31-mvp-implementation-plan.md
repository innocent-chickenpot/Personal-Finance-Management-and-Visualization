# MVP 实现计划

## 阶段 0：项目初始化

### 0.1 创建项目根目录结构
- 初始化根目录 package.json（npm workspace 或 concurrently 脚本）
- 创建 client/、server/、shared/、docs/ 目录
- 创建 .gitignore（node_modules、.env、dist 等）
- git init

### 0.2 搭建后端
- `cd server && npm init`
- 安装依赖：express、cors、dotenv、bcryptjs、jsonwebtoken、prisma、@prisma/client、morgan
- 安装开发依赖：nodemon
- 创建 Express 入口 `server/src/app.js`（基础中间件 + 端口监听）
- 创建 `server/prisma/schema.prisma`（按设计文档定义 5 个模型）
- 运行 `npx prisma migrate dev` 创建数据库表
- 编写 Prisma 种子脚本，插入系统预设分类和支付渠道
- 运行 `npx prisma db seed`

### 0.3 搭建前端
- `cd client && npm create vite@latest . -- --template vue`
- 安装依赖：vue-router、pinia、axios、element-plus、echarts、vue-echarts
- 配置 Vite：代理 /api 到后端端口（http://localhost:3000）
- 引入 Element Plus（全局注册或按需导入）
- 创建基础目录结构：views/、components/、stores/、api/、router/

### 0.4 共享常量
- `shared/constants.js`：分类常量、支付渠道常量、API 响应码

---

## 阶段 1：用户认证（后端 + 前端）

### 1.1 后端 Auth
- `server/src/middleware/auth.js`：JWT 验证中间件（解析 Token，挂载 req.user）
- `server/src/middleware/errorHandler.js`：全局错误处理中间件
- `POST /api/auth/register`：校验邮箱格式和密码长度 → bcrypt 加密 → 写入 users 表 → 返回 JWT
- `POST /api/auth/login`：查找用户 → bcrypt 比对 → 返回 JWT
- `GET /api/auth/me`：返回当前用户信息（需 JWT）
- `PUT /api/auth/me`：修改密码（需旧密码验证）

### 1.2 前端 Auth
- `src/api/request.js`：axios 实例封装（baseURL、拦截器自动加 Token、401 跳登录页）
- `src/stores/auth.js`：Pinia store（登录状态、Token 存储、用户信息）
- `src/router/index.js`：路由配置 + 导航守卫（未登录跳 /login）
- `/login` 页面：邮箱 + 密码表单，调用 login API
- `/register` 页面：邮箱 + 密码 + 确认密码，调用 register API
- App.vue：顶部导航栏（已登录显示用户信息和退出按钮）

---

## 阶段 2：收支记录 CRUD（后端 + 前端）

### 2.1 后端 Transactions
- `GET /api/transactions`：查询当前用户的记录，支持 `?type=expense&category_id=1&start_date=2026-01-01&end_date=2026-01-31&page=1&pageSize=20`，关联 category 和 payment_method 名称
- `POST /api/transactions`：校验必填字段（type、amount、category_id、payment_method_id、transaction_date），写入
- `PUT /api/transactions/:id`：校验记录属于当前用户，更新字段
- `DELETE /api/transactions/:id`：校验记录属于当前用户，删除

### 2.2 前端 Transactions
- `/transactions` 列表页：
  - 搜索筛选栏（类型下拉、分类下拉、日期范围选择器）
  - 记录列表（Element Plus Table，显示日期、类型、分类、金额、渠道、备注、操作按钮）
  - 分页组件
  - "新增"按钮跳转新增页
- `/transactions/new` 新增页：
  - 表单：类型（收入/支出切换）、金额、分类（根据类型动态加载）、支付渠道、日期、备注
  - 提交调用 POST API，成功后跳转列表页
- 编辑：点击列表行或编辑按钮，弹出对话框或跳转编辑页，表单回填数据，调用 PUT API
- 删除：删除按钮 → 确认弹窗 → 调用 DELETE API → 刷新列表

---

## 阶段 3：分类与渠道接口（后端）

### 3.1 分类 API
- `GET /api/categories?type=expense`：返回预设 + 当前用户自定义分类
- `POST /api/categories`：新增自定义分类（校验名称非空、不重复）
- `PUT /api/categories/:id`：仅允许编辑自己的自定义分类
- `DELETE /api/categories/:id`：仅允许删除自己的自定义分类，且未被使用

### 3.2 支付渠道 API
- `GET /api/payment-methods`：返回预设 + 当前用户自定义渠道
- `POST /api/payment-methods`：新增自定义渠道
- `PUT /api/payment-methods/:id`：编辑渠道（含余额）
- `DELETE /api/payment-methods/:id`：仅允许删除自己的自定义渠道，且未被使用

---

## 阶段 4：基础统计（后端 + 前端）

### 4.1 后端 Stats
- `GET /api/stats/summary`：查询当前用户总收入、总支出、余额
- `GET /api/stats/by-category?start_date=&end_date=&type=expense`：按分类汇总金额，返回饼图数据 `[{ name: "餐饮", value: 3500 }, ...]`

### 4.2 前端 Dashboard（首页 `/`）
- 顶部三张卡片：总收入（绿色）、总支出（红色）、余额（蓝色）
- 支出分类饼图（ECharts 饼图，从 by-category 获取数据）
- 快捷入口按钮：新增收支、查看记录

---

## 阶段 5：预设数据种子 + 联调测试

### 5.1 种子数据
```javascript
// 系统预设支出分类
{ name: "餐饮", type: "expense", is_preset: true }
{ name: "购物", type: "expense", is_preset: true }
{ name: "交通", type: "expense", is_preset: true }
{ name: "娱乐", type: "expense", is_preset: true }
{ name: "医疗", type: "expense", is_preset: true }
{ name: "住房", type: "expense", is_preset: true }
{ name: "教育", type: "expense", is_preset: true }
{ name: "其他", type: "expense", is_preset: true }

// 系统预设收入分类
{ name: "工资", type: "income", is_preset: true }
{ name: "奖金", type: "income", is_preset: true }
{ name: "兼职", type: "income", is_preset: true }
{ name: "投资", type: "income", is_preset: true }
{ name: "转账", type: "income", is_preset: true }
{ name: "其他", type: "income", is_preset: true }

// 系统预设支付渠道
{ name: "银行卡", is_preset: true, balance: 0 }
{ name: "微信", is_preset: true, balance: 0 }
{ name: "支付宝", is_preset: true, balance: 0 }
{ name: "现金", is_preset: true, balance: 0 }
{ name: "其他", is_preset: true, balance: 0 }
```

### 5.2 联调
- 从注册开始走通完整流程：注册 → 登录 → 新增一笔支出 → 列表看到记录 → 首页看到统计变化 → 饼图更新
- 确认分类筛选和分页正常
- 确认编辑和删除正常

---

## 产出物（MVP 完成时）

| 功能 | 状态 |
|------|------|
| 用户注册/登录 | 可用 |
| 手动新增收支 | 可用 |
| 编辑/删除收支 | 可用 |
| 记录列表 + 筛选分页 | 可用 |
| 系统预设分类/渠道 | 可用 |
| 首页收支概览卡片 | 可用 |
| 支出分类饼图 | 可用 |

---

## 技术实现要点

### JWT 流程
1. 注册/登录成功 → 服务端生成 Token（payload: { userId }，有效期 7 天）
2. 前端存入 localStorage
3. axios 拦截器自动在请求头加 `Authorization: Bearer <token>`
4. auth 中间件解析 Token，挂载 `req.userId`
5. 各 API 用 `req.userId` 查询当前用户数据

### 前端请求封装结构
```javascript
// src/api/request.js
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const request = axios.create({ baseURL: '/api' })

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      // token 失效，跳登录
      router.push('/login')
    }
    return Promise.reject(err)
  }
)

export default request
```

### 路由守卫结构
```javascript
// src/router/index.js
const routes = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { guest: true } },
  { path: '/register', component: () => import('@/views/Register.vue'), meta: { guest: true } },
  { path: '/', component: () => import('@/views/Dashboard.vue'), meta: { requiresAuth: true } },
  // ...
]

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) next('/login')
  else if (to.meta.guest && token) next('/')
  else next()
})
```
