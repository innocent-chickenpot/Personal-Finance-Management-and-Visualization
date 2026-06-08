const { Router } = require('express')
const { auth } = require('../middleware/auth')
const { list, create, update, remove } = require('../controllers/paymentMethodController')

const router = Router()
router.use(auth)

router.get('/', list)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', remove)

module.exports = router
