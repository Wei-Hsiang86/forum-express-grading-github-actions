const fs = require('fs') // 引入 fs 模組

const localFileHandler = file => { // file 是 multer 處理完的檔案
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null) // return 就會結束這個 function

    const fileName = `upload/${file.originalname}` // upload 就是對外資料夾的名稱
    return fs.promises.readFile(file.path)
      .then(data => fs.promises.writeFile(fileName, data))
      .then(() => resolve(`/${fileName}`)) // 直接設定為讀取檔案的路徑
      .catch(err => reject(err))
  })
}

module.exports = {
  localFileHandler
}
