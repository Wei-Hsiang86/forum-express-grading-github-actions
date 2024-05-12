const bcrypt = require('bcryptjs')
const db = require('../models')
const { User } = db

const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => { // 修改這裡
    // console.log(req.body) 查看封包狀態

    // 如果兩次輸入的密碼不同，就建立一個 Error 物件並拋出
    if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match!')

    // 確認資料裡面沒有一樣的 email，若有，就建立一個 Error 物件並拋出
    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')
        // console.log('沒有找到 user 長醬子：' + user) 會是 null

        // console.log(req.body) 查看封包狀態，跟前面一樣
        return bcrypt.hash(req.body.password, 10) // 前面記得加 return，才會把值傳下去
      })

      .then(hash => {
        // 這裡有用箭頭函式，隱含 return
        // 檢查 hash 有甚麼，會得到一串雜湊值。下面兩種寫法都可以正常顯示，但建議用後者比較好，可以避免型別轉換
        // console.log('A 寫法 => 上個 then 回傳的東西長醬子：' + hash)
        // console.log('B 寫法 => 上個 then 回傳的東西長醬子：', hash)

        return User.create({ // 上面錯誤狀況都沒發生，就把使用者的資料寫入資料庫
          name: req.body.name,
          email: req.body.email,
          password: hash
        })
      })
      .then(() => {
        req.flash('success_messages', '成功註冊帳號！') // 並顯示成功訊息
        res.redirect('/signin')
      })
      .catch(err => next(err))
      // 在 express 中，next() 如果有參數，就代表拋出錯誤
      // 接住前面拋出的錯誤，呼叫專門做錯誤處理的 middleware
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },
  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout() // 使用 passport 提供的 function，把目前 session ID 對應的 session 清除，對 server 而言就是登出了
    res.redirect('/signin')
  }
}

module.exports = userController
