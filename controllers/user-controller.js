const bcrypt = require('bcryptjs')
const { User, Restaurant, Comment, Favorite, Like } = require('../models')
const { localFileHandler } = require('../helpers/file-helpers')

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
  },
  getUser: (req, res, next) => {
    return User.findByPk(req.params.id, {
      include: [
        { model: Comment, include: Restaurant }
      ]
    })
      .then(userData => {
        if (!userData) throw new Error("User didn't exists!")

        const user = userData.toJSON()

        user.commentedRestaurants = user.Comments
        // console.log(userProfile.Comments)

        return res.render('users/profile', { user })
      })
      .catch(err => next(err))
  },
  editUser: (req, res, next) => {
    // 這裡額外錯誤處理是因為，如果直接用設定好的 error handler，會導回 referer 記錄的網址
    // 但例如說 user1 直接更改網址列，試圖編輯 user2 的資料
    // 這時候會因為並沒有 referer，依據 res.redirect('back') 如果找不到
    // 就會導回根目錄，這時候因為導回是第二次跳轉，所以 flash 就被洗掉了
    // 這裡可以透過制定額外的錯誤判斷來使 flash 訊息正確顯示
    // 另外這裡會被測試程式報錯，要注意
    if (req.user.id !== Number(req.params.id)) {
      req.flash('error_messages', '只能編輯自己的資料！')
      res.redirect(`/users/${req.user.id}`)
    }
    // 或是直接在 error handler 修改，然後正常 throw error 觸發
    // 但錯誤的邏輯判斷要做的細緻疫點，不然可能會導致不同的錯誤情景，但觸發到相同的錯誤提醒
    // 因此選擇上面直接寫在 controller 就可以直接鎖定這樣的情況
    // if (req.user.id !== Number(req.params.id)) throw new Error('只能編輯自己的資料！')

    return User.findByPk(req.params.id)
      .then(user => {
        if (!user) throw new Error("User didn't exists!")

        return res.render('users/edit', { user: user.toJSON() })
      })
      .catch(err => next(err))
  },
  putUser: (req, res, next) => {
    const { name } = req.body
    const { file } = req // 把檔案取出來，也可以寫成 const file = req.file
    if (!name) throw new Error('Restaurant name is required!')
    if (req.user.id !== Number(req.params.id)) throw new Error('只能更改自己的資料！')

    return Promise.all([
      User.findByPk(req.params.id), // 去資料庫查有沒有這個使用者
      localFileHandler(file) // 把取出的檔案傳給 file-helper 處理後
    ])
      .then(([user, filePath]) => {
        if (!user) throw new Error("User didn't exist!")

        return user.update({ // 更新使用者資訊
          name,
          image: filePath || user.image
        })
      })
      .then(() => {
        req.flash('success_messages', '使用者資料編輯成功')
        res.redirect(`/users/${req.params.id}`)
      })
      .catch(err => next(err))
  },
  addFavorite: (req, res, next) => {
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
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFavorite: (req, res, next) => {
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
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  addLike: (req, res, next) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Like.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, like]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (like) throw new Error('You have liked this restaurant!')

        return Like.create({
          userId: req.user.id,
          restaurantId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeLike: (req, res, next) => {
    return Like.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(like => {
        if (!like) throw new Error("You haven't liked this restaurant")

        return like.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  }
}

module.exports = userController
