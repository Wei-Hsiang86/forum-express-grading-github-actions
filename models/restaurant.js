'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Restaurant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      Restaurant.belongsTo(models.Category, { foreignKey: 'categoryId' })
      Restaurant.hasMany(models.Comment, { foreignKey: 'restaurantId' })
      Restaurant.belongsToMany(models.User, {
        through: models.Favorite, // sequelize 透過 Favorite 表來找到關聯
        foreignKey: 'restaurantId', // 在 Favorite 表找到目標 FK 其對應的另一個值 (這裡是 userId)
        as: 'FavoritedUsers' // 幫這個關聯取個名稱，也就是餐廳被誰收藏
      })
      Restaurant.belongsToMany(models.User, {
        through: models.Like, // sequelize 透過 Like 表來找到關聯
        foreignKey: 'restaurantId', // 在 Like 表找到目標 FK 其對應的另一個值 (這裡是 userId)
        as: 'LikedUsers' // 幫這個關聯取個名稱，也就是餐廳被誰喜歡
      })
    }
  }
  Restaurant.init({
    name: DataTypes.STRING,
    tel: DataTypes.STRING,
    address: DataTypes.STRING,
    openingHours: DataTypes.STRING,
    description: DataTypes.TEXT,
    image: DataTypes.STRING,
    viewCounts: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Restaurant',
    tableName: 'Restaurants',
    underscored: true
  })
  return Restaurant
}
