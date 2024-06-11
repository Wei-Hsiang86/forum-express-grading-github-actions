module.exports = {
  generalErrorHandler (err, req, res, next) {
    if (req.user.id !== Number(req.params.id)) {
      req.flash('error_messages', '只能編輯自己的資料！')
      res.redirect(`/users/${req.user.id}`)

      next(err)
    }

    // 判斷是否為 Error 物件
    if (err instanceof Error) {
      // Error 物件有固定的格式，name 是 error 的 type；message 是設定的 error 訊息
      req.flash('error_messages', `${err.name}: ${err.message}`)
    } else {
      req.flash('error_messages', `${err}`)
    }

    // 重導回前一頁
    res.redirect('back')

    next(err)
  }
}
