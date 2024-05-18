const { Restaurant } = require('../models')
// 解構賦值，等於下面兩行
// const db = require('../models')
// const Restaurant = db.Restaurant
const { localFileHandler } = require('../helpers/file-helpers')

const adminController = {
  getRestaurants: (req, res, next) => {
    Restaurant.findAll({
      raw: true
      // 使用 raw，因為後續不需要繼續操作 sequelize，所以不用取得他幫我們包好的物件，只要單純的 json 格式就好
    })
      .then(restaurants => res.render('admin/restaurants', { restaurants }))
      // 如果物件的名字，和其屬性名稱一樣，那就可以簡寫成上面那樣
      .catch(err => next(err))
  },
  createRestaurant: (req, res) => {
    return res.render('admin/create-restaurant')
  },
  postRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description } = req.body
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
        image: filePath || null
      }))
      .then(() => {
        req.flash('success_messages', 'restaurant was successfully created') // 在畫面顯示成功提示
        res.redirect('/admin/restaurants') // 新增完成後導回後台首頁
      })
      .catch(err => next(err))
  },
  getRestaurant: (req, res, next) => {
    Restaurant.findByPk(req.params.id, { // 去資料庫用 id 找一筆資料 (依據路徑的名字為屬性名稱)
      raw: true // 找到以後整理格式再回傳
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!") //  如果找不到，回傳錯誤訊息，後面不執行

        res.render('admin/restaurant', { restaurant })
      })
      .catch(err => next(err))
  },
  editRestaurant: (req, res, next) => {
    Restaurant.findByPk(req.params.id, {
      raw: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        res.render('admin/edit-restaurant', { restaurant })
      })
      .catch(err => next(err))
  },
  putRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description } = req.body
    // 一樣確保 name 欄位有填入資料
    if (!name) throw new Error('Restaurant name is required!')

    const { file } = req // 把檔案取出來

    Promise.all([ // 非同步處理
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
          image: filePath || restaurant.image // 如果 filePath 是 Truthy (使用者有上傳新照片) 就用 filePath，是 Falsy (使用者沒有上傳新照片) 就沿用原本資料庫內的值
        })
      })
      .then(() => {
        req.flash('success_messages', 'restaurant was successfully to update')
        res.redirect('/admin/restaurants')
      })
      .catch(err => next(err))
  },
  deleteRestaurant: (req, res, next) => { // 新增以下
    return Restaurant.findByPk(req.params.id)
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return restaurant.destroy()
      })
      .then(() => res.redirect('/admin/restaurants'))
      .catch(err => next(err))
  }
}

module.exports = adminController
