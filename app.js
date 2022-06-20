//jshint esversion:6


require("dotenv").config(); //it must be required at the top.
// declaring all in one "const" with comma
const express = require("express"),
    bodyParser = require("body-parser"),
    ejs = require("ejs"),
    mongoose = require("mongoose"),
    session = require("express-session"),
    passport = require("passport"),
    passportLocalMongoose = require("passport-local-mongoose"),
    GoogleStrategy = require("passport-google-oauth20").Strategy, //for google-Oauth20
    findOrCreate = require("mongoose-findorcreate"),
    FacebookStrategy = require("passport-facebook");


const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


//--------------SETTING COOKIES, immediately when the apps are set--------------

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
    //cookie: { secure: true }
  }))


  // ----------SETTING PASSPORT, right after cookies is set-------------------

  app.use(passport.initialize()); // to set up passsort and initialize passport package
  app.use(passport.session()); // set up passport to use session OR the code below, both work fine.
  //app.use(passport.authenticate('session'));

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true })


const userSchema = new mongoose.Schema({
    // provider: {
    //     type: String,
    //     required: true
    // },
    // googleId: String,
    // facebookId: String,
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose); // to hash and salt user's password and store them in mongodb database
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //to create local strategy to authenticate user using their name and password

// Right below User, we set the passport for sessions to create and destroy it.

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, email: user.email });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});


//google Oauth20
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" //in case of deprecation
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ provider: profile.provider, googleId: profile.id }, function (err, user) { // I downloaded npm package for the findOrCreate method for it to work.
      return cb(err, user);
    });
  }
));



//--------FACEBOOK OAUTH-----------
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ provider: profile.provider, facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// HOME ROUTE
app.get("/", function (req, res) {
    res.render("home");
});

// ---------GOOGLE AUTHENTICATION-----------
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/secrets");
  });



  //--------FACEBOOK AUTHENTICATION-----------
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/secrets");
  });




app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

app.get("/secrets", (req, res) => {
   //The secret page doesn't need an authentication before it can be viewed, but whosoever wants to add a secret must register 
   // before he/she can add.
   // So I'm just go fetch all the secrets in my database whenever a user goes to the secret route.
   User.find({secret: {$ne: null}}, function(err, foundUsers) {
    if(err) {
        console.log(err);
    } else {
        if(foundUsers) {
            res.render("secrets", {usersWithSecrets: foundUsers})
        }
    }
   });
});


app.get("/submit", (req, res) => {
    if(req.isAuthenticated()) { 
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});


app.post("/submit", (req, res) => {
    
    const submittedSecret = req.body.secret;

    
    User.findById(req.user.id, function(err, foundUser) {
        
        if(err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function() {
                    res.redirect("/secrets");
                });
            }
        }
    });
});


app.post("/register", (req, res) => {

   User.register({username: req.body.username}, req.body.password, function(err,user){ // the "username" key is stored in db(to save the email as its value) instead of email
    if(err){
        console.log(err);
        res.redirect("/register");
    } else {
        passport.authenticate("local")(req, res, function() { // the local authentication(passport-local-mongoose) is used instead, to prevent direct interaction to tht db.
            res.redirect("/secrets"); // res.render is not used, because even the user types the secret route into the browser, he
            //should be able to view the secret page since the authentication is still valid and the session is still active.
            //Note: the secret route is created up there, so that the redirect method can work.
        });
    }
   });

    

});


app.post("/login", function (req, res) {
   
    const user = new User({
        username: req.body.username,
        password: req.body.passport
    });

    req.login(user, function(err){ //req.login is passport method
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    })



});






app.listen(3000, function () {
    console.log("Server started on port 3000");
});



// Movies
// Immitation game


//Books
// The code books


