const { Restaurant, Category } = require('../models')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    // 可以注意的是，因為從網址列 query 下來的東西是字串，所以要先轉換成數字
    const categoryId = Number(req.query.categoryId) || ''

    console.log('seeeeeeeee', categoryId)
    /*
    這裡的 where 可以用非 sequelize 語法來完成
    const where = {}
    if (categoryId) where.categoryId = categoryId

    然後 Restaurant.findAll 裡面的參數做調整
    Restaurant.findAll({
      include: Category,
      where, // where: where 的簡寫
      nest: true,
      raw: true
    })
    */

    return Promise.all([
      Restaurant.findAll({
        include: Category,
        where: { // 查詢條件
          ...categoryId ? { categoryId } : {}
          // 檢查 categoryId 是否為空值，如果為空 sequelize 也會自動忽視這個條件
          // 另外，展開運算子的優先值較低，所以會先執行中間的三元運算子
          // 可以看做醬子 ...(categoryId ? { categoryId } : {})
        },
        nest: true,
        raw: true
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        const data = restaurants.map(r => ({
          ...r,

          // 使前端拿到的資料縮減
          description: r.description.substring(0, 50)
        }))
        return res.render('restaurants', {
          restaurants: data,
          categories,
          categoryId
        })
      })
      .catch(err => next(err))
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
