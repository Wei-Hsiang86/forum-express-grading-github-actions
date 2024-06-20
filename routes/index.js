// 母路由
const express = require('express')
const router = express.Router()

// 載入 passport 來實作驗證
const passport = require('../config/passport')

const admin = require('./modules/admin')

const restController = require('../controllers/restaurant-controller')
const userController = require('../controllers/user-controller')
const commentController = require('../controllers/comment-controller')

const upload = require('../middleware/multer')

const { authenticated, authenticatedAdmin } = require('../middleware/auth')
const { generalErrorHandler } = require('../middleware/error-handler')

// 寫路由要注意，條件複雜的判斷網上放，簡單的往下擺
router.use('/admin', authenticatedAdmin, admin)

router.get('/signup', userController.signUpPage)
router.post('/signup', userController.signUp)

router.get('/signin', userController.signInPage)
// 注意是 post 方法。令外第一個參數放的是，使用 passport 的哪個驗證方法
// 然後這裡會從 passport.js 得到 deserialize 後的物件，名稱為 user
router.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.signIn)

router.get('/logout', userController.logout)

router.get('/restaurants/feeds', authenticated, restController.getFeeds) // 最新動態頁面，要放在 :id 前面，不然會被誤認為是 id
router.get('/restaurants/top', authenticated, restController.getTopRestaurants) // top 10 餐廳頁面
router.get('/restaurants/:id/dashboard', authenticated, restController.getDashboard)
router.get('/restaurants/:id', authenticated, restController.getRestaurant)
router.get('/restaurants', authenticated, restController.getRestaurants)

router.get('/users/top', authenticated, userController.getTopUsers) // 美食達人頁面
router.get('/users/:id/edit', authenticated, userController.editUser)
router.get('/users/:id', authenticated, userController.getUser)
router.put('/users/:id', authenticated, upload.single('image'), userController.putUser)

router.delete('/comments/:id', authenticatedAdmin, commentController.deleteComment)
router.post('/comments', authenticated, commentController.postComment)

router.post('/favorite/:restaurantId', authenticated, userController.addFavorite)
router.delete('/favorite/:restaurantId', authenticated, userController.removeFavorite)

router.post('/like/:restaurantId', authenticated, userController.addLike)
router.delete('/like/:restaurantId', authenticated, userController.removeLike)

router.post('/following/:userId', authenticated, userController.addFollowing)
router.delete('/following/:userId', authenticated, userController.removeFollowing)

// 設定 fallback 路由，意義為其他路由條件都不符合時，最終會通過的路由，並且要在 error handler 前面
// 也就是說，當程式一路由上而下執行，萬一都匹配不到和請求相符的路徑，此時不論此 request 是用哪個 HTTP method 發出的，都會匹配到這一行
router.get('/', (req, res) => { res.redirect('/restaurants') })
router.use('/', generalErrorHandler)

module.exports = router
