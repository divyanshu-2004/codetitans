const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect("mongodb://localhost:27017/secrets")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

const secretSchema = new mongoose.Schema({
    email:String,
    content: String
});
var mail = "";
const Secret = mongoose.model("Secret", secretSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    mail = username;
    const foundUser = await User.findOne({ email: username }).exec();
    if (!foundUser) {
        return res.status(401).send("User not found");
    }
    if (foundUser.password === password) {
        const secrets = await Secret.find({ email: mail }).exec();
        res.render("secrets", {secrets:[]});
    } else {
        res.status(401).send("Invalid password");
    }
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    try {
        const foundUser = await User.findOne({ email: req.body.username }).exec();
        if (foundUser) {
            return res.status(401).send("User Already Exist");
        }
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        mail = req.body.username;
        await newUser.save();
        res.redirect("secrets");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error registering user.");
    }
});

app.get("/submit", (req, res) => {
    res.render("submit");
});


app.post("/submit", async (req, res) => {
    const { secret } = req.body;
    try {
        const newSecret = new Secret({email: mail,content: secret });
        await newSecret.save();
        res.redirect("/secrets");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error submitting secret.");
    }
});
app.get("/secrets", async (req, res) => {
    try {
        if (!mail) {
            return res.status(400).send("Email is required");
        }
    
        const secrets = await Secret.find({ email: mail }).exec();
        res.render("secrets", { secrets: secrets || [] });
    } catch (error) {
        console.error("Error fetching secrets:", error);
        res.status(500).send("Internal Server Error");
    }
    
});

app.get("/logout", (req, res) => {
    res.redirect("/");
});


app.listen(5000, () => {
    console.log("Server started on port 5000");
});