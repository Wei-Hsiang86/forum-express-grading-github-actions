const express = require('express')
const router = express.Router()

const passport = require('../../config/passport')

const admin = require('./modules/admin')

const restController = require('../../controllers/apis/restaurant-controller')
const userController = require('../../controllers/apis/user-controller')

const { apiErrorHandler } = require('../../middleware/error-handler')

router.use('/admin', admin)

// 把 session 關掉後，passport 就不會幫忙寫 cookie，也不會去管 session
router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)

router.get('/restaurants', restController.getRestaurants)

router.use('/', apiErrorHandler)

module.exports = router
