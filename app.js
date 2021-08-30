//jshint esversion:6
require("dotenv").config();
const express= require("express");
const mongoose= require("mongoose");
const ejs= require("ejs");
const bodyPasrer= require("body-parser");
const session= require("express-session");
const passport= require("passport");
const passportLocalMongoose= require("passport-local-mongoose");
const findOrCreate= require("mongoose-findorcreate");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const app= express();

app.set('view engine','ejs');
app.use(bodyPasrer.urlencoded({extended:true}));
app.use(express.static("public"));
mongoose.set("useCreateIndex",true);
app.use(session({
  secret:"our littile secret.",
  resave: false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-harshit:Harshit@123@cluster0.0regq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority/userDB",{ useNewUrlParser: true ,useUnifiedTopology: true });

const userSchema= new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User= mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/",function(req,res){
  res.render("home.ejs");
});

app.get("/result",function(req,res){
  res.send("Hello World");
});

app.get("/login",function(req,res){
  res.render("login.ejs");
});

app.post("/login",function(req,res){
  const user = new User({
     username: req.body.username,
     password: req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
    }
    else {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});
app.get("/logout",function(req,res){
  res.redirect("/");
});
app.get("/register",function(req,res){
  res.render("register.ejs");
});

app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(req.body.password);
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    User.find({secret:{$ne:null}},function(err,foundList){
      if(err){
        console.log(err);
      }
      else{
        if(foundList){
        res.render("secrets.ejs",{mySecret: foundList});
        }else{
         res.redirect("/submit");
         }
      }
    });

  }
  else {
    res.redirect("/login");
  }
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit.ejs");
  }
  else {
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  User.findOneAndUpdate({_id:req.user._id},{secret:req.body.secret},function(err){
    if(err){
      console.log(err);
    }
    else{
      res.redirect("/secrets");
    }
  });
});
app.listen(process.env.PORT||3000,function(req,res){
  console.log("server has started at port 3000");
});
