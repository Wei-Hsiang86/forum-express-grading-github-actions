// 專門來幫我們處理各種和使用者身分驗證相關的事情，來達到權責分離
const getUser = req => {
  return req.user || null
}
module.exports = {
  getUser
}
