const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const userSchema = mongoose.Schema({
    name : String,
    age : Number,
    profilePic : {  
        type : String,
        default : "default.png"
    },
    username : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    posts : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "posts"
        }
    ]
})

module.exports = mongoose.model("users",userSchema);