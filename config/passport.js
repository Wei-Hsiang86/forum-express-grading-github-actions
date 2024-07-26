const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportJWT = require('passport-jwt')
const bcrypt = require('bcryptjs')

const { User, Restaurant } = require('../models')

const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

// set up Passport strategy
passport.use(new LocalStrategy(
  // customize user field
  // 當 column name 名稱跟默認的不同 (_username_, _password_)，可以額外設定
  // when `true`, `req` is the first argument to the verify callback (default: `false`)
  // 把 req callback (傳下去繼續使用)
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  // authenticate user
  // req 使指從前端畫面傳回來的資料
  // passport 會把 req.body 的 email 跟 passport 值抓出來
  // cb 對應到 passport 文件中 strategy.js 中的 verified 函式
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

const jwtOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}

passport.use(new JWTStrategy(jwtOptions, (jwtPayload, cb) => {
  User.findByPk(jwtPayload.id, {
    include: [
      { model: Restaurant, as: 'FavoritedRestaurants' },
      { model: Restaurant, as: 'LikedRestaurants' },
      { model: User, as: 'Followers' },
      { model: User, as: 'Followings' }
    ]
  })
    // 因為從 jwt token 解出來之後就是 json 了，所以不需要 toJSON()
    .then(user => cb(null, user))
    .catch(err => cb(err))
}))

// serialize and deserialize user
// \node_modules\passport\lib\authenticator.js
// 在這裡有提到這兩個函式的邏輯
passport.serializeUser((user, cb) => {
  // 回傳 user.id
  // console.log(user.name)
  cb(null, user.id)
})

passport.deserializeUser((id, cb) => {
  // 使用 user table
  return User.findByPk(id, {
    include: [
      // as 對應到 user model 中的命名，並且命名會成為 req.user 的物件中的屬性名稱 (key 值)
      { model: Restaurant, as: 'FavoritedRestaurants' },
      { model: Restaurant, as: 'LikedRestaurants' },
      { model: User, as: 'Followers' },
      { model: User, as: 'Followings' }
    ]
  })
    // console.log(user)
    // 透過 console 我們可以知道，其實 user 是一個 sequelize 的 instance，可以直接透過相關的語法操作
    // 如果要傳成一般的 json，那使用 toJSON() 這個 function 即可把其變成單純的 json 物件
    // 另外我們會發現 req.session 所包含很多屬性，其中有一個 passport 屬性，是一個物件
    // 而其中的屬性是 user，值為一個數字 (即為id)，而這其實是 passport 這個套件寫好的方法
    // 詳細可以看 node_modules\passport\lib\sessionmanager.js
    // 其中的 login 方法可以看到 req._passport.session.user = obj
    .then(user => cb(null, user.toJSON()))
    .catch(err => cb(err))
})

module.exports = passport
