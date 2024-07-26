const bcrypt = require('bcryptjs')
const { User, Restaurant, Favorite } = require('../models')

const userServices = {
  signUp: (req, cb) => {
    // 如果兩次輸入的密碼不同，就建立一個 Error 物件並拋出
    if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match!')

    // 確認資料裡面沒有一樣的 email，若有，就建立一個 Error 物件並拋出
    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')
        // console.log('沒有找到 user 長醬子：' + user) 會是 null

        return bcrypt.hash(req.body.password, 10)
        // console.log(req.body) 查看封包狀態，跟前面一樣
        // 前面記得加 return，才會把值傳下去
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
      .then(data => cb(null, data))
      .catch(err => cb(err))
      // 在 express 中，next() 如果有參數，就代表拋出錯誤
      // 接住前面拋出的錯誤，呼叫專門做錯誤處理的 middleware
  },
  addFavorite: (req, cb) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (favorite) throw new Error('You have favorited this restaurant!')

        return Favorite.create({
          userId: req.user.id,
          restaurantId
        })
      })
      .then(newFavorite => cb(null, newFavorite))
      .catch(err => cb(err))
  },
  removeFavorite: (req, cb) => {
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(favorite => {
        if (!favorite) throw new Error("You haven't favorited this restaurant")

        return favorite.destroy()
      })
      .then(rmFavorite => cb(null, rmFavorite))
      .catch(err => cb(err))
  }
}

module.exports = userServices
