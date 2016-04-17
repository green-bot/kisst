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

// Our local files
var conversation = require('./cloud/routes/conversation')
var config = require('./cloud/routes/config')
var network = require('./cloud/routes/networks')

// Start the express application
var app = express()
app.use(serveStatic('public'))
app.use(cookieParser())
app.use(session({
  secret: 'nantucket sleigh ride',
  resave: false,
  saveUninitialized: true
}))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(flash())
app.use(passport.initialize())
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

app.post('/login',
  passport.authenticate('local', { successRedirect: '/portal',
                                   failureRedirect: '/login',
                                   failureFlash: false }))
                                   

app.get('/login', function (req, res) {
  res.render('login')
})

app.use('/portal', function (req, res, next) {
  console.log('This should be validated')
  next()
})

app.set('view engine', 'pug')
app.set('views', process.cwd() + '/cloud/views/') // Specify the folder to find templates
app.locals.menu = [{
  id: 'dashboard',
  name: 'Home',
  title: 'Home',
  icon: 'fa-home',
  active: false,
  url: '/'
}, {
  id: 'conversations',
  name: 'Conversations',
  title: 'Conversations',
  icon: 'fa-building-o',
  active: false,
  url: '/conversations'
}, {
  id: 'config',
  name: 'Settings',
  title: 'Settings',
  icon: 'fa-gears',
  active: false,
  url: '/config'
}, {
  id: 'help',
  name: 'Help',
  title: 'Help',
  icon: 'fa-question-circle',
  active: false,
  url: 'http://kisst.zendesk.com'
}, {
  id: 'share',
  name: 'Share',
  title: 'Share',
  icon: 'fa-share',
  active: false,
  url: 'http://kisst.zendesk.com'
}, {
  id: 'logout',
  name: 'Logout',
  title: 'Logout',
  icon: 'fa-sign-out',
  active: false,
  url: '/logout'
}]

app.get('/portal', function (req, res) {
  res.render('dashboard', {
    menus: app.locals.menu,
    current_room: req.session.roomName,
    current_keyword: req.session.selectedKeyword
  })
})

app.get('/portal/config/owners', config.owners)
app.get('/portal/config/owner_delete', config.owner_delete)
app.post('/portal/config/owner_add', config.owner_add)
app.get('/portal/config/notification_emails', config.notification_emails)
app.get('/portal/config/notification_email_delete', config.notification_email_delete)
app.post('/portal/config/notification_email_add', config.notification_email_add)
app.post('/portal/config/notification_creds_update', config.notification_creds_update)
app.get('/portal/config/type', config.type)
app.get('/portal/conversations', conversation.list)
app.get('/portal/conversations/download', conversation.download_csv)
app.get('/portal/conversations/:id', conversation.read)
app.get('/portal/config/info', config.info)
app.get('/portal/config', config.list)
app.get('/portal/config/edit', config.edit)
app.post('/portal/config/save', config.save)
app.post('/reset_request', config.reset_request)
app.get('/portal/settings', config.settings)
app.get('/portal/config/rooms', config.rooms)
app.get('/portal/config/change_room', config.change_room)
app.get('/portal/config/type_change/:id', config.type_change)
app.get('/portal/config/networks', network.networks)
app.post('/portal/config/network_update', network.network_update)
app.get('/portal/config/add_number', network.add_number)
app.get('/portal/config/nexmo', function (req, res) {
  res.render('nexmo')
})
app.get('/reset_page', function (req, res) {
  res.render('reset_page')
})
app.get('/register', function (req, res) {
  res.render('register')
})

// Connection URL
var url = 'mongodb://localhost:27017/greenbot'
MongoClient.connect(url, function (err, db) {
  assert(!err)
  app.locals.dbClient = db
  require('express-trace')(app)
  app.listen(3004)
})
