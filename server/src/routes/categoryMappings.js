const { Router } = require('express')
const { auth } = require('../middleware/auth')
const { list, save } = require('../controllers/categoryMappingController')

const router = Router()
router.use(auth)

router.get('/', list)
router.put('/', save)

module.exports = router
