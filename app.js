const path = require('path')

const express = require('express')
const handlebars = require('express-handlebars') // 引入 express-handlebars
const flash = require('connect-flash')
const methodOverride = require('method-override')
const session = require('express-session')
const passport = require('./config/passport')

const handlebarsHelpers = require('./helpers/handlebars-helpers')
// 因為 exports 是物件型式的，所以這裡變數也要這樣設計。簡單來說就是 exports 什麼 require 就會拿到什麼
const { getUser } = require('./helpers/auth-helpers')

const { pages } = require('./routes')

// 因為太常用了，所以之後的 express 把這個包在裡面，不用特別 import 了
// const bodyParser = require('body-parser')
// app.use(bodyParser.urlencoded({ extended: true }))

const app = express()
const port = process.env.PORT || 3000
const SESSION_SECRET = 'secret'

// 因為目前程式的入口是 app.js
// 所以可以藉由引用進來，測試有沒有問題(看有沒有 error)
// const db = require('./models')

// 註冊 Handlebars 樣板引擎，並指定副檔名為 .hbs
app.engine('hbs', handlebars({ extname: '.hbs', helpers: handlebarsHelpers }))
// 設定使用 Handlebars 做為樣板引擎
app.set('view engine', 'hbs')

app.use(express.urlencoded({ extended: true }))
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false })) // 使用 session
app.use(passport.initialize()) // 初始化 Passport，要在 session 後面，因為 passport 會用到 session 的功能
app.use(passport.session()) // 啟動 session 功能
app.use(flash()) // 掛載套件
app.use(methodOverride('_method')) // 使用 method-override，參數名稱可自訂。另外使用套件至少要放在 listen 之前
app.use('/upload', express.static(path.join(__dirname, 'upload')))

// 觀察用
// app.use((req, res, next) => {
//   console.log('req.body 有甚麼:', req.body)
//   console.log('req.user 有甚麼:', req.user)
//   console.log('印出 session:', req.session)
//   console.log('印出 sessionID:', req.sessionID)
//   next()
// })

app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success_messages') // 設定 success_msg 訊息
  res.locals.error_messages = req.flash('error_messages') // 設定 warning_msg 訊息
  res.locals.user = getUser(req)
  next()
})

app.use(pages)

app.listen(port, () => {
  console.info(`Example app listening on port ${port}!`)
})

module.exports = app
