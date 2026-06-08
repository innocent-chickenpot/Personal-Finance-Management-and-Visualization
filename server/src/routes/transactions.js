const { Router } = require('express')
const multer = require('multer')
const { auth } = require('../middleware/auth')
const {
  list, create, update, remove, parseBill, importParsed
} = require('../controllers/transactionController')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase()
    if (['csv', 'xlsx', 'xls'].includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 CSV、XLSX 格式文件'))
    }
  }
})

const router = Router()
router.use(auth)

router.get('/', list)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', remove)
router.post('/parse-bill', upload.array('files', 5), parseBill)
router.post('/import-parsed', importParsed)

module.exports = router
