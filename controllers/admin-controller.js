const { Restaurant } = require('../models') // 解構賦值，等於下面兩行
// const db = require('../models')
// const Restaurant = db.Restaurant

const adminController = {
  getRestaurants: (req, res, next) => {
    Restaurant.findAll({
      raw: true
      // 使用 raw，因為後續不需要繼續操作 sequelize，所以不用取得他幫我們包好的物件，只要單純的 json 格式就好
    })
      .then(restaurants => res.render('admin/restaurants', { restaurants }))
      // 如果物件的名字，和其屬性名稱一樣，那就可以簡寫成上面那樣
      .catch(err => next(err))
  }
}

module.exports = adminController
