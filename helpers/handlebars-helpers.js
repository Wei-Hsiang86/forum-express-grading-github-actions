const dayjs = require('dayjs')

module.exports = {
  currentYear: () => dayjs().year(),

  // 注意這裡不能用箭頭函式，因為箭頭函式的 this 會指到外層的那個 this (module.exports 外的那層)
  ifCond: function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this)
  }
}
