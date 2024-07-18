const passport = require('../config/passport') // 引入 passport

// const authenticated = passport.authenticate('jwt', { session: false })
// 這樣前端會接到的是純字串的 unauthorized，而非 json 物件
const authenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) return res.status(401).json({ status: 'error', message: 'unauthorized' })

    // console.log(req.user)
    // 因為如果有 callback，這時候就要自行處理成功驗證的部分
    // 不然會得到 permission denied
    // 因為 req.user = undefined
    req.user = user

    next()
  })(req, res, next)
  // 第二個括號是高階函式，因為 passport.authenticate 會回傳一個 function
  // 如果要調用回傳的 function 就必須要給括號使用
}

const authenticatedAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next()

  return res.status(403).json({ status: 'error', message: 'permission denied' })
}

module.exports = {
  authenticated,
  authenticatedAdmin
}
