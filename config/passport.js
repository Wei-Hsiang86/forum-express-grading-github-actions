const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User

// set up Passport strategy
passport.use(new LocalStrategy(
  // customize user field
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  // authenticate user
  (req, email, password, cb) => {
    User.findOne({ where: { email } })
      .then(user => {
        // 如果找不到對應的 email，這時候 user 會是 null，那 !null 就會是 true
        if (!user) return cb(null, false, req.flash('error_messages', '帳號或密碼輸入錯誤！'))

        // 有找到對應的 email，那就進行 bcrypt 的判斷
        // password 是使用者輸入的密碼；user.password 是 DB 儲存的密碼
        bcrypt.compare(password, user.password).then(res => {
          // 一樣，這裡使用箭頭函式，res 是自己設定的參數名稱
          // res 如果是 false 代表比對失敗，所以 !res 就會是 true
          if (!res) return cb(null, false, req.flash('error_messages', '帳號或密碼輸入錯誤！'))
          return cb(null, user)
        })
      })
  }
))

// serialize and deserialize user
passport.serializeUser((user, cb) => {
  cb(null, user.id)
})
passport.deserializeUser((id, cb) => {
  User.findByPk(id).then(user => {
    user = user.toJSON()
    // console.log(user) // 暫時添加
    // 透過 ocnsole 我們可以知道，其實 user 是一個 sequelize 的 instance，可以直接透過相關的語法操作
    // 如果要傳成一般的 json，那使用 toJSON() 這個 function 即可
    return cb(null, user)
  })
})
module.exports = passport
