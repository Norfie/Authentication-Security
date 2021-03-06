require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.set('view engine', 'ejs');

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://Jane_Maltseva:" + process.env.MONGODB_PASS + "@cluster0.xkqr6.mongodb.net/usersDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);

const usersSchema = new mongoose.Schema ({
  email: String,
  password: String,
  secret: []
});

usersSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", usersSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  res.render("home");
});

app.get("/secrets", function(req, res){

  User.find({"secret": {$ne: null}}, function (err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {userWithSecrets: foundUsers});
      }
    }
  });
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.route("/register")

.get(function(req, res){

  res.render("register");

})

.post(function (req,res) {

  User.register({ username: req.body.username }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      })
    }
  });
});

app.route("/login")

.get(function(req, res){
  res.render("login");
})

.post(function(req,res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
  if (err) {
    console.log(err);
  } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      })
    }
  });
});

app.route("/submit")

.get(function(req, res){

  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }

})

.post(function (req,res) {

  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret.push(submittedSecret);
        foundUser.save(function () {
          res.redirect("/secrets");
        })
      }
    }
  });


});

app.listen(2500, function(){
  console.log("Server started on port 2500.");
});
