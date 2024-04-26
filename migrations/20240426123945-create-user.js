'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      // id 是 sequelize 自動生成的
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      // 在命名的時候，如果要跟資料庫做溝通，密名方式要注意，一般 JS 是用駝峰是命名，但資料庫可能有自己的規範，所以可以設定 underscored
      // 另外資料庫通常都會有建立、更新時間，以便後續資料檢查，使用 log 可以看到資料的建立、更新時間，也是 sequelize 自動生成
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Users')
  }
}
