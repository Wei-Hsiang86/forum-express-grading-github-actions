const { User, Restaurant, Comment } = require('../models')

const commentServices = {
  postComment: (req, cb) => {
    const { restaurantId, text } = req.body
    // 在 req 眾多內容物中，找到 user 的物件，其中有一些相關資訊
    const userId = req.user.id

    if (!text) throw new Error('Comment text is required!')

    return Promise.all([
      // 一樣先反查，因為要確認建立關係的對象是否存在
      User.findByPk(userId),
      Restaurant.findByPk(restaurantId)
    ])
      .then(([user, restaurant]) => {
        // 反查
        if (!user) throw new Error("User didn't exist!")
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return Comment.create({
          text,
          restaurantId,
          userId
        })
      })
      .then(newComment => cb(null, { newComment }))
      // console.log(newComment)
      // 可以用這個來檢查傳送的內容是甚麼
      .catch(err => cb(err))
  },
  deleteComment: (req, cb) => {
    return Comment.findByPk(req.params.id)
      .then(comment => {
        if (!comment) throw new Error("Comment didn't exist!")
        return comment.destroy()
      })
      .then(deletedComment => cb(null, { deletedComment }))
      .catch(err => cb(err))
  }
}

module.exports = commentServices
