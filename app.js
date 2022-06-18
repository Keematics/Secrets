//jshint esversion:6


require("dotenv").config(); //it must be required at the top.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const md5 = require("md5"); // for hashing
//const encrypt = require("mongoose-encryption"); //to encrypt specified fields in the database

const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true })


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//console.log(md5("Hello world!"));

//------LEVEL 2 - ENCRYPTION----------
//This has to be declared before the model
//const secret = process.env.SECRET_KEY;
// console.log(secret);
//userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

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
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password) // to turn the password to irreversible hash
    });

    newUser.save((err) => {
        if (err) {
            console.log(err);
        } else {
            res.render("secrets");
        }
    });

});


app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({ email: username }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                //-------LEVEL 1 - username and password --------------
                if (foundUser.password === password) {
                    res.render("secrets");
                } else {
                    res.send("Your password is incorrect.");
                }
            }
        }
    });
});






app.listen(3000, function () {
    console.log("Server started on port 3000");
});



// Movies
// Immitation game


//Books
// The code books


