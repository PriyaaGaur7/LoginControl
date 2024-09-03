require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const routeIndex = require("./Routes/index");
const routeUser = require("./Routes/users");
const User = require('./model/User');
const app = express();

// Passport Config
require('./config/passport')(passport);

// DB Config
const mongoUri = process.env.MONGO_URI;

//console.log('MONGO_URI:', mongoUri); 

if (!mongoUri) {
    console.error('Error: MONGO_URI is not defined in your environment variables');
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Connection error:', err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// BodyParser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: true,
  saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', routeIndex);
app.use('/users', routeUser);

function ensureAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/users/login');
}

app.get('/', (req, res) => res.render('welcome'));

// Protected route (Dashboard)
app.get('/dashboard', ensureAuth, (req, res) => {
    res.render('dashboard', { user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server started on PORT ${PORT}`));
