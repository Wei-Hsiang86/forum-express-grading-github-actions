const express = require('express')
const router = express.Router()

const adminController = require('../../controllers/admin-controller')

const upload = require('../../middleware/multer')

// 路由的判斷順序很重要，其邏輯是找對相對應的路徑就會 ,mapping 進去，後續就直接忽略
// 所以會把相對嚴格的判斷放在外面
router.get('/restaurants/create', adminController.createRestaurant)
router.get('/restaurants/:id/edit', adminController.editRestaurant)
router.get('/restaurants/:id', adminController.getRestaurant)
router.put('/restaurants/:id', upload.single('image'), adminController.putRestaurant)
router.delete('/restaurants/:id', adminController.deleteRestaurant)
router.get('/restaurants', adminController.getRestaurants)
router.post('/restaurants', upload.single('image'), adminController.postRestaurant)

router.get('/users', adminController.getUsers)
router.patch('/users/:id', adminController.patchUsers)

router.use('/', (req, res) => { res.redirect('/admin/restaurants') })

module.exports = router
