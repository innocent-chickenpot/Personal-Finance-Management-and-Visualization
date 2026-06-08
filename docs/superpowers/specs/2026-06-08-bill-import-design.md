# 微信/支付宝账单自动导入 — 设计文档

## 概述

用户从微信/支付宝 App 导出账单文件（微信 .xlsx / 支付宝 .csv），上传到系统后自动解析、去重、归类，批量导入到收支记录。

## 整体流程

```
1. 配置分类映射规则（首次，之后可修改）
2. 上传账单文件（支持同时上传微信+支付宝）
3. 预览页面
   - 解析出的所有记录展示
   - 重复记录标记"跳过"（灰色）
   - 新记录显示自动匹配的分类
   - 未匹配的标记"待分类"，可手动修改
   - 勾选要导入的记录
4. 确认导入 → 结果提示（成功 X 条，跳过 Y 条重复）
```

## 数据库变更

### transactions 表新增字段

```
sourceTransactionId  VARCHAR(128) NULL   ← 微信/支付宝交易单号（去重用）
source               VARCHAR(20)  NULL   ← 'wechat' / 'alipay'
```

### 新增 category_mapping 表

```
id           INT AUTO_INCREMENT PRIMARY KEY
userId       INT NOT NULL
source       VARCHAR(20) NOT NULL         ← 'wechat' / 'alipay'
sourceName   VARCHAR(100) NOT NULL        ← 原始分类名（如"餐饮美食"）
categoryId   INT NOT NULL                 ← 系统分类 ID
createdAt    DATETIME DEFAULT NOW()
```

## API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/transactions/parse-bill` | 上传文件，解析返回预览数据 |
| POST | `/api/transactions/import-parsed` | 确认导入选中的记录 |
| GET | `/api/category-mappings?source=wechat` | 查询当前用户的映射规则 |
| PUT | `/api/category-mappings` | 批量保存映射规则（替换） |

### POST /api/transactions/parse-bill

- Content-Type: `multipart/form-data`
- 参数：`files`（支持多个文件同时上传）
- 返回结构：

```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "sourceTransactionId": "4500000185202606084255934336",
        "source": "wechat",
        "sourceCategory": "商户消费",
        "transactionDate": "2026-06-08 17:15:39",
        "type": "expense",
        "amount": 10.00,
        "counterparty": "哈尔滨理工大学",
        "product": "一卡通充值",
        "paymentMethod": "零钱",
        "matchedCategoryId": 3,
        "matchedCategoryName": "餐饮",
        "status": "new",
        "note": "哈尔滨理工大学 - 一卡通充值"
      }
    ],
    "summary": {
      "total": 30,
      "newCount": 25,
      "duplicateCount": 5
    }
  }
}
```

每条记录的 `status`：
- `"new"` — 新记录，可导入
- `"duplicate"` — 交易单号已存在，跳过

如果分类映射未匹配，`matchedCategoryId` 和 `matchedCategoryName` 为 null，前端显示"待分类"。

### POST /api/transactions/import-parsed

```json
// Request
{
  "records": [
    { "sourceTransactionId": "...", "source": "wechat", "type": "expense", "amount": 10.00, "categoryId": 3, "transactionDate": "...", "note": "..." }
  ]
}

// Response
{ "code": 200, "data": { "imported": 25, "skipped": 5 } }
```

## 账单字段映射

### 支付宝 CSV

| 账单列名 | 映射到 | 说明 |
|----------|--------|------|
| 交易时间 | `transactionDate` | 格式 `YYYY-MM-DD HH:mm:ss` |
| 交易分类 | `sourceCategory` | 用于分类映射匹配 |
| 交易对方 | `note`（拼接） | |
| 商品说明 | `note`（拼接） | |
| 收/支 | `type` | 支出→expense, 收入→income, 不计收支→跳过 |
| 金额 | `amount` | 直接使用 |
| 交易订单号 | `sourceTransactionId` | 去重唯一键 |
| 收/付款方式 | `note`（拼接） | |
| 交易状态 | 过滤 | 非"交易成功"的记录跳过 |

- 数据起始行：第 25 行（前 24 行为文件头信息）
- 编码：UTF-8（支付宝导出的 CSV 为 GBK 编码，需转换）

### 微信 XLSX

| 账单列名 | 映射到 | 说明 |
|----------|--------|------|
| 交易时间 | `transactionDate` | 格式 `YYYY-MM-DD HH:mm:ss` |
| 交易类型 | `sourceCategory` | 用于分类映射匹配 |
| 交易对方 | `note`（拼接） | |
| 商品 | `note`（拼接） | |
| 收/支 | `type` | 支出→expense, 收入→income |
| 金额(元) | `amount` | 直接使用 |
| 支付方式 | `note`（拼接） | |
| 交易单号 | `sourceTransactionId` | 去重唯一键 |

- 数据起始行：第 17 行（前 16 行为文件头信息）
- XLSX 格式使用 `xlsx` 库解析

## 默认分类映射

### 支付宝 → 系统分类

| 支付宝交易分类 | 系统分类 |
|--------------|---------|
| 交通出行 | 交通 |
| 餐饮美食 | 餐饮 |
| 教育培训 | 教育 |
| 充值缴费 | 其他 |
| 共享租物 | 其他 |
| 转账充值 | 其他 |

### 微信 → 系统分类

| 微信交易类型 | 系统分类 |
|-------------|---------|
| 商户消费 | 其他（默认） |
| 扫二维码付款 | 其他（默认） |
| 转账 | 其他（默认） |
| 红包 | 其他（默认） |

用户可在映射设置页面自定义所有规则。

## 新增/修改文件

### 数据库

| 文件 | 操作 | 说明 |
|------|------|------|
| `server/prisma/schema.prisma` | 修改 | transactions 新增字段 + categoryMapping 模型 |
| `server/prisma/migrations/...` | 新增 | 迁移文件 |

### 后端

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/controllers/transactionController.js` | 修改 | 新增 parseBill、importParsed 方法 |
| `src/routes/transactions.js` | 修改 | 新增路由 |
| `src/controllers/categoryMappingController.js` | 新增 | 映射规则 CRUD |
| `src/routes/categoryMappings.js` | 新增 | 映射路由 |
| `src/services/billParser.js` | 新增 | 微信 XLSX + 支付宝 CSV 解析逻辑 |
| `src/app.js` | 修改 | 挂载新路由 |

### 前端

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/views/ImportBill.vue` | 新增 | 上传 + 预览 + 确认导入页面 |
| `src/views/CategoryMappings.vue` | 新增 | 分类映射规则设置页面 |
| `src/api/transactions.js` | 修改 | 新增 parseBill、importParsed 方法 |
| `src/api/categoryMappings.js` | 新增 | 映射规则 API |
| `src/router/index.js` | 修改 | 新增路由 |

## 去重逻辑

1. 解析账单时提取每条的 `交易单号`（微信）/ `交易订单号`（支付宝）
2. 在数据库 `transactions` 表中查 `sourceTransactionId` 是否存在
3. 存在 → `status: "duplicate"`，预览时灰色显示，不可勾选
4. 不存在 → `status: "new"`，可导入

重复判断 100% 准确，不依赖金额+日期模糊匹配。

## 注意事项

- 支付宝 CSV 的"不计收支"类型记录直接跳过，不进入预览
- 微信账单中"中转"类型（充值/提现）不产生实际消费，如有则跳过
- 上传文件大小限制 10MB
- 同时上传微信和支付宝文件时，合并结果显示在同一预览列表中
- 导入成功后自动跳转到交易记录列表
