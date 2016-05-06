// Copyright (c) 2016, GreenBot
var express = require('express')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var serveStatic = require('serve-static')
var MongoClient = require('mongodb').MongoClient
var assert = require('assert')
var session = require('express-session')
var flash = require('connect-flash')
var RedisStore = require('connect-redis')(session)

var app = express()
global.app = app

// Start the express application and make it global
app.set('view engine', 'pug')
app.set('views', process.cwd() + '/cloud/views/') // Specify the folder to find templates
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

require('./cloud/routes')

// Connection URL
var url = 'mongodb://localhost:27017/greenbot'
MongoClient.connect(url, function (err, db) {
  assert(!err)
  app.locals.dbClient = db
  // require('express-trace')(app)
  app.listen(3004)
})
