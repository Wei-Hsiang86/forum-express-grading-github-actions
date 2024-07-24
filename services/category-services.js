const { Category } = require('../models')

const categoryServices = {
  getCategories: (req, cb) => {
    return Promise.all([
      Category.findAll({ raw: true }),
      req.params.id ? Category.findByPk(req.params.id, { raw: true }) : null
    ])
      .then(([categories, category]) => {
        cb(null, {
          categories,
          category
        })
      })
      .catch(err => cb(err))
  },
  postCategories: (req, res, next) => {
    // console.log(req.body)
    const { name } = req.body

    if (!name) throw new Error('Category name is required!')

    return Category.create({ name })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
  },
  putCategory: (req, cb) => {
    const { name } = req.body
    // console.log(req.body)

    if (!name) throw new Error('Category name is required!')

    return Category.findByPk(req.params.id)
      .then(category => {
        if (!category) throw new Error("Category doesn't exist!")

        return category.update({ name })
      })
      .then(editedCategory => cb(null, { editedCategory }))
      .catch(err => cb(err))
  }
}

module.exports = categoryServices
