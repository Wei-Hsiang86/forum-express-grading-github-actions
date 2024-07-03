// services 負責與 DB 溝通，或者說負責商業邏輯運算

const { Restaurant, Category } = require('../models')
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

        // 第一個參數代表如果錯誤，要傳遞的值
        return cb(null, {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })

      // 因為有傳遞的值了，所以這裡就用 cb 把錯誤往外拋
      .catch(err => cb(err))
  }
}
module.exports = restaurantServices
