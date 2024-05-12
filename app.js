const express = require('express')
const handlebars = require('express-handlebars') // 引入 express-handlebars
const flash = require('connect-flash')
const session = require('express-session')

const routes = require('./routes')

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
app.engine('hbs', handlebars({ extname: '.hbs' }))
// 設定使用 Handlebars 做為樣板引擎
app.set('view engine', 'hbs')

app.use(express.urlencoded({ extended: true }))
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false })) // 使用 session
app.use(flash()) // 掛載套件

app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success_messages') // 設定 success_msg 訊息
  res.locals.error_messages = req.flash('error_messages') // 設定 warning_msg 訊息
  next()
})

app.use(routes)

app.listen(port, () => {
  console.info(`Example app listening on port ${port}!`)
})

module.exports = app
