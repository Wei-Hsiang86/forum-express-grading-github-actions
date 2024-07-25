const categoryServices = require('../../services/category-services')

const categoryController = {
  getCategories: (req, res, next) => {
    categoryServices.getCategories(req, (err, data) => err ? next(err) : res.render('admin/categories', data))
  },
  postCategories: (req, res, next) => {
    categoryServices.postCategories(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'category was successfully created')
      req.session.updatedData = data
      res.redirect('/admin/categories')
    })
  },
  putCategory: (req, res, next) => {
    categoryServices.putCategory(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'category was successfully to update')
      req.session.updatedData = data
      res.redirect('/admin/categories')
    })
  },
  deleteCategory: (req, res, next) => {
    categoryServices.deleteCategory(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'category was deleted')
      req.session.updatedData = data
      res.redirect('/admin/categories')
    })
  }
}
module.exports = categoryController
