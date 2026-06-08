const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../middleware/auth')

function getPrisma(req) {
  return req.app.get('prisma')
}

async function register(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ code: 400, message: '邮箱和密码不能为空' })
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码至少6位' })
    }

    const prisma = getPrisma(req)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ code: 400, message: '该邮箱已被注册' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash }
    })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ code: 200, data: { token, user: { id: user.id, email: user.email } } })
  } catch (err) {
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ code: 400, message: '邮箱和密码不能为空' })
    }

    const prisma = getPrisma(req)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(400).json({ code: 400, message: '邮箱或密码错误' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(400).json({ code: 400, message: '邮箱或密码错误' })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ code: 200, data: { token, user: { id: user.id, email: user.email } } })
  } catch (err) {
    next(err)
  }
}

async function me(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, phone: true, createdAt: true }
    })
    res.json({ code: 200, data: user })
  } catch (err) {
    next(err)
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ code: 400, message: '请填写旧密码和新密码' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ code: 400, message: '新密码至少6位' })
    }

    const prisma = getPrisma(req)
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const valid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!valid) {
      return res.status(400).json({ code: 400, message: '旧密码不正确' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash }
    })
    res.json({ code: 200, data: null, message: '密码修改成功' })
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, me, changePassword }
