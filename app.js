//jshint esversion:6
const express= require("express");
const mongoose= require("mongoose");
const ejs= require("ejs");
const bodyPasrer= require("body-parser");
const encrypt= require("mongoose-encryption");

const app= express();

app.set('view engine','ejs');
app.use(bodyPasrer.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB",{ useNewUrlParser: true ,useUnifiedTopology: true });
const userSchema= new mongoose.Schema({
  email: String,
  password: String
});

const secret= "thisisasecret."

userSchema.plugin(encrypt, { secret: secret ,encryptedFields: ["password"]});

const User= mongoose.model("User",userSchema);
app.get("/",function(req,res){
  res.render("home.ejs");
});

app.get("/login",function(req,res){
  res.render("login.ejs");
});

app.post("/login",function(req,res){
  User.find({email:req.body.username},function(err,foundList){
    if(err){
      res.send(err);
    }
    else{
      console.log(foundList);
      if(foundList[0].password === req.body.password){
        res.render("secrets.ejs");
      }
      else{
        res.send("OOPS! Wrong Password Entered");
      }
    }
  });
});

app.get("/logout",function(req,res){
  res.redirect("/");
});
app.get("/register",function(req,res){
  res.render("register.ejs");
});

app.post("/register",function(req,res){
  const user= new User({
    email: req.body.username,
    password: req.body.password
  });
  user.save(function(err){
    if(err){
      res.send(err);
    }
    else
    {
      res.render("secrets.ejs");
    }
  });
});

app.listen(3000,function(req,res){
  console.log("server has started at port 3000");
});
