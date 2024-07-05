const { Restaurant, Category } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const adminServices = {
  getRestaurants: (req, cb) => {
    // 分頁器設定
    const DEFAULT_LIMIT = 10
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    Restaurant.findAndCountAll({
      // 使用 raw，因為後續不需要繼續操作 sequelize，所以不用取得他幫我們包好的物件，只要單純的 json 格式就好
      raw: true,
      // 會讓底下的物件巢狀包起來
      nest: true,
      limit,
      offset,
      // 把有關聯的資料都引入進來
      include: [Category]
    })
      // 如果物件的名字，和其屬性名稱一樣，那就可以簡寫成下面那樣
      .then(restaurants => {
        return cb(null, {
          restaurants: restaurants.rows,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => cb(err))
  }
}

module.exports = adminServices
