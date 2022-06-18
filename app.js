//jshint esversion:6


require("dotenv").config(); //it must be required at the top.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true })


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model("User", userSchema);


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/register", (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) { // the method generates the hash password and save it as "hash"
        // which is the saved in the password key in db.
        const newUser = new User({
            email: req.body.username,
            password: hash // the hash generated
        });
    
        newUser.save((err) => {
            if (err) {
                console.log(err);
            } else {
                res.render("secrets");
            }
        });
    });

    

});


app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result) { // It compares the typed in password to the
                    // the one in database, stores the result as "result", if the comparison is true, it then renders the
                    // secret page to the user.
                   if (result === true) {
                       res.render("secrets");
                   } else {
                    res.send("Your password is incorrect.");
                   }
                });
                }
            }
        }
    );
});






app.listen(3000, function () {
    console.log("Server started on port 3000");
});



// Movies
// Immitation game


//Books
// The code books


