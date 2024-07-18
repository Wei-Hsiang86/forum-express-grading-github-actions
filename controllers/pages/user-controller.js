const { User, Restaurant, Comment, Favorite, Like, Followship } = require('../../models')
const { localFileHandler } = require('../../helpers/file-helpers')
const userServices = require('../../services/user-services')

const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    userServices.signUp(req, err => {
      // console.log(req.body) 查看封包狀態
      if (err) return next(err)

      req.flash('success_messages', '成功註冊帳號！')
      res.redirect('/signin')
    })
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
        { model: Comment, include: Restaurant },
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' }
      ]
    })
      .then(user => {
        if (!user) throw new Error("User didn't exists!")

        const userProfile = user.toJSON()
        // console.log(userProfile)

        const isFollowed = req.user.Followings.some(d => d.id === userProfile.id)

        // 這裡也會被測試偵測到錯誤，測試要求傳到 handlebar 的資料名稱要為 user
        // 但這樣會導致 header 使用者名稱會依據點選的使用者而變動
        return res.render('users/profile', { userProfile, isFollowed })
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
  },
  getTopUsers: (req, res, next) => {
    // 撈出所有 User 與 followers 資料
    return User.findAll({
      include: [{ model: User, as: 'Followers' }]
    })
      .then(users => {
        // 對查出來的資料，新增一個變數記錄，保留原本的資料
        const result = users
        // 整理 users 資料，把每個 user 項目都拿出來處理一次，並把新陣列儲存在 users 裡
          .map(user => ({
          // 整理格式
            ...user.toJSON(),
            // 計算追蹤者人數
            followerCount: user.Followers.length,
            // 判斷目前登入使用者是否已追蹤該 user (現在處理中的人) 的物件
            isFollowed: req.user.Followings.some(f => f.id === user.id)
          }))
          .sort((a, b) => b.followerCount - a.followerCount)

        res.render('top-users', { users: result })
      })
      .catch(err => next(err))
  },
  addFollowing: (req, res, next) => {
    const { userId } = req.params
    Promise.all([
      User.findByPk(userId),
      Followship.findOne({
        where: {
          followerId: req.user.id,
          followingId: req.params.userId
        }
      })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) throw new Error('You are already following this user!')
        return Followship.create({
          followerId: req.user.id,
          followingId: userId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFollowing: (req, res, next) => {
    Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this user!")
        return followship.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  }
}

module.exports = userController
