const express = require('express')
const router = express.Router()

const passport = require('../../config/passport')

const admin = require('./modules/admin')

const restController = require('../../controllers/apis/restaurant-controller')
const userController = require('../../controllers/apis/user-controller')

const { authenticated, authenticatedAdmin } = require('../../middleware/api-auth')
const { apiErrorHandler } = require('../../middleware/error-handler')

router.use('/admin', authenticated, authenticatedAdmin, admin)

router.post('/signup', userController.signUp)

// 把 session 關掉後，passport 就不會幫忙寫 cookie，也不會去管 session
router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)

router.get('/restaurants/feeds', authenticated, restController.getFeeds) // 最新動態頁面，要放在 :id 前面，不然會被誤認為是 id
router.get('/restaurants/top', authenticated, restController.getTopRestaurants) // top 10 餐廳頁面
router.get('/restaurants/:id/dashboard', authenticated, restController.getDashboard)
router.get('/restaurants/:id', authenticated, restController.getRestaurant)
router.get('/restaurants', authenticated, restController.getRestaurants)

router.use('/', apiErrorHandler)

module.exports = router
