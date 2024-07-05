// controller 處理流程控制，負責接收資料來源及整理回傳結果

const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    // 這裡的 (err, data)，對應到的是 getRestaurants 第二個參數，也就是 cb 函式
    // 代表的是呼叫一個 callback 函式
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.json(data))
  }
}
module.exports = restaurantController
