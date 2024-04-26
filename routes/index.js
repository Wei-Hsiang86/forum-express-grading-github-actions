const express = require('express')
const router = express.Router()

const admin = require('./modules/admin')

const restController = require('../controllers/restaurant-controller')

// 寫路由要注意，條件複雜的判斷網上放，簡單的往下擺
router.use('/admin', admin)

router.get('/restaurants', restController.getRestaurants)
// 設定 fallback 路由，意義為其他路由條件都不符合時，最終會通過的路由
// 也就是說，當程式一路由上而下執行，萬一都匹配不到和請求相符的路徑，此時不論此 request 是用哪個 HTTP method 發出的，都會匹配到這一行
// 注意這裡的 method 是用 use
router.use('/', (req, res) => { res.redirect('/restaurants') })

module.exports = router
