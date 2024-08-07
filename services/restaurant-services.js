// services 負責與 DB 溝通，或者說負責商業邏輯運算

const { Restaurant, Category, User, Comment } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const restaurantServices = {
  getRestaurants: (req, cb) => {
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
        const favoritedRestaurantsId = req.user?.FavoritedRestaurants ? req.user.FavoritedRestaurants.map(fr => fr.id) : []
        const likedRestaurantsId = req.user?.LikedRestaurants ? req.user.LikedRestaurants.map(lr => lr.id) : []
        const data = restaurants.rows.map(r => ({
          ...r,

          // 使前端拿到的資料縮減
          description: r.description.substring(0, 50),
          isFavorited: favoritedRestaurantsId.includes(r.id),
          isLiked: likedRestaurantsId.includes(r.id)
        }))

        // 第一個參數代表錯誤的傳值，如果沒有就寫 null
        return cb(null, {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })

      // 因為有傳遞的值了，所以這裡就用 cb 把錯誤往外拋
      .catch(err => cb(err))
  },
  getRestaurant: (req, cb) => {
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

        return cb(null, {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => cb(err))
  },
  getDashboard: (req, cb) => {
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

        return cb(null, { restaurant: restaurant.toJSON() })
      })
      .catch(err => cb(err))
  },
  getFeeds: (req, cb) => {
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
        return cb(null, {
          restaurants,
          comments
        })
      })
      .catch(err => cb(err))
  },
  getTopRestaurants: (req, cb) => {
    return Restaurant.findAll({
      include: [{ model: User, as: 'FavoritedUsers' }]
    })
      .then(restaurants => {
        // console.log(restaurants[0].dataValues)

        // 下面要注意，如果要用到 substring 方法，記得可能會讀到 null
        // 又因為 null 沒有這個方法，所以會報錯
        // 可以透過驗證的方式來避免進行到 null.substring()
        restaurants = restaurants.map(r => ({
          ...r.dataValues,
          description: r.dataValues.description?.substring(0, 50),
          favoritedCount: r.FavoritedUsers.length,
          isFavorited: req.user && req.user.FavoritedRestaurants.map(d => d.id).includes(r.id)
        }))
          .sort((a, b) => b.favoritedCount - a.favoritedCount)

        restaurants = restaurants.slice(0, 10)

        return cb(null, { restaurants })
      })
      .catch(err => cb(err))
  }
}
module.exports = restaurantServices
