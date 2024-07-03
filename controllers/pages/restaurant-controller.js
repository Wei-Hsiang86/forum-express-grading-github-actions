// controller 處理流程控制，負責接收資料來源及整理回傳結果

const { Restaurant, Category, Comment, User } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category, // 拿出關聯的 Category model
        {
          model: Comment,
          include: [{
            model: User,
            attributes: ['id', 'name'] // Specify which user attributes you want to include [排序依據欄位名稱, 排序方式]
          }],
          order: [[Comment, 'id', 'DESC']] // Order comments by their id in descending order
        },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        // console.log(restaurant.Comments) // 查看輸出內容
        return restaurant.increment('viewCounts')
      })
      .then(restaurant => {
        // 使用 some 相對於 map 而言，可以減少實際可能執行次數
        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(l => l.id === req.user.id)

        // console.log(restaurant.toJSON().Comments)
        res.render('restaurant', {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        Comment,
        { model: User, as: 'FavoritedUsers' }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Dashboard didn't exist!")

        // console.log(restaurant)
        // console.log(restaurant.toJSON())

        res.render('dashboard', { restaurant: restaurant.toJSON() })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']], // 裡面可以放多組排序的條件，當條件一樣就換下一組
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', {
          restaurants,
          comments
        })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      include: [{ model: User, as: 'FavoritedUsers' }]
    })
      .then(restaurants => {
        const result = restaurants
          .map(restaurant => ({
            ...restaurant.toJSON(),
            description: restaurant.dataValues.description.substring(0, 30),
            favoritedCount: restaurant.FavoritedUsers.length,
            isFavorited: req.user && req.user.FavoritedRestaurants.map(fr => fr.id).includes(restaurant.id)
          }))
          .sort((a, b) => b.favoritedCount - a.favoritedCount)

        const topRests = result.splice(0, 10)

        // console.log(topRests)

        res.render('top-restaurants', { restaurants: topRests })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
