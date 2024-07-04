var express = require('express');
var router = express.Router();
const passport = require('passport');
const User = require('./users'); // Adjust the path as per your file structure
const Post = require('./posts');
const flash = require("connect-flash");
const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(User.authenticate()));
const upload = require("./multer");

/* GET home page. */
router.get('/', function(req, res, next) {
  // Render the home page with any error messages from flash
  res.render('index',  { error: req.flash('error') || [] });
});

router.get("/register",function(req, res){
  res.render("register")
})
router.post('/upload', isLoggedIn, upload.single("file"), async function(req, res, next) {
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  try {
    // Create a new post with the uploaded file, caption, and user ID
    let createdPost = await Post.create({
      image: req.file.filename,
      caption: req.body.caption,
      user: req.user._id
    });
    // Find the user and add the post ID to their list of posts
    let user = await User.findById(req.user._id);
    user.post.push(createdPost._id);
    await user.save();
    // Redirect to the user's profile page
    res.redirect(`/profile/${req.user.username}`);
  } catch (err) {
    console.log("Something went wrong!!", err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/delete/:id",isLoggedIn,async function(req, res){
  try{
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { post: req.params.id }
    });
    res.redirect("/profile")
  }
  catch(err){
    return res.status(404).send("Something went wrong")
  }
})
router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile', // Redirect to profile on successful login
  failureRedirect: '/', // Redirect to home on login failure
  failureFlash: true // Enable flash messages for login errors
}));

router.post('/register', function(req, res) {
  const { username, email, password } = req.body;
  // Register a new user with the provided username, email, and password
  User.register(new User({ username, email }), password, function(err, user) {
    if (err) {
      console.error(err);
      // Render the home page with error message if registration fails
      return res.render('index', { error: err });
    }
    // Authenticate the user and redirect to profile on successful registration
    passport.authenticate('local')(req, res, function() {
      res.redirect('/profile');
    });
  });
});

// GET profile page (protected)
router.get('/profile', isLoggedIn, function(req, res) {
  // Redirect to the profile page with the username in the URL
  res.redirect(`/profile/${req.user.username}`);
});

router.get("/profile/:user", isLoggedIn, async function(req, res) {
  try {
    // Find the user by ID and populate their posts
    const user = await User.findById(req.user._id).populate('post'); // Ensure 'post' matches your schema
    const posts = user.post; // 'user.post' should be an array of posts
    // console.log(posts)
    // Render the profile page with user and posts data
    res.render('profile', { user: user, posts: posts });
  } catch (err) {
    console.log("Error fetching profile data:", err);
    // Redirect to home page on error
    res.redirect("/");
  }
});

// GET logout
router.get('/logout', function(req, res) {
  // Logout the user and redirect to home page
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

module.exports = router;
