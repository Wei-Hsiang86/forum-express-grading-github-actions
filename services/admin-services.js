const { Restaurant, Category } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const { localFileHandler } = require('../helpers/file-helpers')

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
  },
  postRestaurant: (req, cb) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    // 從 req.body 拿出表單裡的資料。名字是依照 input 中 name 屬性的設定
    // 並且一樣用解構賦值的方式撰寫，避免過多的程式碼

    if (!name) throw new Error('Restaurant name is required!') // name 是必填，若發先是空值就會終止程式碼，並在畫面顯示錯誤提示

    // 因為 content-type 有設定成 multipart/form-data，他會把 req 拆成兩部分 req.body, req.file
    const { file } = req

    localFileHandler(file)
      .then(filePath => Restaurant.create({ // 產生一個新的 Restaurant 物件實例，並存入資料庫
        name,
        tel,
        address,
        openingHours,
        description,
        image: filePath || null,
        categoryId
      }))
      .then(newRestaurant => cb(null, { restaurant: newRestaurant }))
      .catch(err => cb(err))
  },
  deleteRestaurant: (req, cb) => {
    return Restaurant.findByPk(req.params.id)
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return restaurant.destroy()
      })
      .then(deletedRestaurant => cb(null, { restaurant: deletedRestaurant }))
      .catch(err => cb(err))
  }
}

module.exports = adminServices
