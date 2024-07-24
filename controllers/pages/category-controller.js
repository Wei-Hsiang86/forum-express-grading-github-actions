const { Category } = require('../../models')
const categoryServices = require('../../services/category-services')

const categoryController = {
  getCategories: (req, res, next) => {
    categoryServices.getCategories(req, (err, data) => err ? next(err) : res.render('admin/categories', data))
  },
  postCategories: (req, res, next) => {
    // console.log(req.body)
    const { name } = req.body

    if (!name) throw new Error('Category name is required!')

    return Category.create({ name })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
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
    return Category.findByPk(req.params.id)
      .then(category => {
        if (!category) throw new Error("Category didn't exist!") // 反查，確認要刪除的類別存在，再進行下面刪除動作

        return category.destroy()
      })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
  }
}
module.exports = categoryController
