const XLSX = require('xlsx')

/**
 * Parse uploaded bill files. Accepts an array of multer file objects.
 * Each file: { originalname, buffer, mimetype }
 * Returns: { records, errors }
 *
 * record fields:
 *   sourceTransactionId, source, sourceCategory, transactionDate,
 *   type ('expense'/'income'), amount, counterparty, product, paymentMethod, note
 */
function parseBillFiles(files) {
  const allRecords = []
  const errors = []

  for (const file of files) {
    const ext = file.originalname.split('.').pop().toLowerCase()
    try {
      if (ext === 'csv') {
        const parsed = parseAlipayCSV(file)
        allRecords.push(...parsed)
      } else if (ext === 'xlsx' || ext === 'xls') {
        const parsed = parseWechatXLSX(file)
        allRecords.push(...parsed)
      } else {
        errors.push({ file: file.originalname, message: '不支持的文件格式，请上传 CSV 或 XLSX 文件' })
      }
    } catch (e) {
      errors.push({ file: file.originalname, message: `解析失败: ${e.message}` })
    }
  }

  return { records: allRecords, errors }
}

function parseAlipayCSV(file) {
  // Alipay CSV can be UTF-8 or GBK encoded
  let raw = file.buffer.toString('utf8')

  // Detect GBK-encoded (header contains garbled when read as UTF-8)
  if (raw.includes('�') || raw.includes('֧')) {
    const iconv = require('iconv-lite')
    raw = iconv.decode(file.buffer, 'gbk')
  }

  const lines = raw.split(/\r?\n/).filter(line => line.trim())
  // Find the header row — it starts with '交易时间,交易分类'
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('交易时间,交易分类')) {
      headerIdx = i
      break
    }
  }

  if (headerIdx === -1) {
    throw new Error('未找到支付宝账单数据行，请确认文件格式正确')
  }

  const headers = lines[headerIdx].split(',')
  const records = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length < headers.length) continue
    if (!values[0]) continue

    const row = {}
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').trim() })

    // Skip non-successful transactions
    if (row['交易状态'] && row['交易状态'] !== '交易成功') continue

    // Skip neutral transactions (不计收支)
    const type = mapAlipayType(row['收/支'])
    if (!type) continue

    const amount = parseFloat(row['金额'])
    if (isNaN(amount) || amount <= 0) continue

    const counterparty = row['交易对方'] || ''
    const product = row['商品说明'] || ''
    const paymentMethod = row['收/付款方式'] || ''

    records.push({
      sourceTransactionId: row['交易订单号'] || '',
      source: 'alipay',
      sourceCategory: row['交易分类'] || '',
      transactionDate: formatDateTime(row['交易时间']),
      type,
      amount,
      counterparty,
      product,
      paymentMethod,
      note: `${counterparty} - ${product}`.slice(0, 255)
    })
  }

  return records
}

function parseWechatXLSX(file) {
  const wb = XLSX.read(file.buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_csv(ws)
  const lines = raw.split(/\r?\n/).filter(l => l.trim())

  // Find header row
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('交易时间,交易类型,交易对方,商品,收/支')) {
      headerIdx = i
      break
    }
  }

  if (headerIdx === -1) {
    throw new Error('未找到微信账单数据行，请确认文件格式正确')
  }

  const headers = lines[headerIdx].split(',')
  const records = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length < headers.length) continue
    if (!values[0]) continue

    const row = {}
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').trim() })

    // Skip neutral transactions or incomplete
    const type = mapWechatType(row['收/支'])
    if (!type) continue

    const amount = parseFloat(row['金额(元)'])
    if (isNaN(amount) || amount <= 0) continue

    const counterparty = row['交易对方'] || ''
    const product = row['商品'] || ''

    records.push({
      sourceTransactionId: row['交易单号'] || '',
      source: 'wechat',
      sourceCategory: row['交易类型'] || '',
      transactionDate: formatDateTime(row['交易时间']),
      type,
      amount,
      counterparty,
      product,
      paymentMethod: row['支付方式'] || '',
      note: `${counterparty} - ${product}`.slice(0, 255)
    })
  }

  return records
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function mapAlipayType(receiptPay) {
  if (receiptPay === '收入') return 'income'
  if (receiptPay === '支出') return 'expense'
  return null // 不计收支
}

function mapWechatType(receiptPay) {
  if (receiptPay === '收入') return 'income'
  if (receiptPay === '支出') return 'expense'
  return null
}

function formatDateTime(dt) {
  if (!dt) return ''
  // Already in YYYY-MM-DD HH:mm:ss format from both Alipay and WeChat
  // Just normalize: strip seconds for date-only storage
  const match = dt.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : dt
}

module.exports = { parseBillFiles }
