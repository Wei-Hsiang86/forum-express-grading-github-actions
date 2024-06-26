const { Restaurant, Category, Comment, User } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    // 可以注意的是，因為從網址列 query 下來的東西是字串，所以要先轉換成數字
    const categoryId = Number(req.query.categoryId) || ''

    // 分頁器設定
    const DEFAULT_LIMIT = 9
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

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
      Restaurant.findAndCountAll({
        include: Category,
        where: { // 查詢條件
          ...categoryId ? { categoryId } : {}
          // 檢查 categoryId 是否為空值，如果為空 sequelize 也會自動忽視這個條件
          // 另外，展開運算子的優先值較低，所以會先執行中間的三元運算子
          // 可以看做醬子 ...(categoryId ? { categoryId } : {})
        },
        limit,
        offset,
        nest: true,
        raw: true
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        // 把這個變數拿出來，避免在 data 的 map 中，每次都要再跑一次 fr 的 map
        // 另外因為 req.user 有可能是空的，所以要寫成下方這要先做檢查
        // 因為空陣列如果以布林表示為： true
        const favoritedRestaurantsId = req.user && req.user.FavoritedRestaurants.map(fr => fr.id)
        const likedRestaurantsId = req.user && req.user.LikedRestaurants.map(lr => lr.id)
        const data = restaurants.rows.map(r => ({
          ...r,

          // 使前端拿到的資料縮減
          description: r.description.substring(0, 50),
          isFavorited: favoritedRestaurantsId.includes(r.id),
          isLiked: likedRestaurantsId.includes(r.id)
        }))
        return res.render('restaurants', {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => next(err))
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
