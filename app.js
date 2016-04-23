// Copyright (c) 2016, GreenBot
var express = require('express')
var bodyParser = require('body-parser')
var multer = require('multer')
var cookieParser = require('cookie-parser')
var serveStatic = require('serve-static')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var MongoClient = require('mongodb').MongoClient
var assert = require('assert')
var session = require('express-session')
var flash = require('connect-flash')
var bcrypt = require('bcryptjs')
var crypto = require('crypto')
var redis = require('redis')
var RedisStore = require('connect-redis')(session)

// Start the express application and make it global
var app = express()
global.app = app
app.set('view engine', 'pug')
app.set('views', process.cwd() + '/cloud/views/') // Specify the folder to find templates

// Middleware declations
app.use(serveStatic('public'))
app.use(cookieParser())
app.use(session({
  secret: 'nantucket sleigh ride',
  resave: false,
  saveUninitialized: true,
  store: new RedisStore({url: 'redis://127.0.0.1:6379/0'})
}))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(flash())

// Authentication
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(
  function (username, password, done) {
    var users = app.locals.dbClient.collection('users')
    var query = users.find({'emails.address': username}).limit(1).next()
    query.then(function (user) {
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' })
      }
      // This is a real user. Does the password match?
      var bcryptPass = user.services.password.bcrypt
      var hash = crypto.createHash('sha256')
      hash.update(password)
      var hashedPass = hash.digest('hex')
      var matches = bcrypt.compareSync(hashedPass, bcryptPass)
      if (matches) {
        done(null, user)
      } else {
        return done(null, false, {message: 'Incorrect password.'})
      }
    })
    query.catch(function (err) {
      return done(err)
    })
  })
)
passport.serializeUser(function (user, done) {
  done(null, user._id)
})
passport.deserializeUser(function (id, done) {
  var users = app.locals.dbClient.collection('users')
  var query = users.find({'_id': id}).limit(1).next()
  query.then(function (user) {
    done(null, user)
  })
})

var session = require('./cloud/routes/session')
var toplevel = require('./cloud/routes/toplevel')
var conversation = require('./cloud/routes/conversation')
var config = require('./cloud/routes/config')
var network = require('./cloud/routes/networks')

app.post('/login',
  passport.authenticate('local', { successRedirect: '/portal',
                                   failureRedirect: '/login',
                                   failureFlash: false }))

// Connection URL
var url = 'mongodb://localhost:27017/greenbot'
MongoClient.connect(url, function (err, db) {
  assert(!err)
  app.locals.dbClient = db
  // require('express-trace')(app)
  app.listen(3004)
})