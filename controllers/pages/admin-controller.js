const { Restaurant, User, Category } = require('../../models')
// 解構賦值，等於下面幾行
// const db = require('../models')
// const Restaurant = db.Restaurant
// const User = db.User
// ...
const adminServices = require('../../services/admin-services')

const adminController = {
  getRestaurants: (req, res, next) => {
    adminServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('admin/restaurants', data))
  },
  createRestaurant: (req, res, next) => {
    return Category.findAll({
      raw: true
    })
      .then(categories => res.render('admin/create-restaurant', { categories }))
      .catch(err => next(err))
  },
  postRestaurant: (req, res, next) => {
    adminServices.getRestaurants(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'Restaurant was successfully created')
      req.session.createdData = data
      res.redirect('/admin/restaurants')
    })
  },
  getRestaurant: (req, res, next) => {
    adminServices.getRestaurant(req, (err, data) => err ? next(err) : res.render('admin/restaurant', data))
  },
  editRestaurant: (req, res, next) => {
    return Promise.all([
      Restaurant.findByPk(req.params.id, { raw: true }),
      Category.findAll({ raw: true }) // 因為要編輯，所以需要叫出所有餐廳類別
    ])
      .then(([restaurant, categories]) => {
        if (!restaurant) throw new Error("Restaurant doesn't exist!")

        res.render('admin/edit-restaurant', { restaurant, categories })
      })
      .catch(err => next(err))
  },
  putRestaurant: (req, res, next) => {
    adminServices.putRestaurant(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'Restaurant was successfully to update')
      // console.log(data)
      req.session.deletedData = data
      res.redirect('/admin/restaurants')
    })
  },
  deleteRestaurant: (req, res, next) => {
    adminServices.deleteRestaurant(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'Restaurant was deleted')
      res.redirect('/admin/restaurants')
    })
  },
  getUsers: (req, res, next) => {
    return User.findAll({
      raw: true
    })
      .then(users => {
        users.forEach((user, index, newUsers) => {
          if (newUsers[index].isAdmin === 1) {
            newUsers[index].isAdmin = 'admin'
            newUsers[index].switch = 'set as user'
          } else {
            newUsers[index].isAdmin = 'user'
            newUsers[index].switch = 'set as admin'
          }
        })

        res.render('admin/users', { users })
      })
      .catch(err => next(err))
  },
  patchUser: (req, res, next) => {
    // console.log(req.body)
    return User.findByPk(req.params.id)
      .then(user => {
        if (!user) throw new Error("User didn't exist!")
        if (user.email === 'root@example.com') {
          req.flash('error_messages', '禁止變更 root 權限')
          return res.redirect('back')
        }

        return user.update({
          isAdmin: !user.isAdmin
        })
      })
      .then(() => {
        req.flash('success_messages', '使用者權限變更成功')
        res.redirect('/admin/users')
      })
      .catch(err => next(err))
  }
}

module.exports = adminController
