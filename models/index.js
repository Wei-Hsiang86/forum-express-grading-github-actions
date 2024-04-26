'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const basename = path.basename(__filename)
const env = process.env.NODE_ENV || 'development'
const config = require(path.resolve(__dirname, '../config/config.json'))[env]
const db = {}

// 資料庫連線 (sequelize 實體)
// 如果在 config 資料夾內，有一個 use_env_variable 檔案
// 那會優先根據檔案內設定的環境變數，來決定連線資料庫的參數
// 而不是之前在 config.json 寫的那些設定
let sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config)
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config)
}

// 動態引入其他 models
// fs (file system) 是 Nodejs 用來處理檔案的函式
// __dirname，代表目前這支檔案所在的資料夾
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)
    db[model.name] = model
  })

// 設定 Models 之間的關聯
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

// 匯出需要的物件
db.sequelize = sequelize // 是個 instance
db.Sequelize = Sequelize // 是個 class，代表 Sequelize 函式庫本身。class 內有一些屬性

module.exports = db
