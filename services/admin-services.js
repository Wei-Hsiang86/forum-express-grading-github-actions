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

    // 因為 content-type 有設定成 multipart/form-data，透過 multer 把 req 拆成兩部分 req.body, req.file
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
      .then(newRestaurant => cb(null, { newRestaurant }))
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
  },
  getRestaurant: (req, cb) => {
    return Restaurant.findByPk(req.params.id, { // 去資料庫用 id 找一筆資料 (依據路徑的名字為屬性名稱)
      raw: true, // 找到以後整理格式再回傳
      nest: true,
      include: [Category]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!") //  如果找不到，回傳錯誤訊息，後面不執行

        return cb(null, { restaurant })
      })
      .catch(err => cb(err))
  },
  putRestaurant: (req, cb) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    // 一樣確保 name 欄位有填入資料
    if (!name) throw new Error('Restaurant name is required!')

    // console.log(file)
    const { file } = req // 把檔案取出來

    Promise.all([ // 非同步處理，只須等最久的那個就好(類似平行處理)
      Restaurant.findByPk(req.params.id), // 去資料庫查有沒有這間餐廳
      localFileHandler(file) // 把檔案傳到 file-helper 處理
    ])
      .then(([restaurant, filePath]) => { // 以上兩樣事都做完以後
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return restaurant.update({ // 修改這筆資料
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || restaurant.image, // 如果 filePath 是 Truthy (使用者有上傳新照片) 就用 filePath，是 Falsy (使用者沒有上傳新照片) 就沿用原本資料庫內的值
          categoryId
        })
      })
      .then(editedRestaurant => cb(null, { editedRestaurant }))
      .catch(err => cb(err))
  }
}

module.exports = adminServices
