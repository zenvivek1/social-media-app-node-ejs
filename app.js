const express = require('express');
const app = express();
const path = require('path')
const userModel = require('./models/users');
const postModel = require('./models/posts');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const upload = require('./config/multerconfig')


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/register', (req, res) => {
    res.render("index");
})

app.post('/create', async (req, res) => {

    const { name, age, username, password, email } = req.body;
    // if(email.trim()===""){
    //     document.alert("Email is required!")
    // }
    let user = await userModel.findOne({ email });
    if (user) return res.status(500).send("User is already created");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let createdUser = await userModel.create({
                name, age, username, password: hash, email
            })
            let token = await jwt.sign({ email, userid: createdUser._id }, "shhhh");
            res.cookie("token", token);
            res.redirect("/profile")
        })
    })
})

app.get("/loginpage", (req, res) => {
    res.render("login");
})
app.get("/profile", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("posts");
    res.render("profile", { user })
    // console.log(user)
})
app.get("/publicprofile/:user", async (req, res) => {
    
    let user = await userModel.findOne({name : req.params.user}).populate("posts");
    if(!user){
        res.redirect("/")
    }
    res.render("publicprofile",{user})
})



app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (user) {
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                let token = jwt.sign({ email: user.email, userid: user._id }, "shhhh");
                res.cookie("token", token);
                res.redirect("/profile");
            }
            else {
                return res.status(400).send("Something Went Wrong");
            }
        })
    }
    else {
        return res.status(400).send("Something Went Wrong");
    }

})

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/")
})

app.post("/createpost", isLoggedIn, async (req, res) => {
    const { content } = req.body

    let user = await userModel.findOne({ email: req.user.email })
    // console.log(user)
    const post = await postModel.create({
        content,
        user: user._id
    })
    user.posts.push(post)
    await user.save()
    res.redirect("/profile")
})

app.get("/", async (req, res) => {
    let userLog = false;
    if (req.cookies.token) {
        if (req.cookies.token === "") {
            userLog = false
        }
        else {
            try {
                jwt.verify(req.cookies.token, "shhhh", (err, decoded) => {

                    if (err) throw new err
                    const user = userModel.findOne({ email: decoded.email })
                    if (user) {
                        userLog = true
                    }
                })
            } catch (err) {
                console.error("JWT error:", err.message);
                return res.status(401).send("Invalid or expired token");
            }
        }
    }
    const allPosts = await postModel.find().populate("user");
    res.render("feed", { allPosts, userLog })
})

app.post("/liked/:likedpost/:redloc", isLoggedIn, async (req, res) => { 

    const user = await userModel.findOne({ email: req.user.email })
    const post = await postModel.findOne({ _id: req.params.likedpost })

    const alreadyLiked = post.likes.some(id => id.equals(user._id))

    if (!alreadyLiked) {
        post.likes.push(user._id)
        await post.save()
    }
    if(req.params.redloc=="feed"){
        res.redirect("/")
    }
    res.redirect(req.get("referer"));   
})
// app.post("/unlike",isLoggedIn,async (req,res)=>{

//     const user = await userModel.findOne({email : req.user.email})
//     posts.likes.pop(user)
// })
app.get("/edit/:postid",async function(req,res){
    const post = await postModel.findOne({_id : req.params.postid})
    res.render("editpost",{post})
})
app.post("/editpost/:postid",async function(req,res){
    await postModel.findOneAndUpdate({_id : req.params.postid},{content : req.body.content})
    res.redirect("/profile")
})
app.post("/deletepost/:postid",async function(req,res){
    await postModel.findOneAndDelete({_id : req.params.postid})
    res.redirect("/profile")
})

app.get("/profile/upload", isLoggedIn ,async function(req,res){
    let user = await userModel.findOne({ email: req.user.email }).populate('posts')
    res.render("profileupload",{user})
})
app.post("/uploadprofilepic",isLoggedIn,upload.single('profilepic'),async function(req,res){
    if(req.file){
        let user = await userModel.findOneAndUpdate({ email: req.user.email },{profilePic : req.file.filename})
        res.redirect("/profile")
    }else{
        res.redirect("/profile")
    }
})


function isLoggedIn(req, res, next) {
    if (req.cookies.token) {

        if (req.cookies.token === "") res.redirect('/')
        else {
            jwt.verify(req.cookies.token, "shhhh", (err, decoded) => {
                if (err) {
                    console.error("JWT error:", err.message);
                    return res.status(401).send("Invalid or expired token");
                }
                req.user = decoded
                next();
            })
        }
    } else {
        res.redirect('/loginpage')
    }
}

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;