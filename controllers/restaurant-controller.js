const { Restaurant, Category } = require('../models')
const restaurantController = {
  getRestaurants: (req, res) => {
    return Restaurant.findAll({
      include: Category,
      nest: true,
      raw: true
    }).then(restaurants => {
      const data = restaurants.map(r => ({
        ...r,

        // 使前端拿到的資料縮減
        description: r.description.substring(0, 50)
      }))
      return res.render('restaurants', {
        restaurants: data
      })
    })
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category // 拿出關聯的 Category model
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return restaurant.increment('viewCounts')
      })
      .then(restaurant => {
        res.render('restaurant', { restaurant: restaurant.toJSON() })
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category,
      nest: true,
      raw: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Dashboard didn't exist!")

        res.render('dashboard', {
          restaurant
        })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
