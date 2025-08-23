const mongoose = require('mongoose');


const postSchema = mongoose.Schema({

    content : String,
    contentImage : {
        type : String
    },
    date : {
        type : Date,
        default : Date.now
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "users"
    },
    likes : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "users"
        }
    ]

})

module.exports = mongoose.model("posts",postSchema);