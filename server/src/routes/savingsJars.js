const { Router } = require('express')
const { auth } = require('../middleware/auth')
const { list, create, update, remove, deposit } = require('../controllers/savingsJarController')

const router = Router()
router.use(auth)

router.get('/', list)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', remove)
router.post('/:id/deposit', deposit)

module.exports = router
