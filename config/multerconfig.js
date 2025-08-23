const multer = require('multer')
const crypto = require('crypto')
const path = require('path')

//storage

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //-file destination
        cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
      //-file name using crypto
    crypto.randomBytes(12,function(err,name){
        const fn = name.toString('hex') + path.extname(file.originalname);
        cb(null,fn)
    })
  }
})

//upload variable
const upload = multer({ storage: storage })

//export upload variable
module.exports = upload

