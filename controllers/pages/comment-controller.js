const commentServices = require('../../services/comment-services')

const commentController = {
  postComment: (req, res, next) => {
    commentServices.postComment(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'Commented!!')
      req.session.updatedData = data
      res.redirect(`/restaurants/${data.newComment.dataValues.restaurantId}`)
    })
  },
  deleteComment: (req, res, next) => {
    commentServices.deleteComment(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'Comment has been deleted!!')
      req.session.updatedData = data
      res.redirect(`/restaurants/${data.deletedComment.dataValues.restaurantId}`)
    })
  }
}
module.exports = commentController
