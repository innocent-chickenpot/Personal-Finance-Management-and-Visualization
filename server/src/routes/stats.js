const { Router } = require('express')
const { auth } = require('../middleware/auth')
const { summary, byCategory, monthlyTrend } = require('../controllers/statsController')

const router = Router()
router.use(auth)

router.get('/summary', summary)
router.get('/by-category', byCategory)
router.get('/monthly-trend', monthlyTrend)

module.exports = router
